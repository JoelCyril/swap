import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfile } from "./profile.server";
import { moderate } from "./moderation";
import { repairImageUrls, toCachedImageUrl } from "./image-url-repair.server";
import { resolveListingCategory, encodeListingCategory } from "./db-types";

function formatItemOutput(it: any) {
  if (!it) return null;
  const resolved = resolveListingCategory(it);
  return {
    ...resolved,
    image_urls: repairImageUrls(resolved.image_urls),
    owner: resolved.owner
      ? {
          ...resolved.owner,
          avatar_url: toCachedImageUrl(resolved.owner.avatar_url, "avatars"),
        }
      : resolved.owner,
  };
}

function publicClient() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)!;
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const itemSchema = z.object({
  name: z
    .string()
    .min(2, "Item name must be at least 2 characters")
    .max(120)
    .refine((val) => !["item", "new item", "none", "test", "n/a"].includes(val.trim().toLowerCase()), {
      message: "Please provide a specific item name (not just 'item')",
    }),
  category: z.enum([
    "Electronics",
    "Household Items",
    "Clothing",
    "Outdoors",
    "Accessories",
    "Books",
    "Toys",
    "Sports",
    "Cosmetics",
  ]),
  condition: z.enum(["New", "Like New", "Good", "Fair"]),
  image_emoji: z.string().max(8).default("📦"),
  description: z.string().max(1000).optional().nullable(),
  visibility: z.enum(["public", "private"]).default("public"),
  image_urls: z.array(z.string().url()).min(1, "Please upload at least 1 photo of the item").max(8),
});

export const listMyItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("items")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Filter out any items that have been traded/completed in an offer
    const { data: completedOffers } = await context.supabase
      .from("offers")
      .select("offered_item_ids, recipient_item_ids, from_user, to_user, removed_item_ids, removed_recipient_item_ids")
      .eq("status", "completed")
      .or(`from_user.eq.${context.userId},to_user.eq.${context.userId}`);

    const swappedIds = new Set<string>();
    for (const o of completedOffers ?? []) {
      if (o.from_user === context.userId && Array.isArray(o.offered_item_ids)) {
        const removed = Array.isArray(o.removed_item_ids) ? o.removed_item_ids : [];
        for (const id of o.offered_item_ids) {
          if (!removed.includes(id)) swappedIds.add(id);
        }
      }
      if (o.to_user === context.userId && Array.isArray(o.recipient_item_ids)) {
        const removed = Array.isArray(o.removed_recipient_item_ids) ? o.removed_recipient_item_ids : [];
        for (const id of o.recipient_item_ids) {
          if (!removed.includes(id)) swappedIds.add(id);
        }
      }
    }

    return (data ?? [])
      .filter((it: any) => !swappedIds.has(it.id))
      .map(formatItemOutput);
  });

/** IDs of the signed-in user's inventory items that already have a live listing. */
export const listMyListedItemIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("listings")
      .select("item_id")
      .eq("owner_id", context.userId)
      .neq("status", "removed")
      .not("item_id", "is", null);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => r.item_id).filter(Boolean) as string[];
  });


/** Item ids whose listing or offer has been fully swapped. */
export const listMySwappedItemIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Listings completed
    const { data: listings } = await context.supabase
      .from("listings")
      .select("item_id")
      .eq("owner_id", context.userId)
      .eq("status", "completed")
      .not("item_id", "is", null);
    const fromListings = (listings ?? []).map((r: any) => r.item_id as string);

    // 2. Completed offers where user was sender or recipient
    const { data: completedOffers } = await context.supabase
      .from("offers")
      .select("offered_item_ids, recipient_item_ids, from_user, to_user, removed_item_ids, removed_recipient_item_ids")
      .eq("status", "completed")
      .or(`from_user.eq.${context.userId},to_user.eq.${context.userId}`);

    const fromOffers: string[] = [];
    for (const o of completedOffers ?? []) {
      if (o.from_user === context.userId && Array.isArray(o.offered_item_ids)) {
        const removed = Array.isArray(o.removed_item_ids) ? o.removed_item_ids : [];
        fromOffers.push(...o.offered_item_ids.filter((id: string) => !removed.includes(id)));
      }
      if (o.to_user === context.userId && Array.isArray(o.recipient_item_ids)) {
        const removed = Array.isArray(o.removed_recipient_item_ids) ? o.removed_recipient_item_ids : [];
        fromOffers.push(...o.recipient_item_ids.filter((id: string) => !removed.includes(id)));
      }
    }

    return Array.from(new Set([...fromListings, ...fromOffers]));
  });

