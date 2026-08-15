import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfile } from "./profile.server";
import { moderate } from "./moderation";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
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
  .inputValidator((d: { category?: string | null } | undefined) =>
    z.object({ category: z.string().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .in("status", ["active", "reserved"])
      .order("created_at", { ascending: false })
      .limit(60);
    if (data.category) q = q.eq("category", data.category as never);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
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
    return { profile, listings: listings ?? [] };
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

    const { data: row, error } = await context.supabase
      .from("listings")
      .insert({ ...data, ...held, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...row, withheld: verdict.flagged };
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
    return data ?? [];
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
    return row;
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
    const { error } = await context.supabase
      .from("listings")
      .update({ ...fields, ...held })
      .eq("id", id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, id, withheld: verdict.flagged };
  });
