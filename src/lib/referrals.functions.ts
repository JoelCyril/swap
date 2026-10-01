import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { referrerUsername: string }) =>
    z.object({ referrerUsername: z.string().trim().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanRef = data.referrerUsername.trim().toLowerCase();

    // 1. Get current user's profile
    const { data: myProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, created_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (!myProfile) return { ok: false, reason: "profile_not_found" };

    // Prevent self-referral
    if (myProfile.username.toLowerCase() === cleanRef) {
      return { ok: false, reason: "self" };
    }

    // 2. Find referrer
    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name")
      .ilike("username", cleanRef)
      .maybeSingle();

    if (!referrer || referrer.id === context.userId) {
      return { ok: false, reason: "referrer_not_found" };
    }

    // 3. Check if current user was already referred
    let alreadyClaimed = false;
    try {
      const { data: existingRef } = await supabaseAdmin
        .from("referrals")
        .select("id")
        .eq("referred_id", context.userId)
        .maybeSingle();
      if (existingRef) alreadyClaimed = true;
    } catch {}

    if (!alreadyClaimed) {
      const { data: existingNotif } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("type", "referral_signup")
        .ilike("link", `%/profile/${myProfile.username}`)
        .maybeSingle();
      if (existingNotif) alreadyClaimed = true;
    }

    if (alreadyClaimed) {
      return { ok: false, reason: "already_claimed" };
    }

    // 4. Save into referrals table (if table exists)
    try {
      await supabaseAdmin.from("referrals").insert({
        referrer_id: referrer.id,
        referred_id: context.userId,
        status: "joined",
      });
    } catch (e) {
      console.warn("Notice: referrals table insert skipped (migration may not be applied yet):", e);
    }

    // 5. Notify the referrer with an in-app notification
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: referrer.id,
        type: "referral_signup",
        title: "New referral joined! 🎉",
        body: `@${myProfile.username} joined SWAP through your invite link.`,
        link: `/profile/${myProfile.username}`,
        read: false,
      });
    } catch (e) {
      console.warn("Could not insert referral notification:", e);
    }

    return { ok: true, referrer: referrer.username };
  });

export const getMyReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get user's username
    const { data: myProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    if (!myProfile) {
      return { referralCode: "", totalReferrals: 0, referrals: [] };
    }

    let referralsList: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      avatar_color: string | null;
      created_at: string;
      status: string;
    }> = [];

    // 1. Try fetching from referrals table
    try {
      const { data: rows, error } = await supabaseAdmin
        .from("referrals")
        .select("id, referred_id, status, created_at")
        .eq("referrer_id", context.userId)
        .order("created_at", { ascending: false });

      if (!error && rows && rows.length > 0) {
        const referredIds = rows.map((r) => r.referred_id);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, username, display_name, avatar_url, avatar_color")
          .in("id", referredIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

        referralsList = rows.map((r) => {
          const p = profileMap.get(r.referred_id);
          return {
            id: r.id,
            username: p?.username || "user",
            display_name: p?.display_name || p?.username || "User",
            avatar_url: p?.avatar_url || null,
            avatar_color: p?.avatar_color || null,
            created_at: r.created_at,
            status: r.status,
          };
        });
      }
    } catch {}

    // 2. Fallback to notifications if referrals table returned nothing
    if (referralsList.length === 0) {
      try {
        const { data: notifs } = await supabaseAdmin
          .from("notifications")
          .select("id, body, link, created_at")
          .eq("user_id", context.userId)
          .eq("type", "referral_signup")
          .order("created_at", { ascending: false });

        for (const n of notifs ?? []) {
          const match = (n.body || "").match(/@([a-zA-Z0-9_]+)/);
          const uname = match ? match[1] : (n.link || "").replace("/profile/", "");
          if (uname) {
            referralsList.push({
              id: n.id,
              username: uname,
              display_name: uname,
              avatar_url: null,
              avatar_color: null,
              created_at: n.created_at,
              status: "joined",
            });
          }
        }
      } catch {}
    }

    return {
      referralCode: myProfile.username,
      totalReferrals: referralsList.length,
      referrals: referralsList,
    };
  });

export type AdminReferralLeader = {
  rank: number;
  userId: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  totalReferrals: number;
  activeCount: number;
  latestReferralAt: string;
};

