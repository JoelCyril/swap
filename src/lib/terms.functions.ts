import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfile } from "./profile.server";

/** Whether the signed-in user still needs to accept the terms. */
export const getTermsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Ensure profile and run auto-merge for returning users
    const profile = await ensureProfile(context.userId);
    if (profile?.tos_accepted_at) {
      return { accepted: true, age: profile.age_confirmed ?? null };
    }

    const { data } = await context.supabase
      .from("profiles")
      .select("tos_accepted_at, age_confirmed")
      .eq("id", context.userId)
      .maybeSingle();

    const row = data as { tos_accepted_at: string | null; age_confirmed: number | null } | null;
    return { accepted: Boolean(row?.tos_accepted_at), age: row?.age_confirmed ?? null };
  });

export const acceptTerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int().min(13).max(120),
        username: z
          .string()
          .trim()
          .min(3)
          .max(20)
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores"),
        full_name: z.string().trim().max(120).optional().nullable(),
        birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
        emirate: z.string().trim().max(40).optional().nullable(),
        location: z.string().trim().max(120).optional().nullable(),
        bio: z.string().trim().max(500).optional().nullable(),
        avatar_color: z.string().max(60).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);
    const username = data.username.toLowerCase();

    const { data: taken } = await context.supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", username)
      .maybeSingle();

    if (taken && taken.id !== context.userId) {
      // Check if taken is an unclaimed legacy profile
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let hasActiveAuth = false;
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(taken.id);
        hasActiveAuth = !!authUser?.user;
      } catch {}

      if (!hasActiveAuth) {
        // Unclaimed legacy profile! Merge it to restore listings, items, and history!
        const { mergeOrphanedProfile } = await import("./profile.server");
        await mergeOrphanedProfile(context.userId, taken.id);
      } else {
        throw new Error("That username is already taken — pick another one.");
      }
    }

    const { error } = await context.supabase
      .from("profiles")
      .update({
        username,
        display_name: username,
        emirate: data.emirate || null,
        location: data.location || null,
        bio: data.bio || null,
        ...(data.avatar_color ? { avatar_color: data.avatar_color } : {}),
        tos_accepted_at: new Date().toISOString(),
        age_confirmed: data.age,
      } as never)
      .eq("id", context.userId);

    if (error) {
      throw new Error(
        error.message.includes("duplicate") ? "That username is already taken — pick another one." : error.message,
      );
    }

    if (data.full_name || data.birthday) {
      await context.supabase
        .from("profile_private")
        .upsert(
          { id: context.userId, full_name: data.full_name || null, birthday: data.birthday || null },
          { onConflict: "id" },
        );
    }
    return { ok: true };
  });

/** Live availability check for the sign-up username step (case-insensitive). */
export const checkUsername = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string }) => z.object({ username: z.string().trim().min(3).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const uname = data.username.toLowerCase();
    const { data: rows } = await context.supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", uname)
      .limit(1);
    const taken = (rows ?? [])[0];
    if (!taken || taken.id === context.userId) {
      return { available: true, isLegacyClaim: false };
    }

    // Check if this taken username belongs to an unclaimed legacy/orphaned profile
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let hasActiveAuth = false;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(taken.id);
      hasActiveAuth = !!authUser?.user;
    } catch {}

    if (!hasActiveAuth) {
      return { available: true, isLegacyClaim: true, legacyUsername: taken.username };
    }

    return { available: false, isLegacyClaim: false };
  });
