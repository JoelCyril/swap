import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfile } from "./profile.server";
import { moderate } from "./moderation";
import { repairImageUrls } from "./image-url-repair.server";
import { resolveListingCategory, encodeListingCategory, CATEGORY_PRODUCTS_TAG } from "./db-types";

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

export const listListings = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string } | undefined) =>
    z.object({ category: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();

    const selectQuery = `
  id,
  title,
  category,
  condition,
  description,
  image_urls,
  image_emoji,
  location,
  emirate,
  looking_for,
  status,
  created_at,
  moderation_note,
  owner:profiles!listings_owner_profile_fkey(
    id,
    username,
    display_name,
    avatar_color,
    avatar_url
  )
`;

    let rows: any[] = [];

    if (data.category === "Cosmetics" || data.category === "Products") {
      // 1. Try native enum filter if DB enum already has Cosmetics
      try {
        const { data: nativeRows, error: nativeErr } = await supabase
          .from("listings")
          .select(selectQuery)
          .in("status", ["active", "reserved"])
          .eq("category", "Cosmetics" as never)
          .order("created_at", { ascending: false });
        if (!nativeErr && nativeRows && nativeRows.length > 0) {
          rows = nativeRows;
        }
      } catch {}

      // 2. Also fetch listings with fallback [CATEGORY:Cosmetics] or [CATEGORY:Products] in description
      const { data: fallbackRows, error: fbErr } = await supabase
        .from("listings")
        .select(selectQuery)
        .in("status", ["active", "reserved"])
        .or(`description.ilike.%${CATEGORY_COSMETICS_TAG}%,description.ilike.%${CATEGORY_PRODUCTS_TAG}%`)
        .order("created_at", { ascending: false });
      if (!fbErr && fallbackRows) {
        const existingIds = new Set(rows.map((r) => r.id));
        for (const fr of fallbackRows) {
          if (!existingIds.has(fr.id)) {
            rows.push(fr);
          }
        }
      }
    } else {
      let q = supabase
        .from("listings")
        .select(selectQuery)
        .in("status", ["active", "reserved"])
        .order("created_at", { ascending: false });
      if (data.category) q = q.eq("category", data.category as never);
      const { data: fetchedRows, error } = await q;
      if (error) throw new Error(error.message);
      rows = fetchedRows ?? [];

      // If querying Accessories, filter out any rows that have the Cosmetics/Products fallback tag
      if (data.category === "Accessories") {
        rows = rows.filter((r) => !r.description?.includes(CATEGORY_COSMETICS_TAG) && !r.description?.includes(CATEGORY_PRODUCTS_TAG));
      }
    }

    const repaired = await Promise.all(
      rows.map(async (row) => {
        const resolved = resolveListingCategory(row);
        return {
          ...resolved,
          image_urls: await repairImageUrls(resolved.image_urls),
        };
      }),
    );
    return repaired;
  });

export function isCollectorListing(listing: { moderation_note?: string | null } | null | undefined): boolean {
  if (!listing || !listing.moderation_note) return false;
  return listing.moderation_note.includes("COLLECTOR");
}

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("listings")
      .select(`
  id,
  owner_id,
  title,
  description,
  category,
  condition,
  location,
  emirate,
  looking_for,
  image_urls,
  image_emoji,
  status,
  moderation_note,
  created_at,
  updated_at,
  item_id,
  owner:profiles!listings_owner_profile_fkey(
    id,
    username,
    display_name,
    avatar_color,
    avatar_url,
    bio
  )
`)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    const resolved = resolveListingCategory(row);
    return {
      ...resolved,
      image_urls: await repairImageUrls(resolved.image_urls),
    };
  });

