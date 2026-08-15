import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ActiveBan = {
  id: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

/** The signed-in user's active ban, if any. */
export const getMyBan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_bans")
      .select("id, reason, expires_at, created_at")
      .eq("user_id", context.userId)
      .is("lifted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) return null;
    const now = Date.now();
    const active = (data ?? []).find(
      (b) => b.expires_at === null || new Date(b.expires_at).getTime() > now,
    );
    return (active as ActiveBan | undefined) ?? null;
  });

/** Admin view of a user's active ban. */
export const getUserBan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase
      .from("user_bans")
      .select("id, reason, expires_at, created_at")
      .eq("user_id", data.user_id)
      .is("lifted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);
    const now = Date.now();
    const active = (rows ?? []).find(
      (b: ActiveBan) => b.expires_at === null || new Date(b.expires_at).getTime() > now,
    );
    return (active as ActiveBan | undefined) ?? null;
  });

/** Ban a user for a number of days, or permanently when days is null. */
export const banUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        reason: z.string().trim().min(3).max(500),
        days: z.number().int().min(1).max(3650).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You cannot ban yourself");

    const { data: targetAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id)
      .eq("role", "admin")
      .maybeSingle();
    if (targetAdmin) throw new Error("Moderators cannot be banned");

    const expires_at =
      data.days === null ? null : new Date(Date.now() + data.days * 86400_000).toISOString();

    const { error } = await context.supabase.from("user_bans").insert({
      user_id: data.user_id,
      banned_by: context.userId,
      reason: data.reason,
      expires_at,
    });
    if (error) throw new Error(error.message);
    return { ok: true, expires_at };
  });

/** Lift every active ban on a user. */
export const liftBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("user_bans")
      .update({ lifted_at: new Date().toISOString() })
      .eq("user_id", data.user_id)
      .is("lifted_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
