import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeItemPhotoWithAI, evaluateTradeFairnessAI } from "./ai.server";

export const autoFillItemFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ imageUrl: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    return await analyzeItemPhotoWithAI(data.imageUrl);
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

    const allMyItems = [
      ...(myItems ?? []).map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category,
        condition: it.condition,
        image_url: it.image_urls?.[0],
      })),
      ...(myListings ?? []).map((l) => ({
        id: l.id,
        name: l.title,
        category: l.category,
        condition: l.condition,
        image_url: l.image_urls?.[0],
      })),
    ];

    if (allMyItems.length === 0) return [];

    // 2. Fetch active marketplace listings from other users
    const { data: otherListings } = await context.supabase
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
      .limit(40);

    if (!otherListings || otherListings.length === 0) return [];

    const matches: SmartMatch[] = [];
    const seenListingIds = new Set<string>();

    for (const myItem of allMyItems) {
      const myCategory = (myItem.category || "").toLowerCase();
      const myName = (myItem.name || "").toLowerCase();

      for (const listing of otherListings) {
        if (seenListingIds.has(listing.id)) continue;

        const lookingFor = (listing.looking_for || "").toLowerCase();
        const listingCategory = (listing.category || "").toLowerCase();
        const listingTitle = (listing.title || "").toLowerCase();

        let score = 65;
        let reason = `Compatible ${listing.category} trade.`;

        // Check if listing owner is looking for my item category or keywords
        if (lookingFor && (lookingFor.includes(myCategory) || lookingFor.includes(myName))) {
          score += 25;
          reason = `Trader is specifically looking for "${myItem.name}" or ${myItem.category}.`;
        } else if (lookingFor.includes("open") || lookingFor.includes("any") || lookingFor.length < 5) {
          score += 15;
          reason = `Trader is open to all offers on "${listing.title}".`;
        }

        // Category affinity
        if (myCategory === listingCategory) {
          score += 15;
          reason = `Same category trade: both items are in ${myItem.category}.`;
        }

        seenListingIds.add(listing.id);
        matches.push({
          my_item: {
            id: myItem.id,
            name: myItem.name,
            category: myItem.category,
            condition: myItem.condition,
            image_url: myItem.image_url,
          },
          matched_listing: {
            id: listing.id,
            title: listing.title,
            category: listing.category,
            condition: listing.condition,
            looking_for: listing.looking_for || "Open to offers",
            location: listing.location,
            emirate: listing.emirate,
            image_url: listing.image_urls?.[0],
            owner: (listing.owner as any) || {
              id: listing.owner_id,
              username: "trader",
              display_name: "SWAP Trader",
            },
          },
          match_score: Math.min(99, Math.max(75, score)),
          match_reason: reason,
        });

        if (matches.length >= 6) break;
      }
      if (matches.length >= 6) break;
    }

    return matches.sort((a, b) => b.match_score - a.match_score);
  });
