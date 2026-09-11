import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeItemPhotoWithAI } from "./ai.server";
import { repairImageUrl, repairImageUrls } from "./image-url-repair.server";
import { batchEstimateAedValues } from "./groq.server";

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

export interface SmartMatch {
  my_item: {
    id: string;
    name: string;
    category: string;
    condition: string;
    image_url?: string;
    estimated_aed?: number;
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
    estimated_aed?: number;
    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      avatar_color?: string;
    };
  };
  match_score: number; // 60 - 99%
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

    // 3. Batch estimate AED values using Groq & local heuristics
    const allForValuation = [
      ...allMyItems.map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category,
        condition: it.condition,
      })),
      ...otherListings.map((l) => ({
        id: l.id,
        name: l.title,
        category: l.category,
        condition: l.condition,
      })),
    ];

    const aedMap = await batchEstimateAedValues(allForValuation);

    const matches: SmartMatch[] = [];

    // For EACH item the user owns, find the top fair matched counter-listing
    for (const myItem of allMyItems) {
      const myAed = aedMap.get(myItem.id) || 100;

      let bestMatchForThisItem: {
        listing: any;
        score: number;
        reason: string;
        listingAed: number;
      } | null = null;

      for (const listing of otherListings) {
        const listingAed = aedMap.get(listing.id) || 100;

        // Rigorous parity ratio: 0 to 1.0
        const minAed = Math.min(myAed, listingAed);
        const maxAed = Math.max(1, Math.max(myAed, listingAed));
        const parityRatio = minAed / maxAed;

        // STRICT PARITY GATE: If the value gap is wider than 40% (parity < 0.60), REJECT MATCH COMPLETELY
        if (parityRatio < 0.6) {
          continue;
        }

        // Base match score from parity (0.60 -> 60, 1.0 -> 90)
        let matchScore = Math.round(parityRatio * 75) + 15;

        const lookingFor = (listing.looking_for || "").toLowerCase();
        const myCategory = myItem.category.toLowerCase();
        const myName = myItem.name.toLowerCase();

        let reason = `Compatible value tier in ${myItem.category}.`;

        // Direct looking-for keyword bonus
        if (lookingFor && (lookingFor.includes(myCategory) || lookingFor.includes(myName))) {
          matchScore += 8;
          reason = `Trader is specifically seeking "${myItem.name}". Direct 2-way match.`;
        } else if (lookingFor.includes("open") || lookingFor.includes("any")) {
          matchScore += 3;
          reason = `Trader is open to offers on "${listing.title}". Well-balanced swap.`;
        } else if (myItem.category === listing.category) {
          matchScore += 4;
          reason = `Both items are in ${myItem.category} with equitable trade value.`;
        }

        // Add slight random jitter (0 to 3 points) so close matches can rotate positions on refresh
        const jitter = Math.floor(Math.random() * 4);
        matchScore = Math.min(98, Math.max(60, matchScore + jitter));

        if (!bestMatchForThisItem || matchScore > bestMatchForThisItem.score) {
          bestMatchForThisItem = { listing, score: matchScore, reason, listingAed };
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

    // Rotate and shuffle order slightly so users see varied fresh trades instead of always the exact same cards
    return matches.sort((a, b) => (b.match_score + (Math.random() * 4 - 2)) - (a.match_score + (Math.random() * 4 - 2)));
  });
