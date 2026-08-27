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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function offerEmailHtml(params: {
  listingTitle: string;
  offerUrl: string;
  unsubscribeUrl: string;
  privacyUrl: string;
}) {
  const listingTitle = escapeHtml(params.listingTitle);

  return `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#ffffff; font-family: 'Asap Sharp', 'Asap', Arial, Helvetica, sans-serif; color:#111111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#ffffff;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:960px; border-collapse:collapse;">
            <tr>
              <td style="background:#fff8ef; padding:28px 34px 18px 34px;">
                <h1 style="margin:0 0 18px 0; font-size:29px; line-height:1.2; font-weight:800; letter-spacing:-0.3px; color:#111111;">
                  A new swap offer awaits you on SWAP
                </h1>

                <p style="margin:0; font-size:16px; line-height:1.45; color:#111111;">
                  You’ve got a swap offer for your listed item:
                  <strong>"${listingTitle}"</strong>.
                  Another SWAP member is interested in trading.
                  Click below to view the offer details and accept or negotiate.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding:20px 0 14px 0;">
                      <a href="${params.offerUrl}"
                         style="display:inline-block; background:#ff8845; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800; letter-spacing:0.3px; padding:13px 24px; border-radius:999px; box-shadow:0 3px 8px rgba(0,0,0,0.24);">
                        VIEW OFFER DETAILS
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; text-align:center; font-size:10px; line-height:1.4; color:#111111; text-transform:uppercase;">
                  Check your current active listings.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:10px 0 0 0; font-size:12px; line-height:1.4; color:#111111;">
                <a href="${params.unsubscribeUrl}" style="color:#111111; text-decoration:underline;">Unsubscribe</a>
                <span style="color:#111111;"> | </span>
                <a href="${params.privacyUrl}" style="color:#111111; text-decoration:underline;">SWAP UAE Privacy</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function offerEmailText(params: {
  listingTitle: string;
  offerUrl: string;
  unsubscribeUrl: string;
  privacyUrl: string;
}) {
  return `A new swap offer awaits you on SWAP

You've got a swap offer for your listed item: "${params.listingTitle}". Another SWAP member is interested in trading. Click below to view the offer details and accept or negotiate.

View offer details:
${params.offerUrl}

Check your current active listings.

Unsubscribe:
${params.unsubscribeUrl}

SWAP UAE Privacy:
${params.privacyUrl}
`;
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
        console.error("Could not fetch offer email recipient", userError.message);
        return;
      }

      const recipientEmail = data.user?.email;
      if (!recipientEmail) return;

      const offerUrl = absoluteUrl(params.link ?? "/offers");
      const unsubscribeUrl = absoluteUrl("/settings?tab=notifications");
      const privacyUrl = absoluteUrl("/terms");

      const listingTitle =
        params.body?.match(/"([^"]+)"/)?.[1] ?? "your listed item";

      await sendEmail({
        to: recipientEmail,
        subject: "A new swap offer awaits you on SWAP",
        html: offerEmailHtml({
          listingTitle,
          offerUrl,
          unsubscribeUrl,
          privacyUrl,
        }),
        text: offerEmailText({
          listingTitle,
          offerUrl,
          unsubscribeUrl,
          privacyUrl,
        }),
      });
    }
  } catch (error) {
    console.error("Notification dispatch failed", error);
  }
}
