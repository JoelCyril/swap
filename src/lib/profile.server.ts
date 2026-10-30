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
  await supabaseAdmin.from("user_follows").update({ follower_id: newUserId }).eq("follower_id", oldProfileId);
  await supabaseAdmin.from("user_follows").update({ following_id: newUserId }).eq("following_id", oldProfileId);

  // 8. Delete the old profile row to release its unique username constraint
  await supabaseAdmin.from("profiles").delete().eq("id", oldProfileId);

  // 9. Update the new user's profile with all legacy metadata
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
  });

  return true;
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

  // If user already has a complete custom profile, return it (syncing avatar if missing)
  if (existing) {
    if (!existing.avatar_url && metaAvatar) {
      await supabaseAdmin.from("profiles").update({ avatar_url: metaAvatar }).eq("id", userId);
      existing.avatar_url = metaAvatar;
    }
    if (existing.username && !existing.username.startsWith("user") && existing.username !== "joeltcyril") {
      return existing;
    }
  }

  let base = slugify(meta.username || (user?.email ?? "").split("@")[0] || "user");
  if (!base) base = "user";

  // Check if an unclaimed legacy profile matches this user's email prefix or username
  const { data: candidate } = await supabaseAdmin
    .from("profiles")
    .select("id, username")
    .ilike("username", base)
    .maybeSingle();

  if (candidate && candidate.id !== userId) {
    const merged = await mergeOrphanedProfile(userId, candidate.id);
    if (merged) {
      const { data: updated } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
      return updated;
    }
  }

  // Specifically check if base contains "joel" for the platform administrator
  if (base.includes("joel")) {
    const { data: joelCandidate } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("username", "joelcyril")
      .maybeSingle();

    if (joelCandidate && joelCandidate.id !== userId) {
      const merged = await mergeOrphanedProfile(userId, joelCandidate.id);
      if (merged) {
        const { data: updated } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
        return updated;
      }
    }
  }

  if (existing) return existing;

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

  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" });

  return created;
}
