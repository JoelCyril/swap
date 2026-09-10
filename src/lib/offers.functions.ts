import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUser } from "./notifications.server";
import { repairImageUrl, repairImageUrls } from "./image-url-repair.server";

/** Helper to extract cash amount from offer row (either cash_amount column or [CASH:150] metadata tag in message) */
export function extractOfferCash(offer: { cash_amount?: number | null; message?: string | null } | null | undefined): number | null {
  if (!offer) return null;
  if (typeof (offer as any).cash_amount === "number" && !isNaN((offer as any).cash_amount) && (offer as any).cash_amount > 0) {
    return Number((offer as any).cash_amount);
  }
  if (offer.message && typeof offer.message === "string") {
    const match = offer.message.match(/\[CASH:([0-9]+(?:\.[0-9]+)?)\]/);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

/** Helper to clean user visible message by stripping metadata tags like [CASH:...] and [TRADED_ITEMS:...] */
export function cleanOfferMessage(message: string | null | undefined): string {
  if (!message) return "";
  return message
    .replace(/\[CASH:[0-9]+(?:\.[0-9]+)?\]\s*/g, "")
    .replace(/\[TRADED_ITEMS:[\s\S]*?\]\s*/g, "")
    .trim();
}

/** Helper to extract traded items snapshot stored when a swap was completed */
export function extractTradedItemsSnapshot(message: string | null | undefined): any[] {
  if (!message || typeof message !== "string") return [];
  const match = message.match(/\[TRADED_ITEMS:([\s\S]*?)\](?:\s|$)/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * When a trade completes, snapshots all traded items into the offer record
 * and removes them from both users' inventory, marking any associated listings as completed.
 */
export async function removeTradedItemsFromInventory(offerId: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch the offer and its listing
    const { data: offer } = await supabaseAdmin
      .from("offers")
      .select("*, listing:listings(*)")
      .eq("id", offerId)
      .maybeSingle();
    if (!offer) return;

    // 2. Identify all items in the trade from both users
    const senderItemIds = ((offer.offered_item_ids || []) as string[]).filter(
      (id: string) => !((offer.removed_item_ids || []) as string[]).includes(id),
    );
    const recipientExtraIds = ((offer.recipient_item_ids || []) as string[]).filter(
      (id: string) => !((offer.removed_recipient_item_ids || []) as string[]).includes(id),
    );
    const listingItemId = !offer.listing_removed && (offer as any).listing?.item_id
      ? ((offer as any).listing.item_id as string)
      : null;

    const allTradedItemIds = Array.from(
      new Set([...senderItemIds, ...(listingItemId ? [listingItemId] : []), ...recipientExtraIds]),
    ).filter(Boolean);

    if (allTradedItemIds.length === 0) return;

    // 3. Fetch item records to preserve snapshot in offer.message
    const { data: items } = await supabaseAdmin
      .from("items")
      .select("id, owner_id, name, category, condition, image_emoji, image_urls, description, visibility")
      .in("id", allTradedItemIds);

    if (items && items.length > 0) {
      const existingSnapshot = extractTradedItemsSnapshot(offer.message);
      const combined = Array.from(
        new Map([...existingSnapshot, ...items].map((it) => [it.id, it])).values(),
      );
      const cleanMsg = cleanOfferMessage(offer.message);
      const cash = extractOfferCash(offer as any);
      let newMsg = cleanMsg;
      if (cash != null) {
        newMsg = `[CASH:${cash}] ${newMsg}`.trim();
      }
      newMsg = `${newMsg} [TRADED_ITEMS:${JSON.stringify(combined)}]`.trim();

      await supabaseAdmin
        .from("offers")
        .update({ message: newMsg })
        .eq("id", offer.id);
    }

    // 4. Mark associated listings as completed and unlink item_id
    await supabaseAdmin
      .from("listings")
      .update({ status: "completed" as const, item_id: null })
      .in("item_id", allTradedItemIds);

    // 5. Delete the traded items from items table so they are removed from both users' inventories
    const { error: delErr } = await supabaseAdmin
      .from("items")
      .delete()
      .in("id", allTradedItemIds);

    if (delErr) {
      console.error("Failed to delete traded items from inventory:", delErr);
    }
  } catch (err) {
    console.error("Error in removeTradedItemsFromInventory:", err);
  }
}

export const createOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        listing_id: z.string().uuid(),
        offered_item_ids: z.array(z.string().uuid()).max(6).default([]),
        cash_amount: z.number().nonnegative().max(100000).nullable().optional(),
        message: z.string().max(1000).default(""),
      })
      .refine(
        (data) => (data.offered_item_ids && data.offered_item_ids.length > 0) || (data.cash_amount != null && data.cash_amount > 0),
        { message: "Please pick at least one item or offer a cash amount." },
      )
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: listing, error: lerr } = await context.supabase
      .from("listings")
      .select("id, owner_id, status, title")
      .eq("id", data.listing_id)
      .maybeSingle();
    if (lerr || !listing) throw new Error("Listing not found");
    if (listing.owner_id === context.userId) throw new Error("Cannot offer on your own listing");
    if (listing.status !== "active") throw new Error("Listing is not active");

    const cash = data.cash_amount && data.cash_amount > 0 ? Number(data.cash_amount) : null;
    let finalMessage = (data.message || "").trim();
    if (cash != null && !finalMessage.includes(`[CASH:`)) {
      finalMessage = `[CASH:${cash}] ${finalMessage}`.trim();
    }

    const payload: Record<string, any> = {
      listing_id: data.listing_id,
      from_user: context.userId,
      to_user: listing.owner_id,
      offered_item_ids: data.offered_item_ids || [],
      message: finalMessage,
    };
    if (cash != null) {
      payload.cash_amount = cash;
    }

    let insertRes = await context.supabase.from("offers").insert(payload as any).select().single();
    if (insertRes.error && insertRes.error.message.includes("cash_amount")) {
      delete payload.cash_amount;
      insertRes = await context.supabase.from("offers").insert(payload as any).select().single();
    }
    if (insertRes.error) throw new Error(insertRes.error.message);
    const row = insertRes.data;

    const cashStr = cash ? `${cash} AED` : null;
    const itemsCount = (data.offered_item_ids || []).length;
    const offerSummary = cashStr && itemsCount > 0
      ? `${cashStr} + ${itemsCount} item${itemsCount > 1 ? "s" : ""}`
      : cashStr
        ? `${cashStr} cash`
        : `${itemsCount} item${itemsCount > 1 ? "s" : ""}`;

    await notifyUser({
      userId: listing.owner_id,
      type: "offer_received",
      title: "A new swap offer awaits you on SWAP",
      body: `You received an offer (${offerSummary}) for "${listing.title}". Another SWAP member is interested in trading.`,
      link: `/offers/${row.id}`,
    });
    return row;
  });

