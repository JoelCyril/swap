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

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const profile = data ?? (await ensureProfile(context.userId));
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const { data: privateInfo } = await context.supabase
      .from("profile_private")
      .select("full_name, birthday")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      profile,
      private: privateInfo ?? { full_name: null, birthday: null },
      roles: (roles ?? []).map((r) => r.role),
    };
  });


export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .min(3)
          .max(20)
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores")
          .optional(),
        display_name: z.string().min(1).max(80).optional(),
        full_name: z.string().max(120).optional().nullable(),
        birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
        emirate: z.string().max(40).optional().nullable(),
        location: z.string().max(120).optional().nullable(),
        bio: z.string().max(500).optional().nullable(),
        avatar_color: z.string().max(60).optional(),
        avatar_url: z.string().url().max(2048).optional().nullable(),
        banner_url: z.string().url().max(2048).optional().nullable(),
        inventory_default_visibility: z.enum(["public", "private"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { full_name, birthday, username, ...rest } = data;
    const publicFields: Record<string, unknown> = { ...rest };

    if (username) {
      const uname = username.toLowerCase();
      const { data: rows } = await context.supabase
        .from("profiles")
        .select("id")
        .ilike("username", uname)
        .limit(1);
      const taken = (rows ?? [])[0];
      if (taken && taken.id !== context.userId) {
        throw new Error("That username is already taken — pick another one.");
      }
      publicFields.username = uname;
      publicFields.display_name = uname;
    }

    if (Object.keys(publicFields).length > 0) {
      const { error } = await context.supabase
        .from("profiles")
        .update(publicFields as never)
        .eq("id", context.userId);
      if (error) {
        throw new Error(
          error.message.includes("duplicate")
            ? "That username is already taken — pick another one."
            : error.message,
        );
      }
    }

    if (full_name !== undefined || birthday !== undefined) {
      const patch: { id: string; full_name?: string | null; birthday?: string | null } = {
        id: context.userId,
      };
      if (full_name !== undefined) patch.full_name = full_name;
      if (birthday !== undefined) patch.birthday = birthday;
      const { error } = await context.supabase
        .from("profile_private")
        .upsert(patch, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });


/** Public search for other users by username or display name. */
export const searchProfiles = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const term = data.q.replace(/[%,()]/g, "");
    if (!term) return [];
    const { data: rows, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_color, avatar_url, location")
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(8);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Public profile view: profile, admin badge and public inventory items. */
export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { username: string }) => z.object({ username: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_color, avatar_url, banner_url, location, bio, created_at")
      .eq("username", data.username)
      .maybeSingle();
    if (!profile) return { profile: null, isAdmin: false, items: [] };
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .eq("role", "admin")
      .maybeSingle();
    const { data: items } = await supabase
      .from("items")
      .select("id, name, category, condition, image_emoji, image_urls, description")
      .eq("owner_id", profile.id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(24);
    return { profile, isAdmin: !!adminRow, items: items ?? [] };
  });

/** Permanently delete the signed-in user's account and their content. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { confirm: string }) =>
    z.object({ confirm: z.literal("DELETE") }).parse(d),
  )
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("listings").delete().eq("owner_id", context.userId);
    await supabaseAdmin.from("items").delete().eq("owner_id", context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