/** Public inventory of any user (used by the trade negotiation "View inventory" popup). */
export const listOwnerInventory = createServerFn({ method: "GET" })
  .inputValidator((d: { owner_id: string }) => z.object({ owner_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows } = await supabase
      .from("items")
      .select("*")
      .eq("owner_id", data.owner_id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    // Exclude traded items
    const { data: completedOffers } = await supabase
      .from("offers")
      .select("offered_item_ids, recipient_item_ids, from_user, to_user, removed_item_ids, removed_recipient_item_ids")
      .eq("status", "completed")
      .or(`from_user.eq.${data.owner_id},to_user.eq.${data.owner_id}`);

    const swappedIds = new Set<string>();
    for (const o of completedOffers ?? []) {
      if (o.from_user === data.owner_id && Array.isArray(o.offered_item_ids)) {
        const removed = Array.isArray(o.removed_item_ids) ? o.removed_item_ids : [];
        for (const id of o.offered_item_ids) {
          if (!removed.includes(id)) swappedIds.add(id);
        }
      }
      if (o.to_user === data.owner_id && Array.isArray(o.recipient_item_ids)) {
        const removed = Array.isArray(o.removed_recipient_item_ids) ? o.removed_recipient_item_ids : [];
        for (const id of o.recipient_item_ids) {
          if (!removed.includes(id)) swappedIds.add(id);
        }
      }
    }

    return (rows ?? [])
      .filter((it: any) => !swappedIds.has(it.id))
      .map(formatItemOutput);
  });


/** Public item detail (only items whose visibility is public). */
export const getPublicItem = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: item } = await supabase
      .from("items")
      .select("*, owner:profiles!items_owner_profile_fkey(id, username, display_name, avatar_color, avatar_url)")
      .eq("id", data.id)
      .eq("visibility", "public")
      .maybeSingle();
    return formatItemOutput(item);
  });

/** Owner-scoped item detail so private items are still viewable by their owner. */
export const getMyItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: item } = await context.supabase
      .from("items")
      .select("*, owner:profiles!items_owner_profile_fkey(id, username, display_name, avatar_color, avatar_url)")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    return formatItemOutput(item);
  });

