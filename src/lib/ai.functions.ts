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
    // 1. Fetch current user's active inventory items
    const { data: myItems } = await context.supabase
      .from("items")
      .select("id, name, category, condition, image_urls, status")
      .eq("owner_id", context.userId)
      .neq("status", "swapped")
      .limit(10);

    if (!myItems || myItems.length === 0) return [];

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
      .limit(30);

    if (!otherListings || otherListings.length === 0) return [];

    const matches: SmartMatch[] = [];

    for (const myItem of myItems) {
      const myCategory = myItem.category.toLowerCase();
      const myName = myItem.name.toLowerCase();

      for (const listing of otherListings) {
        const lookingFor = (listing.looking_for || "").toLowerCase();
        const listingCategory = listing.category.toLowerCase();
        const listingTitle = listing.title.toLowerCase();

        let score = 0;
        let reason = "";

        // Check if listing owner is looking for my item category or keywords
        if (lookingFor.includes(myCategory) || lookingFor.includes(myName)) {
          score += 45;
          reason = `They are specifically looking for "${myItem.name}" or ${myItem.category}.`;
        } else if (lookingFor.includes("open") || lookingFor.includes("anything") || lookingFor.length < 5) {
          score += 25;
          reason = `They are open to all offers on their "${listing.title}".`;
        }

        // Category cross-affinity bonus (e.g. electronics for electronics)
        if (myCategory === listingCategory) {
          score += 35;
          if (!reason) reason = `Same category trade (${myItem.category}).`;
        }

        if (score >= 40) {
          const finalScore = Math.min(99, Math.max(70, score + 20));
          matches.push({
            my_item: {
              id: myItem.id,
              name: myItem.name,
              category: myItem.category,
              condition: myItem.condition,
              image_url: myItem.image_urls?.[0],
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
            match_score: finalScore,
            match_reason: reason || "High category and value compatibility.",
          });
        }
      }
    }

    // Sort by match score descending
    return matches.sort((a, b) => b.match_score - a.match_score).slice(0, 8);
  });
