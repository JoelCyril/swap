import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUser } from "./notifications.server";

export const createOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        listing_id: z.string().uuid(),
        offered_item_ids: z.array(z.string().uuid()).min(1).max(6),
        message: z.string().max(1000).default(""),
      })
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
    const { data: row, error } = await context.supabase
      .from("offers")
      .insert({
        listing_id: data.listing_id,
        from_user: context.userId,
        to_user: listing.owner_id,
        offered_item_ids: data.offered_item_ids,
        message: data.message,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await notifyUser({
  userId: listing.owner_id,
  type: "offer_received",
  title: "A new swap offer awaits you on SWAP",
  body: `You've got a swap offer for your listed item: "${listing.title}". Another SWAP member is interested in trading.`,
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
    return { viewer_id: context.userId, offers: data ?? [] };
  });

export const getOffer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: offer, error } = await context.supabase
      .from("offers")
      .select(
        "*, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*)), from_profile:profiles!offers_from_profile_fkey(*), to_profile:profiles!offers_to_profile_fkey(*)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!offer) return null;

    const fetchItems = async (ids: string[]): Promise<any[]> => {
      if (!ids.length) return [];
      const { data: rows, error } = await context.supabase
        .from("items")
        .select("id, owner_id, name, category, condition, image_emoji, image_urls, description, visibility, status")
        .in("id", ids);
      if (error) throw new Error(error.message);
      if ((rows ?? []).length === ids.length) return rows as any[];

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminRows, error: adminError } = await supabaseAdmin
        .from("items")
        .select("id, owner_id, name, category, condition, image_emoji, image_urls, description, visibility, status")
        .in("id", ids);
      if (adminError) throw new Error(adminError.message);
      if (adminRows) return adminRows as any[];

      return (rows ?? []) as any[];
    };

    const o = offer as unknown as Record<string, unknown>;
    const [items, removedItems, recipientItems, removedRecipientItems] = await Promise.all([
      fetchItems((o["offered_item_ids"] ?? []) as string[]),
      fetchItems((o["removed_item_ids"] ?? []) as string[]),
      fetchItems((o["recipient_item_ids"] ?? []) as string[]),
      fetchItems((o["removed_recipient_item_ids"] ?? []) as string[]),
    ]);
    return {
      ...offer,
      items,
      removed_items: removedItems,
      recipient_items: recipientItems,
      removed_recipient_items: removedRecipientItems,
      viewer_id: context.userId,
    };
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
