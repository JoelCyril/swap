/**
 * Server-only helpers for profiles.
 *
 * Remixed projects lose the `auth.users` trigger that creates a profile row on
 * sign-up, which silently breaks every write that depends on a profile
 * (saving settings, creating listings, redeeming an admin code). These helpers
 * make the profile self-healing and automatically restore returning users'
 * listings, items, and roles.
 */

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function normalize(str: string | null | undefined): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenize(str: string | null | undefined): string[] {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Transfers all marketplace data (items, listings, roles, messages, offers)
 * from an orphaned legacy profile (one without an auth.users record) to the
 * active signed-in user's UUID.
 */
export async function mergeOrphanedProfile(newUserId: string, oldProfileId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Verify old profile exists
  const { data: oldProfile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", oldProfileId)
    .maybeSingle();

  if (!oldProfile) return false;

  // Verify that oldProfileId does NOT belong to an active auth.user
  try {
    const { data: authUserRes } = await supabaseAdmin.auth.admin.getUserById(oldProfileId);
    if (authUserRes?.user) {
      // Belongs to another active user; do not overwrite!
      return false;
    }
  } catch {
    // If lookup fails or user doesn't exist, it is safe to proceed
  }

  // 0. Try DB RPC first
  try {
    const { data: rpcSuccess } = await supabaseAdmin.rpc("merge_orphaned_profile", {
      p_old_id: oldProfileId,
      p_new_id: newUserId,
    });
    if (rpcSuccess) {
      // Double check that tos_accepted_at and age_confirmed are persisted
      await supabaseAdmin.from("profiles").update({
        tos_accepted_at: oldProfile.tos_accepted_at || new Date().toISOString(),
        age_confirmed: oldProfile.age_confirmed || 18,
      }).eq("id", newUserId);
      return true;
    }
  } catch (e) {
    console.warn("merge_orphaned_profile RPC fallback to manual merge:", e);
  }

  // Fallback manual transfer:
  // 1. Transfer items
  await supabaseAdmin.from("items").update({ owner_id: newUserId }).eq("owner_id", oldProfileId);

  // 2. Transfer listings
  await supabaseAdmin.from("listings").update({ owner_id: newUserId }).eq("owner_id", oldProfileId);

  // 3. Transfer announcements
  await supabaseAdmin.from("announcements").update({ author_id: newUserId }).eq("author_id", oldProfileId);

  // 4. Transfer messages
  await supabaseAdmin.from("messages").update({ sender_id: newUserId }).eq("sender_id", oldProfileId);

  // 5. Transfer offers
  await supabaseAdmin.from("offers").update({ from_user: newUserId }).eq("from_user", oldProfileId);
  await supabaseAdmin.from("offers").update({ to_user: newUserId }).eq("to_user", oldProfileId);
  await supabaseAdmin.from("offers").update({ turn_user: newUserId }).eq("turn_user", oldProfileId);

  // 6. Transfer user roles (e.g. admin)
  const { data: oldRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", oldProfileId);
  if (oldRoles && oldRoles.length > 0) {
    for (const r of oldRoles) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: newUserId, role: r.role });
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", oldProfileId);
  }

  // 7. Transfer favourites, notifications, and follows
  await supabaseAdmin.from("favourites").update({ user_id: newUserId }).eq("user_id", oldProfileId);
  await supabaseAdmin.from("notifications").update({ user_id: newUserId }).eq("user_id", oldProfileId);
  await supabaseAdmin.from("notification_prefs").update({ user_id: newUserId }).eq("user_id", oldProfileId);
  await supabaseAdmin.from("user_follows").update({ follower_id: newUserId }).eq("follower_id", oldProfileId);
  await supabaseAdmin.from("user_follows").update({ following_id: newUserId }).eq("following_id", oldProfileId);

  // 8. Transfer profile_private
  const { data: oldPriv } = await supabaseAdmin.from("profile_private").select("*").eq("id", oldProfileId).maybeSingle();
  if (oldPriv) {
    await supabaseAdmin.from("profile_private").upsert({
      id: newUserId,
      full_name: oldPriv.full_name,
      birthday: oldPriv.birthday,
    });
    await supabaseAdmin.from("profile_private").delete().eq("id", oldProfileId);
  }

  // 9. Rename old profile row to release unique constraint, then delete
  await supabaseAdmin.from("profiles").update({ username: `archived_${oldProfileId.slice(0, 8)}` }).eq("id", oldProfileId);
  await supabaseAdmin.from("profiles").delete().eq("id", oldProfileId);

  // 10. Update the new user's profile with all legacy metadata
  await supabaseAdmin.from("profiles").upsert({
    id: newUserId,
    username: oldProfile.username,
    display_name: oldProfile.display_name || oldProfile.username,
    avatar_url: oldProfile.avatar_url,
    banner_url: oldProfile.banner_url,
    avatar_color: oldProfile.avatar_color,
    location: oldProfile.location,
    emirate: oldProfile.emirate,
    bio: oldProfile.bio,
    interests: oldProfile.interests ?? [],
    tos_accepted_at: oldProfile.tos_accepted_at || new Date().toISOString(),
    age_confirmed: oldProfile.age_confirmed || 18,
  });

  return true;
}

/**
 * Intelligent candidate lookup for returning OAuth users whose accounts were
 * orphaned during database migration/reset.
 */
export async function findOrphanedCandidate(userId: string, user: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const email = (user?.email ?? "").toLowerCase();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const metaName = meta.full_name || meta.name || "";
  const metaUname = meta.username || meta.user_name || "";
  const emailPrefix = normalize(email.split("@")[0]);
  const gTokens = tokenize(metaName);

  // 1. Get all active auth user IDs to ensure we NEVER match another active account
  const { data: authUsersRes } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const activeAuthIds = new Set((authUsersRes?.users || []).map((u) => u.id));

  // 2. Fetch all profiles and private info
  const { data: allProfiles } = await supabaseAdmin.from("profiles").select("*");
  const { data: allPriv } = await supabaseAdmin.from("profile_private").select("*");
  const privMap = new Map((allPriv || []).map((p) => [p.id, p]));

  // Count listings to prioritize profiles with active items/listings
  const { data: allListings } = await supabaseAdmin.from("listings").select("owner_id");
  const listingCountMap = new Map<string, number>();
  for (const l of allListings || []) {
    listingCountMap.set(l.owner_id, (listingCountMap.get(l.owner_id) || 0) + 1);
  }

  // Filter out any profile that belongs to an active auth user (including current user)
  const orphanedProfiles = (allProfiles || []).filter((p) => !activeAuthIds.has(p.id) && p.id !== userId);

  let bestCandidate: any = null;
  let bestScore = 0;

  for (const prof of orphanedProfiles) {
    const priv = privMap.get(prof.id);
    const profUname = normalize(prof.username);
    const profDname = normalize(prof.display_name);
    const profFullName = (priv?.full_name || "").trim();
    const profTokens = tokenize(profFullName);
    const listingsCount = listingCountMap.get(prof.id) || 0;

    let score = 0;

    // Check exact username matches
    if (metaUname && profUname === normalize(metaUname)) {
      score = 100;
    } else if (emailPrefix && profUname === emailPrefix) {
      score = 95;
    } else if (profDname && profDname === normalize(metaName)) {
      score = 90;
    } else if (profFullName && normalize(profFullName) === normalize(metaName)) {
      score = 85;
    } else if (profTokens.length >= 2 && profTokens.every((t) => gTokens.includes(t))) {
      // e.g. SWAP full name "Abdul Raafay" in Google name "Abdul Raafay Amaan"
      score = 80;
    } else if (gTokens.length >= 2 && gTokens.every((t) => profTokens.includes(t))) {
      // e.g. Google name "Atul Nair" in SWAP full name "Atul Ajit Nair"
      score = 75;
    } else if (profUname.length >= 4 && emailPrefix.includes(profUname)) {
      // e.g. email "abdulraafayamaan" contains username "raafay"
      score = 70;
    } else if (emailPrefix.length >= 4 && profUname.includes(emailPrefix)) {
      score = 65;
    }

    if (score > 0) {
      const totalScore = score * 1000 + listingsCount;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestCandidate = prof;
      }
    }
  }

  return bestCandidate;
}