export const createItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => itemSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);
    let insertData: any = { ...data, owner_id: context.userId };
    let { data: row, error } = await context.supabase
      .from("items")
      .insert(insertData)
      .select()
      .single();

    if (error && error.code === "22P02" && (data.category === "Cosmetics" || (data.category as any) === "Products")) {
      const { dbDescription } = encodeListingCategory("Cosmetics", data.description ?? "");
      insertData = {
        ...insertData,
        category: "Accessories",
        description: dbDescription,
      };
      const { data: fallbackRow, error: fbErr } = await context.supabase
        .from("items")
        .insert(insertData)
        .select()
        .single();
      if (fbErr) throw new Error(fbErr.message);
      row = fallbackRow;
    } else if (error) {
      throw new Error(error.message);
    }

    return resolveListingCategory(row);
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        looking_for: z.string().max(500).optional(),
      })
      .merge(itemSchema.partial())
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, looking_for, ...rest } = data;
    let updateData: any = { ...rest };
    let { data: row, error } = await context.supabase
      .from("items")
      .update(updateData)
      .eq("id", id)
      .eq("owner_id", context.userId)
      .select()
      .single();

    if (error && error.code === "22P02" && (rest.category === "Cosmetics" || (rest.category as any) === "Products")) {
      const { dbDescription } = encodeListingCategory("Cosmetics", rest.description ?? "");
      updateData = {
        ...updateData,
        category: "Accessories",
        description: dbDescription,
      };
      const { data: fallbackRow, error: fbErr } = await context.supabase
        .from("items")
        .update(updateData)
        .eq("id", id)
        .eq("owner_id", context.userId)
        .select()
        .single();
      if (fbErr) throw new Error(fbErr.message);
      row = fallbackRow;
    } else if (error) {
      throw new Error(error.message);
    }

    // Sync changes to active/live listing if item is listed
    const listingUpdate: Record<string, any> = {};
    if (rest.name) listingUpdate.title = rest.name;
    if (rest.category) {
      if (rest.category === "Cosmetics" || (rest.category as any) === "Products") {
        const { dbDescription } = encodeListingCategory("Cosmetics", rest.description ?? "");
        listingUpdate.category = "Accessories";
        listingUpdate.description = dbDescription;
      } else {
        listingUpdate.category = rest.category;
      }
    }
    if (rest.condition) listingUpdate.condition = rest.condition;
    if (rest.description !== undefined && rest.category !== "Cosmetics" && (rest.category as any) !== "Products") {
      listingUpdate.description = rest.description;
    }
    if (rest.image_urls) listingUpdate.image_urls = rest.image_urls;
    if (looking_for !== undefined) listingUpdate.looking_for = looking_for;

    if (Object.keys(listingUpdate).length > 0) {
      await context.supabase
        .from("listings")
        .update(listingUpdate)
        .eq("item_id", id)
        .eq("owner_id", context.userId)
        .neq("status", "removed");
    }

    return resolveListingCategory(row);
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Unlink or delete listings referencing this item
    await context.supabase
      .from("listings")
      .update({ status: "removed" as const })
      .eq("item_id", data.id)
      .eq("owner_id", context.userId);

    const { error } = await context.supabase
      .from("items")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const quickListInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string; looking_for?: string; emirate: string; location: string }) =>
    z
      .object({
        itemId: z.string().uuid(),
        looking_for: z.string().max(500).optional(),
        emirate: z.enum([
          "Abu Dhabi",
          "Dubai",
          "Sharjah",
          "Ajman",
          "Umm Al Quwain",
          "Ras Al Khaimah",
          "Fujairah",
        ]),
        location: z.string().min(2, "Please specify your neighbourhood location").max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);

    // 1. Get the item
    const { data: item, error: itemErr } = await context.supabase
      .from("items")
      .select("*")
      .eq("id", data.itemId)
      .eq("owner_id", context.userId)
      .single();
    if (itemErr || !item) throw new Error("Item not found");

    // 2. Check if already listed
    const { data: existing } = await context.supabase
      .from("listings")
      .select("id, status")
      .eq("owner_id", context.userId)
      .eq("item_id", item.id)
      .neq("status", "removed")
      .maybeSingle();

    if (existing) {
      throw new Error("This item is already listed on the marketplace.");
    }

    // Check limit of 10 active listings
    const { count } = await context.supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", context.userId)
      .neq("status", "removed");
    if ((count ?? 0) >= 10) {
      throw new Error("You can have at most 10 active listings. Remove one before listing another.");
    }

    const location = data.location.trim();
    const emirate = data.emirate;
    const looking_for = data.looking_for?.trim() || "Open to swap offers";

    // Update user profile location/emirate preferences
    await context.supabase
      .from("profiles")
      .update({ location, emirate })
      .eq("id", context.userId);

    const verdict = moderate(`${item.name}\n${item.description ?? ""}\n${looking_for}`, "listing");
    const held = verdict.flagged
      ? {
          status: "withheld" as const,
          moderation_note: `${verdict.category}: ${verdict.reason} Matched: ${verdict.terms.join(", ")}`,
        }
      : { status: "active" as const };

    const { data: listing, error: listErr } = await context.supabase
      .from("listings")
      .insert({
        title: item.name,
        description: item.description || "",
        category: item.category,
        condition: item.condition,
        image_emoji: item.image_emoji || "📦",
        image_urls: item.image_urls || [],
        location,
        emirate,
        looking_for,
        item_id: item.id,
        owner_id: context.userId,
        ...held,
      })
      .select()
      .single();

    if (listErr) throw new Error(listErr.message);

    return {
      listing,
      withheld: verdict.flagged,
    };
  });

export const unlistInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string }) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("listings")
      .delete()
      .eq("item_id", data.itemId)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyInventoryWithListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Fetch user items
    const { data: items, error: itemsErr } = await context.supabase
      .from("items")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (itemsErr) throw new Error(itemsErr.message);

    // 2. Fetch all user listings
    const { data: listings, error: listErr } = await context.supabase
      .from("listings")
      .select("*")
      .eq("owner_id", context.userId)
      .neq("status", "removed")
      .order("created_at", { ascending: false });
    if (listErr) throw new Error(listErr.message);

    const listingByItemId = new Map<string, any>();
    const standaloneListings: any[] = [];

    for (const l of listings ?? []) {
      if (l.item_id) {
        listingByItemId.set(l.item_id, l);
      } else {
        standaloneListings.push(l);
      }
    }

    const inventoryItems = await Promise.all(
      (items ?? []).map(async (item) => {
        const listing = listingByItemId.get(item.id);
        const itemImages = await repairImageUrls(item.image_urls);
        const listingImages = listing ? await repairImageUrls(listing.image_urls) : [];
        return {
          ...item,
          image_urls: itemImages,
          listing: listing ? { ...listing, image_urls: listingImages } : null,
          is_listed: !!listing,
          listing_status: (listing?.status ?? "not_listed") as "active" | "reserved" | "completed" | "withheld" | "not_listed",
        };
      }),
    );

    const repairedStandalone = await Promise.all(
      standaloneListings.map(async (l) => ({
        ...l,
        image_urls: await repairImageUrls(l.image_urls),
      })),
    );

    return {
      items: inventoryItems,
      standaloneListings: repairedStandalone,
    };
  });
