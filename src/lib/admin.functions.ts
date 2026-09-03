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

export const adminToggleCollectorBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: listing, error: fetchErr } = await context.supabase
      .from("listings")
      .select("id, owner_id, title, moderation_note")
      .eq("id", data.id)
      .single();

    if (fetchErr || !listing) throw new Error("Listing not found");

    const isCollector = Boolean(listing.moderation_note?.includes("COLLECTOR"));
    let nextNote: string | null = null;

    if (isCollector) {
      // Remove badge
      nextNote = (listing.moderation_note || "")
        .replace(/\[?COLLECTOR(?:_ITEM)?\]?/gi, "")
        .trim();
      if (!nextNote) nextNote = null;
    } else {
      // Add badge
      nextNote = listing.moderation_note
        ? `${listing.moderation_note} [COLLECTOR_ITEM]`.trim()
        : "[COLLECTOR_ITEM]";
    }

    const { error } = await context.supabase
      .from("listings")
      .update({ moderation_note: nextNote })
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    // If newly awarded, notify owner
    if (!isCollector) {
      await notifyUser({
        userId: listing.owner_id,
        type: "system_announcement",
        title: "🏆 Collector's Badge Awarded!",
        body: `Your listing "${listing.title}" has been awarded the Collector's Item badge by the moderators!`,
        link: `/listings/${listing.id}`,
      });
    }

    return {
      isCollector: !isCollector,
      message: !isCollector
        ? "Awarded Collector's Item badge"
        : "Removed Collector's Item badge",
    };
  });

