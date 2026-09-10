import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { moderate } from "./moderation";
import { notifyUser } from "./notifications.server";
import { parseMessageMeta, encodeMessageMeta } from "./messages.meta";

// Define or import your allowed attachment URL validation logic

function isAllowedAttachmentUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return false;

    const isSupabaseStorage =
      url.hostname.includes("supabase.co") &&
      url.pathname.includes("/storage/v1/object/");

    const isProxiedMedia =
      (url.hostname === "swapuae.com" || url.hostname === "www.swapuae.com") &&
      url.pathname.startsWith("/media/");

    return isSupabaseStorage || isProxiedMedia;
  } catch {
    return false;
  }
}

/**
 * PostgREST cannot always resolve an embedded self-reference while its schema
 * cache is refreshing. Load reply previews separately so chat remains usable
 * even in that state.
 */
async function attachReplyPreviews(context: { supabase: any }, rows: any[]) {
  const replyIds = [...new Set(rows.map((row) => row.reply_to_id).filter(Boolean))];
  const parsedRows = rows.map((row) => parseMessageMeta(row));
  if (replyIds.length === 0) return parsedRows;

  const { data: replies, error } = await context.supabase
    .from("messages")
    .select("id, body, attachment_urls, sender_id")
    .in("id", replyIds);
  if (error) throw new Error(error.message);

  const repliesById = new Map(
    (replies ?? []).map((reply: any) => [reply.id, parseMessageMeta(reply)]),
  );
  return parsedRows.map((row) => ({
    ...row,
    reply_to: row.reply_to_id ? repliesById.get(row.reply_to_id) ?? null : null,
  }));
}

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { offer_id: string }) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Direct privacy enforcement: ONLY trade participants can read messages
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: offer, error: offerError } = await supabaseAdmin
      .from("offers")
      .select("from_user, to_user")
      .eq("id", data.offer_id)
      .maybeSingle();

    if (offerError || !offer) {
      throw new Error("Offer not found");
    }

    if (offer.from_user !== context.userId && offer.to_user !== context.userId) {
      // Caller is not a participant. Chat is strictly private to the 2 trading members.
      return [];
    }

    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_profile_fkey(*)")
      .eq("offer_id", data.offer_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return attachReplyPreviews(context, rows ?? []);
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        offer_id: z.string().uuid(),
        body: z.string().max(2000).default(""),
        attachment_urls: z.array(z.string().url().max(2048)).max(4).default([]),
        reply_to_id: z.string().uuid().nullable().optional(),
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

    // Direct privacy enforcement: ONLY trade participants can send messages
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: offer, error: offerError } = await supabaseAdmin
      .from("offers")
      .select("from_user, to_user")
      .eq("id", data.offer_id)
      .maybeSingle();

    if (offerError || !offer) throw new Error("Offer not found");

    if (offer.from_user !== context.userId && offer.to_user !== context.userId) {
      throw new Error("Only trade participants can send messages");
    }

    const verdict = moderate(data.body || "", "chat");
    if (verdict.flagged) {
      throw new Error(
        `Message blocked: ${verdict.reason} Prohibited: ${verdict.terms.join(", ")}`,
      );
    }
    if (data.reply_to_id) {
      const { data: repliedTo, error: replyError } = await context.supabase
        .from("messages")
        .select("id")
        .eq("id", data.reply_to_id)
        .eq("offer_id", data.offer_id)
        .maybeSingle();
      if (replyError) throw new Error(replyError.message);
      if (!repliedTo) throw new Error("The message you are replying to is unavailable.");
    }
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({
        offer_id: data.offer_id,
        sender_id: context.userId,
        body: data.body,
        attachment_urls: data.attachment_urls,
        reply_to_id: data.reply_to_id ?? null,
      } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const recipientId = offer.from_user === context.userId ? offer.to_user : offer.from_user;
    if (recipientId) {
      const preview = data.body.trim() || "Sent an attachment";
      await notifyUser({
        userId: recipientId,
        type: "message_received",
        title: "New message",
        body: preview.length > 120 ? `${preview.slice(0, 117)}...` : preview,
        link: `/offers/${data.offer_id}`,
      });
    }

    return (await attachReplyPreviews(context, [row]))[0];
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

export const editMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        message_id: z.string().uuid(),
        body: z.string().min(1, "Message cannot be empty").max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: msg, error: fetchErr } = await context.supabase
      .from("messages")
      .select("id, sender_id, offer_id, body")
      .eq("id", data.message_id)
      .single();

    if (fetchErr || !msg) throw new Error("Message not found");
    if (msg.sender_id !== context.userId) {
      throw new Error("You can only edit your own messages");
    }

    const trimmed = data.body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const verdict = moderate(trimmed, "chat");
    if (verdict.flagged) {
      throw new Error(
        `Message blocked: ${verdict.reason} Prohibited: ${verdict.terms.join(", ")}`,
      );
    }

    const now = new Date().toISOString();

    // Try updating with native edited_at column
    const { data: updated, error: updateErr } = await context.supabase
      .from("messages")
      .update({
        body: trimmed,
        edited_at: now,
      } as any)
      .eq("id", data.message_id)
      .select("*, sender:profiles!messages_sender_profile_fkey(*)")
      .single();

    if (!updateErr && updated) {
      return parseMessageMeta(updated);
    }

    // Fallback: update body and persist edited_at inside attachment_urls metadata
    const { data: currentMsg } = await context.supabase
      .from("messages")
      .select("attachment_urls")
      .eq("id", data.message_id)
      .single();

    const nextAttachments = encodeMessageMeta(currentMsg?.attachment_urls ?? [], { edited_at: now });

    let fallbackUpdated: any = null;
    const { data: upd1, error: fallbackErr } = await context.supabase
      .from("messages")
      .update({
        body: trimmed,
        attachment_urls: nextAttachments,
      } as any)
      .eq("id", data.message_id)
      .select("*, sender:profiles!messages_sender_profile_fkey(*)")
      .single();

    if (fallbackErr) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminUpd, error: adminErr } = await supabaseAdmin
        .from("messages")
        .update({
          body: trimmed,
          attachment_urls: nextAttachments,
        } as any)
        .eq("id", data.message_id)
        .select("*, sender:profiles!messages_sender_profile_fkey(*)")
        .single();
      if (adminErr) throw new Error(adminErr.message);
      fallbackUpdated = adminUpd;
    } else {
      fallbackUpdated = upd1;
    }

    return parseMessageMeta({ ...fallbackUpdated, edited_at: now });
  });

