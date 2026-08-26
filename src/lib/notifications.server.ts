import { absoluteUrl, sendEmail } from "./email.server";

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

    if (params.type === "offer_received") {
      const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(params.userId);

      if (userError) {
        console.error("Could not fetch notification email recipient", userError.message);
        return;
      }

      const recipientEmail = data.user?.email;
      if (!recipientEmail) return;

      const offerUrl = absoluteUrl(params.link ?? "/offers");

      await sendEmail({
        to: recipientEmail,
        subject: "You received a new offer on SWAP",
        text: `${params.title}

${params.body ?? "Someone sent you a new offer."}

View it here:
${offerUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #111827;">You received a new offer on SWAP</h1>
            <p>${params.body ?? "Someone sent you a new offer."}</p>
            <p>
              <a href="${offerUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: white; text-decoration: none; border-radius: 999px;">
                View offer
              </a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              You are receiving this because offer notifications are enabled for your SWAP account.
            </p>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error("Notification dispatch failed", error);
  }
}