export const redeemAdminCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => z.object({ code: z.string().min(4) }).parse(d))
  .handler(async ({ data, context }) => {
    const expected = process.env.ADMIN_BOOTSTRAP_CODE;
    if (!expected) throw new Error("Admin bootstrap not configured");
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

/** Comprehensive analytics on members, listings, inventory, and trades for moderators. */
export const getModeratorAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch all profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url, avatar_color, location, emirate, bio, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);

    // 2. Fetch all listings
    const { data: listings, error: lErr } = await supabaseAdmin
      .from("listings")
      .select("id, owner_id, title, category, condition, status, created_at, emirate, location");
    if (lErr) throw new Error(lErr.message);

    // 3. Fetch all items (inventory)
    const { data: items, error: iErr } = await supabaseAdmin
      .from("items")
      .select("id, owner_id, name, category, condition, created_at, visibility");
    if (iErr) throw new Error(iErr.message);

    // 4. Fetch all offers
    const { data: offers, error: oErr } = await supabaseAdmin
      .from("offers")
      .select("id, from_user, to_user, listing_id, status, created_at, updated_at");
    if (oErr) throw new Error(oErr.message);

    // 5. Fetch email notification logs to compute 7-day cooldowns
    const { data: emailNotifs } = await supabaseAdmin
      .from("notifications")
      .select("user_id, created_at")
      .in("type", ["admin_nudge_email", "admin_broadcast_email"])
      .order("created_at", { ascending: false });

    const lastEmailByUser = new Map<string, string>();
    for (const n of emailNotifs ?? []) {
      if (!lastEmailByUser.has(n.user_id)) {
        lastEmailByUser.set(n.user_id, n.created_at);
      }
    }

    const allProfiles = profiles ?? [];
    const allListings = listings ?? [];
    const allItems = items ?? [];
    const allOffers = offers ?? [];
    const totalUsers = allProfiles.length;

    // Group listings by user
    const listingsByUser = new Map<
      string,
      { total: number; active: number; categories: Set<string>; lastListingAt: string | null }
    >();
    for (const l of allListings) {
      const existing = listingsByUser.get(l.owner_id) || {
        total: 0,
        active: 0,
        categories: new Set<string>(),
        lastListingAt: null,
      };
      existing.total += 1;
      if (l.status === "active") existing.active += 1;
      if (l.category) existing.categories.add(l.category);
      if (!existing.lastListingAt || new Date(l.created_at) > new Date(existing.lastListingAt)) {
        existing.lastListingAt = l.created_at;
      }
      listingsByUser.set(l.owner_id, existing);
    }

    // Group items by user
    const itemsByUser = new Map<string, number>();
    for (const it of allItems) {
      itemsByUser.set(it.owner_id, (itemsByUser.get(it.owner_id) || 0) + 1);
    }

    // Group trades / completed swaps by user
    const tradesByUser = new Map<
      string,
      { totalOffers: number; completedTrades: number; acceptedOffers: number; lastTradeAt: string | null }
    >();
    for (const off of allOffers) {
      // from_user
      const fromEntry = tradesByUser.get(off.from_user) || {
        totalOffers: 0,
        completedTrades: 0,
        acceptedOffers: 0,
        lastTradeAt: null,
      };
      fromEntry.totalOffers += 1;
      if (off.status === "completed") {
        fromEntry.completedTrades += 1;
        if (!fromEntry.lastTradeAt || new Date(off.updated_at || off.created_at) > new Date(fromEntry.lastTradeAt)) {
          fromEntry.lastTradeAt = off.updated_at || off.created_at;
        }
      }
      if (off.status === "accepted") fromEntry.acceptedOffers += 1;
      tradesByUser.set(off.from_user, fromEntry);

      // to_user
      const toEntry = tradesByUser.get(off.to_user) || {
        totalOffers: 0,
        completedTrades: 0,
        acceptedOffers: 0,
        lastTradeAt: null,
      };
      toEntry.totalOffers += 1;
      if (off.status === "completed") {
        toEntry.completedTrades += 1;
        if (!toEntry.lastTradeAt || new Date(off.updated_at || off.created_at) > new Date(toEntry.lastTradeAt)) {
          toEntry.lastTradeAt = off.updated_at || off.created_at;
        }
      }
      if (off.status === "accepted") toEntry.acceptedOffers += 1;
      tradesByUser.set(off.to_user, toEntry);
    }

    // Aggregates
    const usersWithListingsCount = Array.from(listingsByUser.keys()).length;
    const usersWithoutListingsCount = Math.max(totalUsers - usersWithListingsCount, 0);
    const activeListingsCount = allListings.filter((l) => l.status === "active").length;
    const completedSwapsCount = allOffers.filter((o) => o.status === "completed").length;
    const acceptedOffersCount = allOffers.filter((o) => o.status === "accepted").length;
    const totalInventoryCount = allItems.length;

    // Build user detail rows
    const userRows = allProfiles.map((p) => {
      const listingStats = listingsByUser.get(p.id) || {
        total: 0,
        active: 0,
        categories: new Set<string>(),
        lastListingAt: null,
      };
      const inventoryCount = itemsByUser.get(p.id) || 0;
      const tradeStats = tradesByUser.get(p.id) || {
        totalOffers: 0,
        completedTrades: 0,
        acceptedOffers: 0,
        lastTradeAt: null,
      };

      return {
        id: p.id,
        username: p.username || "anonymous",
        display_name: p.display_name || p.username || "User",
        avatar_url: p.avatar_url,
        avatar_color: p.avatar_color,
        location: p.location || "UAE",
        emirate: p.emirate || null,
        created_at: p.created_at,
        total_listings: listingStats.total,
        active_listings: listingStats.active,
        inventory_items: inventoryCount,
        has_listings: listingStats.total > 0,
        has_inventory: inventoryCount > 0,
        completed_trades: tradeStats.completedTrades,
        total_offers: tradeStats.totalOffers,
        has_completed_trade: tradeStats.completedTrades > 0,
        last_listing_at: listingStats.lastListingAt,
        last_trade_at: tradeStats.lastTradeAt,
        last_email_sent_at: lastEmailByUser.get(p.id) || null,
      };
    });

    // Breakdown by Emirate
    const emirateBreakdown: Record<string, { users: number; listings: number }> = {};
    for (const p of allProfiles) {
      const em = p.emirate || "Dubai";
      if (!emirateBreakdown[em]) emirateBreakdown[em] = { users: 0, listings: 0 };
      emirateBreakdown[em].users += 1;
    }
    for (const l of allListings) {
      const em = l.emirate || "Dubai";
      if (!emirateBreakdown[em]) emirateBreakdown[em] = { users: 0, listings: 0 };
      emirateBreakdown[em].listings += 1;
    }

    // Breakdown by Category
    const categoryBreakdown: Record<string, number> = {};
    for (const l of allListings) {
      if (l.category) {
        categoryBreakdown[l.category] = (categoryBreakdown[l.category] || 0) + 1;
      }
    }

    return {
      summary: {
        total_users: totalUsers,
        users_with_listings: usersWithListingsCount,
        users_without_listings: usersWithoutListingsCount,
        conversion_rate: totalUsers > 0 ? Math.round((usersWithListingsCount / totalUsers) * 100) : 0,
        active_listings: activeListingsCount,
        total_listings: allListings.length,
        total_inventory_items: totalInventoryCount,
        total_offers: allOffers.length,
        completed_swaps: completedSwapsCount,
        accepted_offers: acceptedOffersCount,
        users_with_trades: Array.from(tradesByUser.values()).filter((t) => t.completedTrades > 0).length,
      },
      users: userRows,
      emirate_breakdown: emirateBreakdown,
      category_breakdown: categoryBreakdown,
    };
  });