export const reactToMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        message_id: z.string().uuid(),
        emoji: z.string().min(1).max(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // 1. Fetch message (with fallback if reactions column is not yet present)
    let rawMsg: { id: string; offer_id: string; attachment_urls?: string[]; reactions?: any } | null = null;
    let hasNativeReactionsCol = true;

    const { data: withReactions, error: fetchErr } = await context.supabase
      .from("messages")
      .select("id, offer_id, reactions, attachment_urls")
      .eq("id", data.message_id)
      .maybeSingle();

    if (fetchErr || !withReactions) {
      hasNativeReactionsCol = false;
      const { data: basicMsg, error: basicErr } = await context.supabase
        .from("messages")
        .select("id, offer_id, attachment_urls")
        .eq("id", data.message_id)
        .single();

      if (basicErr || !basicMsg) {
        throw new Error("Message not found");
      }
      rawMsg = basicMsg;
    } else {
      rawMsg = withReactions;
    }

    // 2. Verify participant in offer
    const { data: offer, error: offerErr } = await context.supabase
      .from("offers")
      .select("from_user, to_user")
      .eq("id", rawMsg.offer_id)
      .single();

    if (offerErr || !offer) throw new Error("Offer not found");
    if (offer.from_user !== context.userId && offer.to_user !== context.userId) {
      throw new Error("You are not a participant in this conversation");
    }

    // 3. Compute new reactions mapping: Record<string, string[]>
    const parsedMsg = parseMessageMeta(rawMsg);
    const currentReactions: Record<string, string[]> = { ...(parsedMsg.reactions || {}) };

    const userId = context.userId;
    const emoji = data.emoji.trim();
    const alreadyReactedWithThis = currentReactions[emoji]?.includes(userId);

    // Remove user from all emojis on this message (WhatsApp style: 1 active reaction per user)
    for (const key of Object.keys(currentReactions)) {
      currentReactions[key] = (currentReactions[key] || []).filter((id) => id !== userId);
      if (currentReactions[key].length === 0) {
        delete currentReactions[key];
      }
    }

    // If they hadn't reacted with this emoji yet, add it
    if (!alreadyReactedWithThis) {
      if (!currentReactions[emoji]) {
        currentReactions[emoji] = [];
      }
      currentReactions[emoji].push(userId);
    }

    // 4. Update in database
    if (hasNativeReactionsCol) {
      const { error: updateErr } = await context.supabase
        .from("messages")
        .update({ reactions: currentReactions } as any)
        .eq("id", data.message_id);

      if (!updateErr) {
        return {
          message_id: data.message_id,
          reactions: currentReactions,
        };
      }
      console.warn("Native reactions column update failed, persisting via attachment_urls metadata:", updateErr.message);
    }

    // Persist via encoded attachment_urls metadata
    const nextAttachments = encodeMessageMeta(rawMsg.attachment_urls ?? [], { reactions: currentReactions });
    const { error: attErr } = await context.supabase
      .from("messages")
      .update({ attachment_urls: nextAttachments })
      .eq("id", data.message_id);

    if (attErr) {
      // Fallback to service role if user RLS restricted update
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: adminErr } = await supabaseAdmin
        .from("messages")
        .update({ attachment_urls: nextAttachments })
        .eq("id", data.message_id);
      if (adminErr) {
        throw new Error(adminErr.message);
      }
    }

    return {
      message_id: data.message_id,
      reactions: currentReactions,
    };
  });
