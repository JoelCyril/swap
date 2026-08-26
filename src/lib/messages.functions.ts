import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { moderate } from "./moderation";

// Define or import your allowed attachment URL validation logic

function isAllowedAttachmentUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return false;

    const isSupabaseStorage =
      url.hostname.includes("supabase.co") &&
      url.pathname.includes("/storage/v1/object/");

    return isSupabaseStorage;
  } catch {
    return false;
  }
}

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { offer_id: string }) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_profile_fkey(*)")
      .eq("offer_id", data.offer_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        offer_id: z.string().uuid(),
        body: z.string().max(2000).default(""),
        attachment_urls: z.array(z.string().url().max(2048)).max(4).default([]),
      })
      .refine((v) => v.body.trim().length > 0 || v.attachment_urls.length > 0, {
        message: "Write a message or attach a file.",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Validate all attachment URLs against allowed domains/patterns
    if (!data.attachment_urls.every(isAllowedAttachmentUrl)) {
      throw new Error("Invalid attachment URL");
    }

    const verdict = moderate(data.body || "", "chat");
    if (verdict.flagged) {
      throw new Error(
        `Message blocked: ${verdict.reason} Prohibited: ${verdict.terms.join(", ")}`,
      );
    }
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({
        offer_id: data.offer_id,
        sender_id: context.userId,
        body: data.body,
        attachment_urls: data.attachment_urls,
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return row;
  });

export const markMessagesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { offer_id: string }) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("offer_id", data.offer_id)
      .neq("sender_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });
