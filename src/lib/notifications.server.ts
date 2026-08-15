export type PrefKey = "announcements" | "messages" | "saves" | "offers";

/** Maps a notification type onto the user's preference switch. */
export function prefKeyFor(type: string): PrefKey | null {
  const t = type.toLowerCase();
  if (t.includes("announce")) return "announcements";
  if (t.includes("message") || t.includes("chat")) return "messages";
  if (t.includes("save") || t.includes("fav")) return "saves";
  if (
    t.includes("offer") ||
    t.includes("meetup") ||
    t.includes("trade") ||
    t.includes("swap") ||
    t.includes("item") ||
    t.includes("complete") ||
    t.includes("received") ||
    t.includes("agreed") ||
    t.includes("negotiat")
  )
    return "offers";
  return null;
}


export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const key = prefKeyFor(params.type);
    if (key) {
      const { data: prefs } = await supabaseAdmin
        .from("notification_prefs")
        .select(key)
        .eq("user_id", params.userId)
        .maybeSingle();
      if (prefs && (prefs as Record<string, boolean>)[key] === false) return;
    }

    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? "",
      link: params.link ?? "",
    });
    if (error) console.error("Notification insert failed", error.message);

  } catch (error) {
    console.error("Notification dispatch failed", error);
  }
}