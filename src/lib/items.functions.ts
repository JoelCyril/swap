import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfile } from "./profile.server";

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
  name: z.string().min(1).max(120),
  category: z.enum([
    "Electronics",
    "Household Items",
    "Clothing",
    "Outdoors",
    "Accessories",
    "Books",
    "Toys",
    "Sports",
  ]),
  condition: z.enum(["New", "Like New", "Good", "Fair"]),
  image_emoji: z.string().max(8).default("📦"),
  description: z.string().max(1000).optional().nullable(),
  visibility: z.enum(["public", "private"]).default("public"),
  image_urls: z.array(z.string().url()).max(8).default([]),
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
    return data ?? [];
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
    return (data ?? []).map((r) => r.item_id as string);
  });


/** Item ids whose listing has been fully swapped. */
export const listMySwappedItemIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("listings")
      .select("item_id")
      .eq("owner_id", context.userId)
      .eq("status", "completed")
      .not("item_id", "is", null);
    return (data ?? []).map((r) => r.item_id as string);
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
    return rows ?? [];
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
    return item ?? null;
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
    return item ?? null;
  });

export const createItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => itemSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);
    const { data: row, error } = await context.supabase
      .from("items")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).merge(itemSchema.partial()).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("items")
      .update(rest)
      .eq("id", id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("items")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
