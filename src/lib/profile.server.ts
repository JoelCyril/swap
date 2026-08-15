/**
 * Server-only helpers for profiles.
 *
 * Remixed projects lose the `auth.users` trigger that creates a profile row on
 * sign-up, which silently breaks every write that depends on a profile
 * (saving settings, creating listings, redeeming an admin code). These helpers
 * make the profile self-healing.
 */

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/** Make sure the signed-in user has a `profiles` row; returns the profile. */
export async function ensureProfile(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return existing;

  const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = userRes?.user;
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;

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
      avatar_color: "oklch(0.75 0.15 55)",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" });

  return created;
}
