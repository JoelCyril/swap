import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { absoluteUrl, sendEmail } from "./email.server";

export const sendWelcomeEmailIfNeeded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("email_events")
      .select("id")
      .eq("user_id", context.userId)
      .eq("type", "welcome")
      .maybeSingle();

    if (existing) {
      return { sent: false };
    }

    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (userError) throw new Error(userError.message);

    const user = authUser.user;
    const email = user?.email;
    if (!email) return { sent: false };

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    if (createdAt < tenMinutesAgo) {
      return { sent: false };
    }

    const { error: insertError } = await supabaseAdmin.from("email_events").insert({
      user_id: context.userId,
      type: "welcome",
    });

    if (insertError) {
      if (insertError.message.toLowerCase().includes("duplicate")) {
        return { sent: false };
      }

      throw new Error(insertError.message);
    }

    const listingsUrl = absoluteUrl("/listings");

    await sendEmail({
      to: email,
      subject: "Thanks for joining SWAP",
      text: `Welcome to SWAP!

Thanks for joining SWAP. You can now browse listings, add your items, and start making swap offers.

Start browsing:
${listingsUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #111827;">Thanks for joining SWAP</h1>
          <p>Welcome to SWAP! You can now browse listings, add your items, and start making swap offers.</p>
          <p>
            <a href="${listingsUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: white; text-decoration: none; border-radius: 999px;">
              Start browsing
            </a>
          </p>
        </div>
      `,
    });

    return { sent: true };
  });
