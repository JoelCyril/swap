import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------- Notification preferences ---------------- */

export const getNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notification_prefs")
      .select("announcements, messages, saves, offers")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data ?? { announcements: true, messages: true, saves: true, offers: true };
  });

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        announcements: z.boolean().optional(),
        messages: z.boolean().optional(),
        saves: z.boolean().optional(),
        offers: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notification_prefs")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Inventory privacy ---------------- */

/** Flip every inventory item (and the account default) to public/private. */
export const setInventoryPrivacy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ private: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const visibility = data.private ? "private" : "public";
    const { error } = await context.supabase
      .from("items")
      .update({ visibility } as never)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    const { error: pErr } = await context.supabase
      .from("profiles")
      .update({ inventory_default_visibility: visibility } as never)
      .eq("id", context.userId);
    if (pErr) throw new Error(pErr.message);
    return { ok: true };
  });

/* ---------------- Blocking ---------------- */

export const listBlockedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: blocks, error } = await context.supabase
      .from("user_blocks")
      .select("id, blocked_id, created_at")
      .eq("blocker_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (blocks ?? []).map((b) => b.blocked_id);
    if (!ids.length) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, username, avatar_url, avatar_color")
      .in("id", ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (blocks ?? []).map((b) => ({
      id: b.id,
      user: byId.get(b.blocked_id) ?? null,
      blocked_id: b.blocked_id,
      created_at: b.created_at,
    }));
  });

/** Every user id that should be hidden from me (I blocked them, or they blocked me). */
export const listBlockedIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${context.userId},blocked_id.eq.${context.userId}`);
    const ids = new Set<string>();
    for (const row of data ?? []) {
      ids.add(row.blocker_id === context.userId ? row.blocked_id : row.blocker_id);
    }
    return [...ids];
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ username: z.string().trim().min(1).max(40) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const uname = data.username.replace(/^@/, "").toLowerCase();
    const { data: target } = await context.supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", uname)
      .maybeSingle();
    if (!target) throw new Error("No member found with that username.");
    if (target.id === context.userId) throw new Error("You can't block yourself.");
    const { error } = await context.supabase
      .from("user_blocks")
      .insert({ blocker_id: context.userId, blocked_id: target.id });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true, username: target.username };
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ blocked_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", context.userId)
      .eq("blocked_id", data.blocked_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
