import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const followInput = z.object({ user_id: z.string().uuid() });

export const listMyFollowedIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.following_id);
  });

export const followUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => followInput.parse(data))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("You cannot follow yourself.");
    const { error } = await context.supabase
      .from("user_follows")
      .upsert({ follower_id: context.userId, following_id: data.user_id }, { onConflict: "follower_id,following_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unfollowUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => followInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", context.userId)
      .eq("following_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyFollowing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_follows")
      .select("created_at, profile:profiles!user_follows_following_id_fkey(id, username, display_name, avatar_color, avatar_url, location, bio)")
      .eq("follower_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row) => (row.profile ? [{ ...row.profile, followed_at: row.created_at }] : []));
  });
