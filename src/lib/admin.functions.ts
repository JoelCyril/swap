import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUser } from "./notifications.server";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const listFlaggedListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .gt("flags_count", 0)
      .order("flags_count", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getFlaggedListingDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: listing, error } = await context.supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: flags } = await context.supabase
      .from("flags")
      .select("*")
      .eq("listing_id", data.id)
      .order("created_at", { ascending: false });
    const reporterIds = [...new Set((flags ?? []).map((f: any) => f.reporter_id as string))];
    const { data: reporters } = reporterIds.length
      ? await context.supabase.from("profiles").select("id, username, display_name, avatar_color").in("id", reporterIds)
      : { data: [] as any[] };
    const flagsWithReporter = (flags ?? []).map((f: any) => ({
      ...f,
      reporter: (reporters ?? []).find((r: any) => r.id === f.reporter_id) ?? null,
    }));
    return { listing, flags: flagsWithReporter };
  });

export const adminRemoveListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: listing } = await context.supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("listings")
      .update({ status: "removed" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (listing) {
      await notifyUser({
        userId: listing.owner_id,
        type: "listing_removed",
        title: "Your listing was removed",
        body: `"${listing.title}" was removed by a moderator after being reported.`,
        link: "/your-items",
      });
      // Notify reporters
      const { data: reporters } = await context.supabase
        .from("flags")
        .select("reporter_id")
        .eq("listing_id", data.id);
      const unique = [...new Set((reporters ?? []).map((r: any) => r.reporter_id as string))];
      for (const uid of unique) {
        await notifyUser({
          userId: uid,
          type: "flag_actioned",
          title: "A listing you reported was removed",
          body: `"${listing.title}" was taken down.`,
          link: "/listings",
        });
      }
    }
    return { ok: true };
  });

export const redeemAdminCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => z.object({ code: z.string().min(4) }).parse(d))
  .handler(async ({ data, context }) => {
    const expected = "bosh123";
    if (data.code !== expected) throw new Error("Invalid code");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

/** Active bans with the banned member's profile. */
export const listBannedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("user_bans")
      .select("id, user_id, reason, expires_at, created_at")
      .is("lifted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const now = Date.now();
    const active = (data ?? []).filter(
      (b: any) => b.expires_at === null || new Date(b.expires_at).getTime() > now,
    );
    const ids = [...new Set(active.map((b: any) => b.user_id as string))];
    const { data: profiles } = ids.length
      ? await context.supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, avatar_color")
          .in("id", ids)
      : { data: [] as any[] };
    return active.map((b: any) => ({
      ...b,
      profile: (profiles ?? []).find((p: any) => p.id === b.user_id) ?? null,
    }));
  });

/** Support inquiries submitted from the Help page. */
export const listInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("support_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Listings held back by the automated content check, awaiting moderator review. */
export const listWithheldListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_profile_fkey(*)")
      .eq("status", "withheld")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Approve (publish) or decline (remove) a withheld listing. */
export const reviewWithheldListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approve: boolean }) =>
    z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: listing } = await context.supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("listings")
      .update({ status: data.approve ? "active" : "removed" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (listing) {
      await notifyUser({
        userId: listing.owner_id,
        type: data.approve ? "listing_approved" : "listing_removed",
        title: data.approve ? "Your listing is now live" : "Your listing was declined",
        body: data.approve
          ? `"${listing.title}" passed moderator review.`
          : `"${listing.title}" was declined by a moderator.`,
        link: "/my-listings",
      });
    }
    return { ok: true };
  });

/** Moderator reply to a support inquiry. */
export const replyToInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reply: z.string().trim().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("support_inquiries")
      .update({ reply: data.reply, replied_at: new Date().toISOString(), replied_by: context.userId } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