/** Make sure the signed-in user has a `profiles` row; returns the profile. */
export async function ensureProfile(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check if current user already has a profile
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = userRes?.user;
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const metaAvatar = meta.avatar_url || meta.picture;

  // If user already has a complete custom profile with tos_accepted_at and not a temp/user_ username, return it
  if (
    existing &&
    existing.tos_accepted_at &&
    existing.username &&
    !existing.username.startsWith("user") &&
    !existing.username.startsWith("temp_")
  ) {
    if (!existing.avatar_url && metaAvatar) {
      await supabaseAdmin.from("profiles").update({ avatar_url: metaAvatar }).eq("id", userId);
      existing.avatar_url = metaAvatar;
    }
    return existing;
  }

  // Look for an orphaned legacy profile candidate to claim automatically
  const candidate = await findOrphanedCandidate(userId, user);
  if (candidate) {
    const merged = await mergeOrphanedProfile(userId, candidate.id);
    if (merged) {
      const { data: updated } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
      return updated;
    }
  }

  if (existing) {
    if (!existing.avatar_url && metaAvatar) {
      await supabaseAdmin.from("profiles").update({ avatar_url: metaAvatar }).eq("id", userId);
      existing.avatar_url = metaAvatar;
    }
    return existing;
  }

  let base = slugify(meta.username || (user?.email ?? "").split("@")[0] || "user");
  if (!base) base = "user";

  let username = base;
  for (let i = 0; i < 50; i++) {
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!taken) break;
    username = `${base}${i + 1}`;
  }

  const { data: created, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: userId,
      username,
      display_name: meta.display_name || meta.full_name || username,
      avatar_url: metaAvatar || null,
      avatar_color: "oklch(0.75 0.15 55)",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" }).select().maybeSingle();

  return created;
}
