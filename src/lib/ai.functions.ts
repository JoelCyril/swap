import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeItemPhotoWithAI, evaluateTradeFairnessAI, estimateItemTradePoints } from "./ai.server";
import { repairImageUrl, repairImageUrls } from "./image-url-repair.server";

export const autoFillItemFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        imageUrl: z.string().optional(),
        imageBase64: z.string().optional(),
        mimeType: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    return await analyzeItemPhotoWithAI(data);
  });

export const getTradeFairnessScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetListing: z.object({
          title: z.string(),
          category: z.string(),
          condition: z.string(),
          description: z.string().optional(),
        }),
        offeredItems: z.array(
          z.object({
            name: z.string(),
            category: z.string(),
            condition: z.string(),
            description: z.string().optional(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    return await evaluateTradeFairnessAI(data);
  });

export interface SmartMatch {
  my_item: {
    id: string;
    name: string;
    category: string;
    condition: string;
    image_url?: string;
  };
  matched_listing: {
    id: string;
    title: string;
    category: string;
    condition: string;
    looking_for: string;
    location: string;
    emirate: string;
    image_url?: string;
    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      avatar_color?: string;
    };
  };
  match_score: number; // 70 - 99%
  match_reason: string;
}

export const getSmartTradeMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SmartMatch[]> => {
    // 1. Fetch current user's inventory items
    const { data: myItems } = await context.supabase
      .from("items")
      .select("id, name, category, condition, image_urls, status")
      .eq("owner_id", context.userId)
      .neq("status", "swapped");

    // Also fetch user's own active listings
    const { data: myListings } = await context.supabase
      .from("listings")
      .select("id, title, category, condition, image_urls, status")
      .eq("owner_id", context.userId)
      .eq("status", "active");

    const allMyItems = await Promise.all([
      ...(myItems ?? []).map(async (it) => {
        const repaired = await repairImageUrls(it.image_urls);
        return {
          id: it.id,
          name: it.name,
          category: it.category || "Electronics",
          condition: it.condition || "Good",
          image_url: repaired?.[0],
        };
      }),
      ...(myListings ?? []).map(async (l) => {
        const repaired = await repairImageUrls(l.image_urls);
        return {
          id: l.id,
          name: l.title,
          category: l.category || "Electronics",
          condition: l.condition || "Good",
          image_url: repaired?.[0],
        };
      }),
    ]);

    if (allMyItems.length === 0) return [];

    // 2. Fetch active marketplace listings from other users
    const { data: rawOtherListings } = await context.supabase
      .from("listings")
      .select(`
        id,
        owner_id,
        title,
        category,
        condition,
        looking_for,
        location,
        emirate,
        image_urls,
        owner:profiles!listings_owner_profile_fkey(
          id,
          username,
          display_name,
          avatar_url,
          avatar_color
        )
      `)
      .neq("owner_id", context.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!rawOtherListings || rawOtherListings.length === 0) return [];

    const otherListings = await Promise.all(
      rawOtherListings.map(async (l) => ({
        ...l,
        image_urls: await repairImageUrls(l.image_urls),
      })),
    );

    const matches: SmartMatch[] = [];

    // For EACH item the user owns, find the top matched counter-listing
    for (const myItem of allMyItems) {
      const myPoints = estimateItemTradePoints({
        name: myItem.name,
        category: myItem.category,
        condition: myItem.condition,
      });

      let bestMatchForThisItem: { listing: any; score: number; reason: string } | null = null;

      for (const listing of otherListings) {
        const listingPoints = estimateItemTradePoints({
          name: listing.title,
          category: listing.category,
          condition: listing.condition,
        });

        // Value parity score
        const parityRatio = Math.min(myPoints, listingPoints) / Math.max(1, Math.max(myPoints, listingPoints));
        let matchScore = Math.round(parityRatio * 50) + 35; // 35 to 85 base

        const lookingFor = (listing.looking_for || "").toLowerCase();
        const myCategory = myItem.category.toLowerCase();
        const myName = myItem.name.toLowerCase();

        let reason = `Compatible ${myItem.category} value tier.`;

        // Direct looking-for keyword bonus
        if (lookingFor && (lookingFor.includes(myCategory) || lookingFor.includes(myName))) {
          matchScore += 18;
          reason = `Trader is specifically looking for "${myItem.name}" or ${myItem.category}.`;
        } else if (lookingFor.includes("open") || lookingFor.includes("any") || lookingFor.length < 5) {
          matchScore += 8;
          reason = `Trader is open to all offers on "${listing.title}".`;
        }

        // Category affinity bonus
        if (myItem.category === listing.category) {
          matchScore += 10;
          if (!lookingFor.includes(myName)) {
            reason = `Same category trade: both are in ${myItem.category}.`;
          }
        }

        matchScore = Math.min(99, Math.max(70, matchScore));

        if (!bestMatchForThisItem || matchScore > bestMatchForThisItem.score) {
          bestMatchForThisItem = { listing, score: matchScore, reason };
        }
      }

      if (bestMatchForThisItem) {
        matches.push({
          my_item: {
            id: myItem.id,
            name: myItem.name,
            category: myItem.category,
            condition: myItem.condition,
            image_url: myItem.image_url,
          },
          matched_listing: {
            id: bestMatchForThisItem.listing.id,
            title: bestMatchForThisItem.listing.title,
            category: bestMatchForThisItem.listing.category,
            condition: bestMatchForThisItem.listing.condition,
            looking_for: bestMatchForThisItem.listing.looking_for || "Open to offers",
            location: bestMatchForThisItem.listing.location,
            emirate: bestMatchForThisItem.listing.emirate,
            image_url: bestMatchForThisItem.listing.image_urls?.[0],
            owner: (bestMatchForThisItem.listing.owner as any) || {
              id: bestMatchForThisItem.listing.owner_id,
              username: "trader",
              display_name: "SWAP Trader",
            },
          },
          match_score: bestMatchForThisItem.score,
          match_reason: bestMatchForThisItem.reason,
        });
      }
    }

    return matches.sort((a, b) => b.match_score - a.match_score);
  });