export const getAdminReferralsLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch all profiles for lookups
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url, avatar_color, created_at");

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const profileByUsername = new Map((profiles ?? []).map((p) => [p.username.toLowerCase(), p]));

    // Fetch listings and offers to calculate active status
    const { data: listings } = await supabaseAdmin
      .from("listings")
      .select("owner_id")
      .eq("status", "active");

    const { data: offers } = await supabaseAdmin
      .from("offers")
      .select("from_user, to_user")
      .eq("status", "completed");

    const activeUserIds = new Set<string>();
    for (const l of listings ?? []) activeUserIds.add(l.owner_id);
    for (const o of offers ?? []) {
      activeUserIds.add(o.from_user);
      activeUserIds.add(o.to_user);
    }

    // Try reading from referrals table
    type RefRecord = { referrerId: string; referredId: string; createdAt: string };
    const allRecords: RefRecord[] = [];

    try {
      const { data: refRows, error } = await supabaseAdmin
        .from("referrals")
        .select("referrer_id, referred_id, created_at");

      if (!error && refRows && refRows.length > 0) {
        for (const r of refRows) {
          allRecords.push({
            referrerId: r.referrer_id,
            referredId: r.referred_id,
            createdAt: r.created_at,
          });
        }
      }
    } catch {}

    // Fallback: parse from notifications table
    if (allRecords.length === 0) {
      try {
        const { data: notifs } = await supabaseAdmin
          .from("notifications")
          .select("user_id, body, link, created_at")
          .eq("type", "referral_signup");

        for (const n of notifs ?? []) {
          const match = (n.body || "").match(/@([a-zA-Z0-9_]+)/);
          const uname = match ? match[1].toLowerCase() : (n.link || "").replace("/profile/", "").toLowerCase();
          const referredProfile = profileByUsername.get(uname);
          if (referredProfile) {
            allRecords.push({
              referrerId: n.user_id,
              referredId: referredProfile.id,
              createdAt: n.created_at,
            });
          }
        }
      } catch {}
    }

    // Aggregate by referrer
    const referrerStats = new Map<
      string,
      { total: number; active: number; latestAt: string; records: RefRecord[] }
    >();

    for (const rec of allRecords) {
      const existing = referrerStats.get(rec.referrerId) || {
        total: 0,
        active: 0,
        latestAt: rec.createdAt,
        records: [],
      };
      existing.total += 1;
      if (activeUserIds.has(rec.referredId)) {
        existing.active += 1;
      }
      if (new Date(rec.createdAt) > new Date(existing.latestAt)) {
        existing.latestAt = rec.createdAt;
      }
      existing.records.push(rec);
      referrerStats.set(rec.referrerId, existing);
    }

    // Sort leaderboard
    const sorted = Array.from(referrerStats.entries())
      .map(([referrerId, stats]) => {
        const p = profileMap.get(referrerId);
        return {
          userId: referrerId,
          username: p?.username || "unknown",
          display_name: p?.display_name || p?.username || "User",
          avatar_url: p?.avatar_url || null,
          avatar_color: p?.avatar_color || null,
          totalReferrals: stats.total,
          activeCount: stats.active,
          latestReferralAt: stats.latestAt,
        };
      })
      .sort((a, b) => b.totalReferrals - a.totalReferrals || b.activeCount - a.activeCount);

    const leaderboard: AdminReferralLeader[] = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    // Recent activity list
    const recentActivity = allRecords
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25)
      .map((rec) => {
        const refUser = profileMap.get(rec.referrerId);
        const joinedUser = profileMap.get(rec.referredId);
        return {
          referrerUsername: refUser?.username || "user",
          referrerName: refUser?.display_name || refUser?.username || "User",
          joinedUsername: joinedUser?.username || "user",
          joinedName: joinedUser?.display_name || joinedUser?.username || "User",
          createdAt: rec.createdAt,
          isActive: activeUserIds.has(rec.referredId),
        };
      });

    const totalReferrals = allRecords.length;
    const totalActive = allRecords.filter((r) => activeUserIds.has(r.referredId)).length;
    const activeRate = totalReferrals > 0 ? Math.round((totalActive / totalReferrals) * 100) : 0;

    return {
      totalReferrals,
      totalActive,
      activeRate,
      leaderboard,
      recentActivity,
    };
  });
