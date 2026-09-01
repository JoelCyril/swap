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