export const adminSendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        target: z.enum(["all", "user"]),
        username: z.string().optional(),
        title: z.string().min(1, "Title is required").max(120),
        body: z.string().min(1, "Message body is required").max(2000),
        link: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.target === "user") {
      if (!data.username) throw new Error("Please specify a username");
      const cleanUser = data.username.replace(/^@/, "").trim().toLowerCase();
      const { data: userProfile, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("id, username")
        .ilike("username", cleanUser)
        .maybeSingle();
      if (pErr || !userProfile) throw new Error(`User @${cleanUser} not found`);

      await notifyUser({
        userId: userProfile.id,
        type: "admin_message",
        title: data.title,
        body: data.body,
        link: data.link || "/announcements",
      });
      return { count: 1, message: `Notification sent to @${userProfile.username}` };
    }

    if (data.target === "no_listings") {
      const { data: listings } = await supabaseAdmin
        .from("listings")
        .select("owner_id")
        .neq("status", "removed");
      const usersWithListings = new Set((listings ?? []).map((l) => l.owner_id));

      const { data: allProfiles, error: aErr } = await supabaseAdmin
        .from("profiles")
        .select("id");
      if (aErr) throw new Error(aErr.message);

      const targetIds = (allProfiles ?? [])
        .map((p) => p.id)
        .filter((uid) => !usersWithListings.has(uid));

      const rows = targetIds.map((uid) => ({
        user_id: uid,
        type: "admin_broadcast",
        title: data.title,
        body: data.body,
        link: data.link || "/my-listings?add=true",
        read: false,
      }));

      if (rows.length > 0) {
        for (let i = 0; i < rows.length; i += 200) {
          await supabaseAdmin.from("notifications").insert(rows.slice(i, i + 200) as any);
        }
      }

      return { count: targetIds.length, message: `Notification sent to ${targetIds.length} users without listings` };
    }

    // Target: all users
    const { data: allProfiles, error: aErr } = await supabaseAdmin
      .from("profiles")
      .select("id");
    if (aErr) throw new Error(aErr.message);

    const userIds = (allProfiles ?? []).map((p) => p.id);
    const rows = userIds.map((uid) => ({
      user_id: uid,
      type: "admin_broadcast",
      title: data.title,
      body: data.body,
      link: data.link || "/announcements",
      read: false,
    }));

    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        await supabaseAdmin.from("notifications").insert(chunk as any);
      }
    }

    return { count: userIds.length, message: `Broadcast notification sent to ${userIds.length} users` };
  });

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const adminEmailUsersWithoutListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        subject: z.string().min(1, "Subject is required").max(120),
        heading: z.string().min(1, "Heading is required").max(120),
        message: z.string().min(1, "Message is required").max(3000),
        buttonText: z.string().min(1).max(60).default("List an Item Now"),
        buttonLink: z.string().default("/my-listings?add=true"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, absoluteUrl } = await import("./email.server");

    // 1. Fetch all user IDs that currently have listings
    const { data: listings, error: listErr } = await supabaseAdmin
      .from("listings")
      .select("owner_id")
      .neq("status", "removed");
    if (listErr) throw new Error(listErr.message);

    const usersWithListings = new Set((listings ?? []).map((l) => l.owner_id));

    // 2. Fetch all registered users from auth
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authErr) throw new Error(authErr.message);

    // 3. Filter users without listings
    const targetUsers = (authUsers?.users ?? []).filter(
      (u) => !usersWithListings.has(u.id) && u.email && u.email.includes("@"),
    );

    if (targetUsers.length === 0) {
      return { count: 0, message: "All registered users already have active listings!" };
    }

    const actionUrl = data.buttonLink.startsWith("http")
      ? data.buttonLink
      : absoluteUrl(data.buttonLink);
    const unsubscribeUrl = absoluteUrl("/settings");
    const privacyUrl = absoluteUrl("/terms");

    let sentCount = 0;
    let failCount = 0;

    // Send emails
    for (const u of targetUsers) {
      const email = u.email!;
      const username = u.user_metadata?.username || u.email?.split("@")[0] || "Trader";

      const html = `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#ffffff; font-family: 'Asap Sharp', 'Asap', Arial, Helvetica, sans-serif; color:#111111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#ffffff;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; border-collapse:collapse; margin-top:20px;">
            <tr>
              <td style="background:#fff8ef; padding:32px; border-radius:24px; border:2px solid #fed7aa;">
                <div style="text-align:center; margin-bottom:20px;">
                  <span style="font-size:32px;">📦</span>
                  <h1 style="margin:8px 0 0 0; font-size:24px; line-height:1.2; font-weight:900; color:#111111;">
                    ${escapeHtml(data.heading)}
                  </h1>
                </div>

                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.5; color:#374151;">
                  Hi <strong>@${escapeHtml(username)}</strong>,
                </p>

                <div style="font-size:15px; line-height:1.6; color:#374151; white-space:pre-wrap; margin-bottom:24px;">${escapeHtml(data.message)}</div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding:10px 0 20px 0;">
                      <a href="${actionUrl}"
                         style="display:inline-block; background:#ff8845; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800; letter-spacing:0.5px; padding:14px 28px; border-radius:999px; box-shadow:0 4px 12px rgba(255,136,69,0.35); text-transform:uppercase;">
                        ${escapeHtml(data.buttonText)} →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; text-align:center; font-size:12px; line-height:1.4; color:#9ca3af;">
                  SWAP UAE — Trade items without spending cash.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:16px 0 0 0; font-size:12px; line-height:1.4; color:#6b7280;">
                <a href="${unsubscribeUrl}" style="color:#6b7280; text-decoration:underline;">Notification Settings</a>
                <span> · </span>
                <a href="${privacyUrl}" style="color:#6b7280; text-decoration:underline;">Privacy & Terms</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

      const text = `Hi @${username},\n\n${data.heading}\n\n${data.message}\n\nList your item now: ${actionUrl}\n\nSWAP UAE`;

      try {
        await sendEmail({
          to: email,
          subject: data.subject,
          html,
          text,
        });
        sentCount++;
      } catch (err) {
        console.warn(`[Admin Campaign] Failed to send email to ${email}:`, err);
        failCount++;
      }
    }

    // In-app notification & cooldown log
    const notifRows = targetUsers.map((u) => ({
      user_id: u.id,
      type: "admin_nudge_email",
      title: data.heading,
      body: data.message.length > 150 ? `${data.message.slice(0, 147)}...` : data.message,
      link: data.buttonLink || "/my-listings?add=true",
      read: false,
    }));

    if (notifRows.length > 0) {
      for (let i = 0; i < notifRows.length; i += 200) {
        await supabaseAdmin.from("notifications").insert(notifRows.slice(i, i + 200) as any);
      }
    }

    return {
      count: sentCount,
      failed: failCount,
      total: targetUsers.length,
      message: `Successfully emailed ${sentCount} user${sentCount === 1 ? "" : "s"} without listings!`,
    };
  });

export const adminEmailIndividualUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        subject: z.string().optional(),
        heading: z.string().optional(),
        message: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, absoluteUrl } = await import("./email.server");

    // 1. Check last email sent within 7 days
    const { data: recentNotif } = await supabaseAdmin
      .from("notifications")
      .select("created_at")
      .eq("user_id", data.userId)
      .in("type", ["admin_nudge_email", "admin_broadcast_email"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentNotif) {
      const diffMs = Date.now() - new Date(recentNotif.created_at).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (diffMs < sevenDaysMs) {
        const remainingDays = Math.ceil((sevenDaysMs - diffMs) / (24 * 60 * 60 * 1000));
        throw new Error(
          `This user was already emailed recently. 7-day cooldown active: please wait ${remainingDays} more day(s).`,
        );
      }
    }

    // 2. Fetch auth user for email address
    const { data: authUser, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (uErr || !authUser?.user?.email) {
      throw new Error("Could not retrieve user email address");
    }

    // 3. Fetch profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username, display_name")
      .eq("id", data.userId)
      .maybeSingle();

    const username = profile?.display_name || profile?.username || authUser.user.user_metadata?.username || "Trader";
    const email = authUser.user.email;

    const subject = data.subject || "List your first item on SWAP — Trade easily across UAE 📦";
    const heading = data.heading || "Turn your unused items into something you love";
    const message =
      data.message ||
      "You joined SWAP, but haven't listed any items yet!\n\nListing takes less than 30 seconds with our instant camera auto-fill. Start swapping electronics, accessories, books, and more with UAE members without spending money.";

    const actionUrl = absoluteUrl("/my-listings?add=true");
    const unsubscribeUrl = absoluteUrl("/settings");
    const privacyUrl = absoluteUrl("/terms");

    const html = `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#ffffff; font-family: 'Asap Sharp', 'Asap', Arial, Helvetica, sans-serif; color:#111111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#ffffff;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; border-collapse:collapse; margin-top:20px;">
            <tr>
              <td style="background:#fff8ef; padding:32px; border-radius:24px; border:2px solid #fed7aa;">
                <div style="text-align:center; margin-bottom:20px;">
                  <span style="font-size:32px;">📦</span>
                  <h1 style="margin:8px 0 0 0; font-size:24px; line-height:1.2; font-weight:900; color:#111111;">
                    ${escapeHtml(heading)}
                  </h1>
                </div>

                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.5; color:#374151;">
                  Hi <strong>@${escapeHtml(username)}</strong>,
                </p>

                <div style="font-size:15px; line-height:1.6; color:#374151; white-space:pre-wrap; margin-bottom:24px;">${escapeHtml(message)}</div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding:10px 0 20px 0;">
                      <a href="${actionUrl}"
                         style="display:inline-block; background:#ff8845; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800; letter-spacing:0.5px; padding:14px 28px; border-radius:999px; box-shadow:0 4px 12px rgba(255,136,69,0.35); text-transform:uppercase;">
                        List an Item Now →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; text-align:center; font-size:12px; line-height:1.4; color:#9ca3af;">
                  SWAP UAE — Trade items without spending cash.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:16px 0 0 0; font-size:12px; line-height:1.4; color:#6b7280;">
                <a href="${unsubscribeUrl}" style="color:#6b7280; text-decoration:underline;">Notification Settings</a>
                <span> · </span>
                <a href="${privacyUrl}" style="color:#6b7280; text-decoration:underline;">Privacy & Terms</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    const text = `Hi @${username},\n\n${heading}\n\n${message}\n\nList your item now: ${actionUrl}\n\nSWAP UAE`;

    await sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Save in notifications as admin_nudge_email to start 7-day cooldown
    await supabaseAdmin.from("notifications").insert({
      user_id: data.userId,
      type: "admin_nudge_email",
      title: heading,
      body: message.length > 150 ? `${message.slice(0, 147)}...` : message,
      link: "/my-listings?add=true",
      read: false,
    });

    return {
      ok: true,
      sent_at: new Date().toISOString(),
      message: `Reminder email successfully sent to @${username}!`,
    };
  });

