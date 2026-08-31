import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfile } from "./profile.server";
import { publicClient } from "./announcements.server";


export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*, author:profiles!announcements_author_id_fkey(id, username, display_name, avatar_color, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((a) => !a.body?.startsWith('{"kind":"wanted_request"'));
});

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        body: z.string().max(4000).default(""),
        image_urls: z.array(z.string().url().max(2048)).max(6).default([]),
      })
      .refine((v) => v.body.trim().length > 0 || v.image_urls.length > 0, {
        message: "Write a message or add a photo",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only moderators can post announcements");
    await ensureProfile(context.userId);
    const { data: row, error } = await context.supabase
      .from("announcements")
      .insert({ author_id: context.userId, body: data.body, image_urls: data.image_urls })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Notify every member about the new announcement.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: members } = await supabaseAdmin.from("profiles").select("id");
      // Respect each member's "Community announcements" switch.
      const { data: offRows } = await supabaseAdmin
        .from("notification_prefs")
        .select("user_id")
        .eq("announcements", false);
      const muted = new Set((offRows ?? []).map((r) => r.user_id));
      const preview = data.body.trim().slice(0, 120) || "New photo announcement";
      const rows = (members ?? [])
        .filter((m) => m.id !== context.userId && !muted.has(m.id))
        .map((m) => ({
          user_id: m.id,
          type: "announcement",
          title: "New community announcement",
          body: preview,
          link: "/announcements",
        }));
      if (rows.length > 0) await supabaseAdmin.from("notifications").insert(rows);

    } catch (e) {
      console.error("Announcement notify failed", e);
    }

    return row;
  });


export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