export const listListingsByUsername = createServerFn({ method: "GET" })
  .inputValidator((d: { username: string }) => z.object({ username: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", data.username)
      .maybeSingle();
    if (!profile) return { profile: null, listings: [] };
    const { data: listings } = await supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .eq("owner_id", profile.id)
      .in("status", ["active", "reserved"])
      .order("created_at", { ascending: false });
    if (!listings) return { profile, listings: [] };

    const repaired = await Promise.all(
      listings.map(async (l) => {
        const resolved = resolveListingCategory(l);
        return {
          ...resolved,
          image_urls: await repairImageUrls(resolved.image_urls),
        };
      }),
    );
    return { profile, listings: repaired };
  });

const createSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).default(""),
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
  location: z.string().min(2).max(120),
  emirate: z.enum(["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"]),
  looking_for: z.string().max(500).default(""),
  item_id: z.string().uuid().nullable().optional(),
  image_urls: z.array(z.string().url().max(2048)).max(8).default([]),
});

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);
    const { count } = await context.supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", context.userId)
      .neq("status", "removed");
    if ((count ?? 0) >= 10) {
      throw new Error("You can have at most 10 listings. Delete one before adding another.");
    }

    if (data.item_id) {
      const { count: already } = await context.supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", context.userId)
        .eq("item_id", data.item_id)
        .neq("status", "removed");
      if ((already ?? 0) > 0) {
        throw new Error("This inventory item is already listed.");
      }
    }

    const verdict = moderate(`${data.title}\n${data.description}\n${data.looking_for}`, "listing");
    const held = verdict.flagged
      ? {
          status: "withheld" as const,
          moderation_note: `${verdict.category}: ${verdict.reason} Matched: ${verdict.terms.join(", ")}`,
        }
      : {};

    let insertData: any = { ...data, ...held, owner_id: context.userId };
    let { data: row, error } = await context.supabase
      .from("listings")
      .insert(insertData)
      .select()
      .single();

    if (error && error.code === "22P02" && (data.category === "Cosmetics" || (data.category as any) === "Products")) {
      const { dbDescription } = encodeListingCategory("Cosmetics", data.description);
      insertData = {
        ...insertData,
        category: "Accessories",
        description: dbDescription,
      };
      const { data: fallbackRow, error: fbErr } = await context.supabase
        .from("listings")
        .insert(insertData)
        .select()
        .single();
      if (fbErr) throw new Error(fbErr.message);
      row = fallbackRow;
    } else if (error) {
      throw new Error(error.message);
    }

    return { ...resolveListingCategory(row), withheld: verdict.flagged };
  });

export const updateListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "active" | "reserved" | "completed" | "removed" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "reserved", "completed", "removed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Every listing owned by the signed-in user, whatever its status. */
export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(resolveListingCategory);
  });

/** Owner-scoped read so the edit form can load listings in any status. */
export const getMyListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("listings")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return resolveListingCategory(row);
  });

export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    createSchema.partial().extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const verdict = moderate(
      `${fields.title ?? ""}\n${fields.description ?? ""}\n${fields.looking_for ?? ""}`,
      "listing",
    );
    const held = verdict.flagged
      ? {
          status: "withheld" as const,
          moderation_note: `${verdict.category}: ${verdict.reason} Matched: ${verdict.terms.join(", ")}`,
        }
      : {};

    let updateData: any = { ...fields, ...held };
    let { error } = await context.supabase
      .from("listings")
      .update(updateData)
      .eq("id", id)
      .eq("owner_id", context.userId);

    if (error && error.code === "22P02" && (fields.category === "Cosmetics" || (fields.category as any) === "Products")) {
      const { dbDescription } = encodeListingCategory("Cosmetics", fields.description ?? "");
      updateData = {
        ...updateData,
        category: "Accessories",
        description: dbDescription,
      };
      const { error: fbErr } = await context.supabase
        .from("listings")
        .update(updateData)
        .eq("id", id)
        .eq("owner_id", context.userId);
      if (fbErr) throw new Error(fbErr.message);
      error = null;
    } else if (error) {
      throw new Error(error.message);
    }

    return { ok: true, id, withheld: verdict.flagged };
  });