export const listMyOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("offers")
      .select(`
  id,
  listing_id,
  from_user,
  to_user,
  offered_item_ids,
  recipient_item_ids,
  removed_item_ids,
  removed_recipient_item_ids,
  complete_confirmed_by,
  received_confirmed_by,
  listing_removed,
  turn_user,
  status,
  message,
  created_at,
  updated_at,
  listing:listings(
    id,
    owner_id,
    title,
    description,
    category,
    condition,
    image_urls,
    image_emoji,
    status,
    owner:profiles!listings_owner_profile_fkey(
      id,
      username,
      display_name,
      avatar_color,
      avatar_url
    )
  ),
  from_profile:profiles!offers_from_profile_fkey(
    id,
    username,
    display_name,
    avatar_color,
    avatar_url
  ),
  to_profile:profiles!offers_to_profile_fkey(
    id,
    username,
    display_name,
    avatar_color,
    avatar_url
  )
`)
      .or(`from_user.eq.${context.userId},to_user.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const repairedOffers = await Promise.all(
      (data ?? []).map(async (off: any) => ({
        ...off,
        cash_amount: extractOfferCash(off),
        message: cleanOfferMessage(off.message),
        listing: off.listing
          ? {
              ...off.listing,
              image_urls: await repairImageUrls(off.listing.image_urls),
              owner: off.listing.owner
                ? {
                    ...off.listing.owner,
                    avatar_url: await repairImageUrl(off.listing.owner.avatar_url, "avatars"),
                  }
                : off.listing.owner,
            }
          : off.listing,
        from_profile: off.from_profile
          ? {
              ...off.from_profile,
              avatar_url: await repairImageUrl(off.from_profile.avatar_url, "avatars"),
            }
          : off.from_profile,
        to_profile: off.to_profile
          ? {
              ...off.to_profile,
              avatar_url: await repairImageUrl(off.to_profile.avatar_url, "avatars"),
            }
          : off.to_profile,
      })),
    );
    return { viewer_id: context.userId, offers: repairedOffers };
  });

export const listMyPendingIncomingOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("offers")
      .select(`
        id,
        listing_id,
        from_user,
        to_user,
        status,
        message,
        created_at,
        listing:listings(
          id,
          title,
          image_urls,
          image_emoji
        ),
        from_profile:profiles!offers_from_profile_fkey(
          id,
          username,
          display_name,
          avatar_color,
          avatar_url
        )
      `)
      .eq("to_user", context.userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to list pending incoming offers", error);
      return [];
    }
    const repaired = await Promise.all(
      (data ?? []).map(async (row: any) => ({
        ...row,
        listing: row.listing
          ? {
              ...row.listing,
              image_urls: await repairImageUrls(row.listing.image_urls),
            }
          : row.listing,
        from_profile: row.from_profile
          ? {
              ...row.from_profile,
              avatar_url: await repairImageUrl(row.from_profile.avatar_url, "avatars"),
            }
          : row.from_profile,
      })),
    );
    return repaired as any[];
  });

export const getOffer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    let { data: offer, error } = await context.supabase
      .from("offers")
      .select(
        "*, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*)), from_profile:profiles!offers_from_profile_fkey(*), to_profile:profiles!offers_to_profile_fkey(*)",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (!offer) {
      // Check if user is an admin viewing trade details
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("roles")
        .eq("id", context.userId)
        .maybeSingle();

      if (profile?.roles?.includes("admin")) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminOffer, error: adminErr } = await supabaseAdmin
          .from("offers")
          .select(
            "*, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*)), from_profile:profiles!offers_from_profile_fkey(*), to_profile:profiles!offers_to_profile_fkey(*)",
          )
          .eq("id", data.id)
          .maybeSingle();
        if (adminErr) throw new Error(adminErr.message);
        offer = adminOffer;
      }
    }

    if (error && !offer) throw new Error(error.message);
    if (!offer) return null;

    const snapshotItems = extractTradedItemsSnapshot(offer.message);
    const snapshotMap = new Map(snapshotItems.map((it: any) => [it.id, it]));

    const fetchItems = async (ids: string[]): Promise<any[]> => {
      if (!ids.length) return [];
      const { data: rows, error } = await context.supabase
        .from("items")
        .select("id, owner_id, name, category, condition, image_emoji, image_urls, description, visibility")
        .in("id", ids);
      if (error) throw new Error(error.message);
      let list = rows ?? [];
      if (list.length !== ids.length) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: adminRows } = await supabaseAdmin
          .from("items")
          .select("id, owner_id, name, category, condition, image_emoji, image_urls, description, visibility")
          .in("id", ids);
        if (adminRows) list = adminRows;
      }

      // If any items are missing (e.g. removed from inventory on completion), restore from snapshot
      const foundIds = new Set(list.map((it) => it.id));
      for (const id of ids) {
        if (!foundIds.has(id) && snapshotMap.has(id)) {
          list.push(snapshotMap.get(id));
        }
      }

      return await Promise.all(
        list.map(async (it) => ({
          ...it,
          image_urls: await repairImageUrls(it.image_urls),
        })),
      );
    };

    const o = offer as unknown as Record<string, unknown>;
    const [items, removedItems, recipientItems, removedRecipientItems] = await Promise.all([
      fetchItems((o["offered_item_ids"] ?? []) as string[]),
      fetchItems((o["removed_item_ids"] ?? []) as string[]),
      fetchItems((o["recipient_item_ids"] ?? []) as string[]),
      fetchItems((o["removed_recipient_item_ids"] ?? []) as string[]),
    ]);

    const repairedListing = (offer as any).listing
      ? {
          ...(offer as any).listing,
          image_urls: await repairImageUrls((offer as any).listing.image_urls),
          owner: (offer as any).listing.owner
            ? {
                ...(offer as any).listing.owner,
                avatar_url: await repairImageUrl((offer as any).listing.owner.avatar_url, "avatars"),
              }
            : (offer as any).listing.owner,
        }
      : (offer as any).listing;

    const repairedFromProfile = (offer as any).from_profile
      ? {
          ...(offer as any).from_profile,
          avatar_url: await repairImageUrl((offer as any).from_profile.avatar_url, "avatars"),
        }
      : (offer as any).from_profile;

    const repairedToProfile = (offer as any).to_profile
      ? {
          ...(offer as any).to_profile,
          avatar_url: await repairImageUrl((offer as any).to_profile.avatar_url, "avatars"),
        }
      : (offer as any).to_profile;

    const isParticipant = context.userId === (offer as any).from_user || context.userId === (offer as any).to_user;
    const cashAmount = extractOfferCash(offer as any);
    const cleanedMessage = isParticipant ? cleanOfferMessage((offer as any).message) : "";

    return {
      ...offer,
      cash_amount: cashAmount,
      message: cleanedMessage,
      listing: repairedListing,
      from_profile: repairedFromProfile,
      to_profile: repairedToProfile,
      items,
      removed_items: removedItems,
      recipient_items: recipientItems,
      removed_recipient_items: removedRecipientItems,
      viewer_id: context.userId,
    };
  });

/** Either party can propose or negotiate a cash amount for the offer. */
export const updateOfferCash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        cash_amount: z.number().nonnegative().max(100000).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isFrom && !isTo) throw new Error("Not a participant");
    if (offer.status !== "pending" && offer.status !== "accepted") {
      throw new Error("Cannot negotiate on a completed or closed trade");
    }

    const nextCash = data.cash_amount != null && data.cash_amount > 0 ? Number(data.cash_amount) : null;
    const prevCash = extractOfferCash(offer as any);

    // Update message tag as fallback
    const cleanMsg = cleanOfferMessage(offer.message);
    const finalMsg = nextCash != null ? `[CASH:${nextCash}] ${cleanMsg}`.trim() : cleanMsg;

    const updatePayload: Record<string, any> = {
      message: finalMsg,
      items_ok_from: false,
      items_ok_to: false,
      turn_user: null,
      updated_at: new Date().toISOString(),
    };
    if (nextCash !== undefined) {
      updatePayload.cash_amount = nextCash;
    }

    let up = await context.supabase.from("offers").update(updatePayload as any).eq("id", data.id);
    if (up.error && up.error.message.includes("cash_amount")) {
      delete updatePayload.cash_amount;
      up = await context.supabase.from("offers").update(updatePayload as any).eq("id", data.id);
    }
    if (up.error) throw new Error(up.error.message);

    // Insert system notification message in chat
    const cashNotice = nextCash != null
      ? (prevCash != null
          ? `💰 Cash offer adjusted from ${prevCash} AED to ${nextCash} AED.`
          : `💰 Cash offer added: ${nextCash} AED.`)
      : `💰 Cash offer removed.`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      await supabaseAdmin.from("messages").insert({
        offer_id: data.id,
        sender_id: context.userId,
        body: cashNotice,
        attachment_urls: [],
      });
    } catch (e) {
      console.warn("Could not insert cash negotiation chat notice:", e);
    }

    // Notify the other party
    const other = isFrom ? offer.to_user : offer.from_user;
    await notifyUser({
      userId: other,
      type: "offer_revised",
      title: "Cash terms updated",
      body: cashNotice,
      link: `/offers/${data.id}`,
    });

    return { ok: true, cash_amount: nextCash };
  });

/** Either party freely edits the items on their OWN side. No turn-taking. */
export const reviseOfferItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        offered_item_ids: z.array(z.string().uuid()).max(6),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isFrom && !isTo) throw new Error("Not a participant");
    if (offer.status !== "accepted") throw new Error("Trade is not open for changes");

    const o = offer as unknown as Record<string, unknown>;
    const currentKey = isFrom ? "offered_item_ids" : "recipient_item_ids";
    const removedKey = isFrom ? "removed_item_ids" : "removed_recipient_item_ids";


    const prev = ((o[currentKey] ?? []) as string[]);
    const removed = Array.from(
      new Set([
        ...(((o[removedKey] ?? []) as string[]).filter((i) => !data.offered_item_ids.includes(i))),
        ...prev.filter((i) => !data.offered_item_ids.includes(i)),
      ]),
    );
    const other = isFrom ? offer.to_user : offer.from_user;

    const { error } = await context.supabase
      .from("offers")
      .update({
        [currentKey]: data.offered_item_ids,
        [removedKey]: removed,
        items_ok_from: false,
        items_ok_to: false,
        turn_user: null,
      } as any)
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    await notifyUser({
      userId: other,
      type: "offer_revised",
      title: "Offer updated",
      body: "The other side updated the trade items.",
      link: `/offers/${data.id}`,
    });
    return { ok: true };
  });

/** Mark the current item set as agreed by the caller; both = scheduling unlocks. */
export const approveOfferItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isFrom && !isTo) throw new Error("Not a participant");

    const okFrom = isFrom ? true : offer.items_ok_from;
    const okTo = isTo ? true : offer.items_ok_to;
    const other = isFrom ? offer.to_user : offer.from_user;
    const { error } = await context.supabase
      .from("offers")
      .update({ items_ok_from: okFrom, items_ok_to: okTo })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await notifyUser({
      userId: other,
      type: "items_agreed",
      title: okFrom && okTo ? "Items locked in — time to schedule" : "Items accepted",
      body: okFrom && okTo ? "Both sides agreed. Propose a meetup." : "The other side accepted the items.",
      link: `/offers/${data.id}`,
    });
    return { ok: true, both: okFrom && okTo };
  });



export const respondToOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["accept", "decline", "waitlist", "withdraw", "complete"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*, listing:listings(title)")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isTo = offer.to_user === context.userId;
    const isFrom = offer.from_user === context.userId;
    let nextStatus = offer.status;
    if (data.action === "accept") {
      if (!isTo) throw new Error("Only the recipient can accept");
      nextStatus = "accepted";
    } else if (data.action === "decline") {
      if (!isTo) throw new Error("Only the recipient can decline");
      if (offer.status === "completed") throw new Error("This swap is already completed");
      nextStatus = "declined";
    } else if (data.action === "waitlist") {
      if (!isTo) throw new Error("Only the recipient can waitlist");
      nextStatus = "waitlisted" as typeof nextStatus;
    } else if (data.action === "withdraw") {
      if (!isFrom) throw new Error("Only the sender can withdraw");
      if (offer.status !== "pending" && offer.status !== "accepted" && offer.status !== "waitlisted") {
        throw new Error("This offer can no longer be withdrawn");
      }
      nextStatus = "withdrawn";
    } else if (data.action === "complete") {
      if (!isFrom && !isTo) throw new Error("Not a participant");
      nextStatus = "completed";
    }
    const { error } = await context.supabase
      .from("offers")
      .update({ status: nextStatus })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (nextStatus === "accepted") {
      // Chat is now open; the sender acts next.
      await context.supabase
        .from("offers")
        .update({ turn_user: offer.from_user })
        .eq("id", data.id);

    } else if (nextStatus === "completed") {
      await context.supabase.from("listings").update({ status: "completed" }).eq("id", offer.listing_id);
      await removeTradedItemsFromInventory(data.id);
    }

    // Notify the offer-maker of outcome (except withdraw = sender's action)
    if (data.action !== "withdraw") {
      const target = offer.from_user;
      const listingTitle = (offer.listing as { title: string } | null)?.title ?? "your offer";
      const outcomeTitle =
        nextStatus === "accepted"
          ? "Offer accepted"
          : nextStatus === "declined"
            ? "Offer declined"
            : nextStatus === "waitlisted"
              ? "Offer waitlisted"
              : nextStatus === "completed"
                ? "Swap completed"
                : "Offer updated";
      await notifyUser({
        userId: target,
        type: `offer_${nextStatus}`,
        title: outcomeTitle,
        body: `Regarding: ${listingTitle}`,
        link: `/offers/${offer.id}`,
      });
    }
    if (data.action === "withdraw") {
      await notifyUser({
        userId: offer.to_user,
        type: "offer_withdrawn",
        title: "Offer withdrawn",
        body: `The sender withdrew their offer.`,
        link: `/offers/${offer.id}`,
      });
    }
    return { ok: true, status: nextStatus };
  });

/** Stage 1: both sides must confirm before the trade is marked completed. */
export const confirmTradeCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isFrom && !isTo) throw new Error("Not a participant");
    if (offer.status !== "accepted" && offer.status !== "completed")
      throw new Error("Trade is not active");

    const o = offer as unknown as Record<string, unknown>;
    const current = ((o["complete_confirmed_by"] ?? []) as string[]).filter(Boolean);
    const next = Array.from(new Set([...current, context.userId]));
    const both = next.includes(offer.from_user) && next.includes(offer.to_user);

    const { error } = await context.supabase
      .from("offers")
      .update({ complete_confirmed_by: next, ...(both ? { status: "completed" as const } : {}) } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (both) {
      await context.supabase.from("listings").update({ status: "completed" }).eq("id", offer.listing_id);
      await removeTradedItemsFromInventory(data.id);
    }

    const other = isFrom ? offer.to_user : offer.from_user;
    await notifyUser({
      userId: other,
      type: both ? "trade_completed" : "complete_requested",
      title: both ? "Trade marked completed" : "Completion confirmation needed",
      body: both
        ? "Now confirm you received the items."
        : "The other side marked the trade completed — confirm to continue.",
      link: `/offers/${data.id}`,
    });
    return { ok: true, both };
  });

/** Stage 2: after completion, each side confirms they received the items. */
export const confirmItemsReceived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isFrom && !isTo) throw new Error("Not a participant");
    if (offer.status !== "completed") throw new Error("Trade is not completed yet");

    const o = offer as unknown as Record<string, unknown>;
    const current = ((o["received_confirmed_by"] ?? []) as string[]).filter(Boolean);
    const next = Array.from(new Set([...current, context.userId]));
    const both = next.includes(offer.from_user) && next.includes(offer.to_user);

    const { error } = await context.supabase
      .from("offers")
      .update({ received_confirmed_by: next } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (both) {
      await removeTradedItemsFromInventory(data.id);
    }

    const other = isFrom ? offer.to_user : offer.from_user;
    await notifyUser({
      userId: other,
      type: both ? "trade_finalised" : "receipt_confirmed",
      title: both ? "Swap complete" : "Receipt confirmed",
      body: both ? "Both sides confirmed receiving the items." : "Confirm you received the items too.",
      link: `/offers/${data.id}`,
    });
    return { ok: true, both };
  });

/** Toggle whether the originally listed item is part of the trade. */
export const toggleListingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), removed: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isTo) throw new Error("Only the listing owner can change the listed item");
    if (offer.status !== "accepted") throw new Error("Trade is not open for changes");
    const { error } = await context.supabase
      .from("offers")
      .update({ listing_removed: data.removed } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await notifyUser({
      userId: isFrom ? offer.to_user : offer.from_user,
      type: "offer_revised",
      title: "Trade items changed",
      body: data.removed
        ? "The listed item was removed from the trade."
        : "The listed item was added back to the trade.",
      link: `/offers/${data.id}`,
    });
    return { ok: true };
  });

/** When items were not received: cancels the offer, returns listing to main feed (active), and optionally files a complaint to admins. */
export const reportItemsNotReceived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        complaint: z.string().max(2000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: offer, error: gerr } = await context.supabase
      .from("offers")
      .select("*, listing:listings(id, title)")
      .eq("id", data.id)
      .maybeSingle();
    if (gerr || !offer) throw new Error("Offer not found");
    const isFrom = offer.from_user === context.userId;
    const isTo = offer.to_user === context.userId;
    if (!isFrom && !isTo) throw new Error("Not a participant");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Mark offer as declined / cancelled
    const { error: offErr } = await supabaseAdmin
      .from("offers")
      .update({ status: "declined" } as any)
      .eq("id", data.id);
    if (offErr) throw new Error(offErr.message);

    // 2. Return the listing to the main listings page (status = 'active')
    if (offer.listing_id) {
      await supabaseAdmin
        .from("listings")
        .update({ status: "active" })
        .eq("id", offer.listing_id);
    }

    const otherUser = isFrom ? offer.to_user : offer.from_user;

    // 3. If a complaint is provided, file a report with the admin moderation team
    if (data.complaint && data.complaint.trim().length > 0) {
      try {
        await supabaseAdmin.from("inquiries").insert({
          user_id: context.userId,
          name: "Trade Member Report",
          email: "support@swapuae.com",
          subject: `Malpractice Report on Swap #${data.id.slice(0, 8)}`,
          message: `Reporter ID: ${context.userId}\nReported User ID: ${otherUser}\nOffer ID: ${data.id}\nListing ID: ${offer.listing_id}\n\nComplaint:\n${data.complaint.trim()}`,
        } as any);
      } catch (e) {
        console.warn("Failed to record inquiry report:", e);
      }
    }

    // 4. Notify other party
    await notifyUser({
      userId: otherUser,
      type: "trade_cancelled",
      title: "Trade cancelled: Items not received",
      body: "The swap deal was marked as items not received. The listing has been returned to the public feed.",
      link: `/offers/${data.id}`,
    });

    return { ok: true, message: "Trade cancelled and listing returned to public browse feed." };
  });
