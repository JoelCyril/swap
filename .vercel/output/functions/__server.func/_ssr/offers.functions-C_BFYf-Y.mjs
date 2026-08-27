import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { n as booleanType, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { notifyUser } from "./notifications.server-CwIB500t.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers.functions-C_BFYf-Y.js
var createOffer_createServerFn_handler = createServerRpc({
	id: "9497b3018ae07b97743d6588f7944955abc937e50ba1a0ce8af94a1c855c5f8b",
	name: "createOffer",
	filename: "src/lib/offers.functions.ts"
}, (opts) => createOffer.__executeServer(opts));
var createOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	listing_id: stringType().uuid(),
	offered_item_ids: arrayType(stringType().uuid()).min(1).max(6),
	message: stringType().max(1e3).default("")
}).parse(d)).handler(createOffer_createServerFn_handler, async ({ data, context }) => {
	const { data: listing, error: lerr } = await context.supabase.from("listings").select("id, owner_id, status, title").eq("id", data.listing_id).maybeSingle();
	if (lerr || !listing) throw new Error("Listing not found");
	if (listing.owner_id === context.userId) throw new Error("Cannot offer on your own listing");
	if (listing.status !== "active") throw new Error("Listing is not active");
	const { data: row, error } = await context.supabase.from("offers").insert({
		listing_id: data.listing_id,
		from_user: context.userId,
		to_user: listing.owner_id,
		offered_item_ids: data.offered_item_ids,
		message: data.message
	}).select().single();
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: listing.owner_id,
		type: "offer_received",
		title: "New offer received",
		body: `Someone wants to swap for "${listing.title}"`,
		link: `/offers/${row.id}`
	});
	return row;
});
var listMyOffers_createServerFn_handler = createServerRpc({
	id: "d522cd210393069b72a64cb1968ff8722e85c1c2944d249e7a9547d7b40fec03",
	name: "listMyOffers",
	filename: "src/lib/offers.functions.ts"
}, (opts) => listMyOffers.__executeServer(opts));
var listMyOffers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyOffers_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("offers").select("*, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*)), from_profile:profiles!offers_from_profile_fkey(*), to_profile:profiles!offers_to_profile_fkey(*)").or(`from_user.eq.${context.userId},to_user.eq.${context.userId}`).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return {
		viewer_id: context.userId,
		offers: data ?? []
	};
});
var getOffer_createServerFn_handler = createServerRpc({
	id: "c56f1f06093187a6f47c9227d81ab0b41f9bee1107941be9c7c7601fa72af17d",
	name: "getOffer",
	filename: "src/lib/offers.functions.ts"
}, (opts) => getOffer.__executeServer(opts));
var getOffer = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getOffer_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error } = await context.supabase.from("offers").select("*, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*)), from_profile:profiles!offers_from_profile_fkey(*), to_profile:profiles!offers_to_profile_fkey(*)").eq("id", data.id).maybeSingle();
	if (error) throw new Error(error.message);
	if (!offer) return null;
	const fetchItems = async (ids) => {
		if (!ids.length) return [];
		const { data: rows } = await context.supabase.from("items").select("*").in("id", ids);
		return rows ?? [];
	};
	const o = offer;
	const [items, removedItems, recipientItems, removedRecipientItems] = await Promise.all([
		fetchItems(o["offered_item_ids"] ?? []),
		fetchItems(o["removed_item_ids"] ?? []),
		fetchItems(o["recipient_item_ids"] ?? []),
		fetchItems(o["removed_recipient_item_ids"] ?? [])
	]);
	return {
		...offer,
		items,
		removed_items: removedItems,
		recipient_items: recipientItems,
		removed_recipient_items: removedRecipientItems,
		viewer_id: context.userId
	};
});
var reviseOfferItems_createServerFn_handler = createServerRpc({
	id: "0332a42156bc496a6c44d02bd35ae069e0b5871f446db557453ea550971fa667",
	name: "reviseOfferItems",
	filename: "src/lib/offers.functions.ts"
}, (opts) => reviseOfferItems.__executeServer(opts));
var reviseOfferItems = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	offered_item_ids: arrayType(stringType().uuid()).max(6)
}).parse(d)).handler(reviseOfferItems_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: gerr } = await context.supabase.from("offers").select("*").eq("id", data.id).maybeSingle();
	if (gerr || !offer) throw new Error("Offer not found");
	const isFrom = offer.from_user === context.userId;
	const isTo = offer.to_user === context.userId;
	if (!isFrom && !isTo) throw new Error("Not a participant");
	if (offer.status !== "accepted") throw new Error("Trade is not open for changes");
	const o = offer;
	const currentKey = isFrom ? "offered_item_ids" : "recipient_item_ids";
	const removedKey = isFrom ? "removed_item_ids" : "removed_recipient_item_ids";
	const prev = o[currentKey] ?? [];
	const removed = Array.from(/* @__PURE__ */ new Set([...(o[removedKey] ?? []).filter((i) => !data.offered_item_ids.includes(i)), ...prev.filter((i) => !data.offered_item_ids.includes(i))]));
	const other = isFrom ? offer.to_user : offer.from_user;
	const { error } = await context.supabase.from("offers").update({
		[currentKey]: data.offered_item_ids,
		[removedKey]: removed,
		items_ok_from: false,
		items_ok_to: false,
		turn_user: null
	}).eq("id", data.id);
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: other,
		type: "offer_revised",
		title: "Trade items changed",
		body: "The other side updated the items in the trade.",
		link: `/offers/${data.id}`
	});
	return { ok: true };
});
var approveOfferItems_createServerFn_handler = createServerRpc({
	id: "f9d9f7821b1deb0a1af140abe282a3abfa44a6100d48d0860e7d1d4d8332b600",
	name: "approveOfferItems",
	filename: "src/lib/offers.functions.ts"
}, (opts) => approveOfferItems.__executeServer(opts));
var approveOfferItems = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(approveOfferItems_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: gerr } = await context.supabase.from("offers").select("*").eq("id", data.id).maybeSingle();
	if (gerr || !offer) throw new Error("Offer not found");
	const isFrom = offer.from_user === context.userId;
	const isTo = offer.to_user === context.userId;
	if (!isFrom && !isTo) throw new Error("Not a participant");
	const okFrom = isFrom ? true : offer.items_ok_from;
	const okTo = isTo ? true : offer.items_ok_to;
	const other = isFrom ? offer.to_user : offer.from_user;
	const { error } = await context.supabase.from("offers").update({
		items_ok_from: okFrom,
		items_ok_to: okTo
	}).eq("id", data.id);
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: other,
		type: "items_agreed",
		title: okFrom && okTo ? "Items locked in — time to schedule" : "Items accepted",
		body: okFrom && okTo ? "Both sides agreed. Propose a meetup." : "The other side accepted the items.",
		link: `/offers/${data.id}`
	});
	return {
		ok: true,
		both: okFrom && okTo
	};
});
var respondToOffer_createServerFn_handler = createServerRpc({
	id: "1001ef192a9e4793aa11e821237aa19d0535b7386828a54ea9ba46d41fe3701b",
	name: "respondToOffer",
	filename: "src/lib/offers.functions.ts"
}, (opts) => respondToOffer.__executeServer(opts));
var respondToOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	action: enumType([
		"accept",
		"decline",
		"waitlist",
		"withdraw",
		"complete"
	])
}).parse(d)).handler(respondToOffer_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: gerr } = await context.supabase.from("offers").select("*, listing:listings(title)").eq("id", data.id).maybeSingle();
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
		nextStatus = "waitlisted";
	} else if (data.action === "withdraw") {
		if (!isFrom) throw new Error("Only the sender can withdraw");
		nextStatus = "withdrawn";
	} else if (data.action === "complete") {
		if (!isFrom && !isTo) throw new Error("Not a participant");
		nextStatus = "completed";
	}
	const { error } = await context.supabase.from("offers").update({ status: nextStatus }).eq("id", data.id);
	if (error) throw new Error(error.message);
	if (nextStatus === "accepted") {
		await context.supabase.from("listings").update({ status: "reserved" }).eq("id", offer.listing_id);
		await context.supabase.from("offers").update({ turn_user: offer.from_user }).eq("id", data.id);
	} else if (nextStatus === "completed") await context.supabase.from("listings").update({ status: "completed" }).eq("id", offer.listing_id);
	else if ((nextStatus === "declined" || nextStatus === "withdrawn") && offer.status === "accepted") await context.supabase.from("listings").update({ status: "active" }).eq("id", offer.listing_id);
	if (data.action !== "withdraw") {
		const target = offer.from_user;
		const listingTitle = offer.listing?.title ?? "your offer";
		const outcomeTitle = nextStatus === "accepted" ? "Offer accepted" : nextStatus === "declined" ? "Offer declined" : nextStatus === "waitlisted" ? "Offer waitlisted" : nextStatus === "completed" ? "Swap completed" : "Offer updated";
		await notifyUser({
			userId: target,
			type: `offer_${nextStatus}`,
			title: outcomeTitle,
			body: `Regarding: ${listingTitle}`,
			link: `/offers/${offer.id}`
		});
	}
	if (data.action === "withdraw") await notifyUser({
		userId: offer.to_user,
		type: "offer_withdrawn",
		title: "Offer withdrawn",
		body: `The sender withdrew their offer.`,
		link: `/offers/${offer.id}`
	});
	return {
		ok: true,
		status: nextStatus
	};
});
var confirmTradeCompletion_createServerFn_handler = createServerRpc({
	id: "9e7e7a7f626f4f8bc2a0af80b9824cac031194ab31e6c213c1a2540d88668b09",
	name: "confirmTradeCompletion",
	filename: "src/lib/offers.functions.ts"
}, (opts) => confirmTradeCompletion.__executeServer(opts));
var confirmTradeCompletion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(confirmTradeCompletion_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: gerr } = await context.supabase.from("offers").select("*").eq("id", data.id).maybeSingle();
	if (gerr || !offer) throw new Error("Offer not found");
	const isFrom = offer.from_user === context.userId;
	const isTo = offer.to_user === context.userId;
	if (!isFrom && !isTo) throw new Error("Not a participant");
	if (offer.status !== "accepted" && offer.status !== "completed") throw new Error("Trade is not active");
	const current = (offer["complete_confirmed_by"] ?? []).filter(Boolean);
	const next = Array.from(/* @__PURE__ */ new Set([...current, context.userId]));
	const both = next.includes(offer.from_user) && next.includes(offer.to_user);
	const { error } = await context.supabase.from("offers").update({
		complete_confirmed_by: next,
		...both ? { status: "completed" } : {}
	}).eq("id", data.id);
	if (error) throw new Error(error.message);
	if (both) await context.supabase.from("listings").update({ status: "completed" }).eq("id", offer.listing_id);
	await notifyUser({
		userId: isFrom ? offer.to_user : offer.from_user,
		type: both ? "trade_completed" : "complete_requested",
		title: both ? "Trade marked completed" : "Completion confirmation needed",
		body: both ? "Now confirm you received the items." : "The other side marked the trade completed — confirm to continue.",
		link: `/offers/${data.id}`
	});
	return {
		ok: true,
		both
	};
});
var confirmItemsReceived_createServerFn_handler = createServerRpc({
	id: "4d2898f4f8b044bc374c94f6bfbda4ad9ed8882ae8d92e44287717699c9fc647",
	name: "confirmItemsReceived",
	filename: "src/lib/offers.functions.ts"
}, (opts) => confirmItemsReceived.__executeServer(opts));
var confirmItemsReceived = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(confirmItemsReceived_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: gerr } = await context.supabase.from("offers").select("*").eq("id", data.id).maybeSingle();
	if (gerr || !offer) throw new Error("Offer not found");
	const isFrom = offer.from_user === context.userId;
	const isTo = offer.to_user === context.userId;
	if (!isFrom && !isTo) throw new Error("Not a participant");
	if (offer.status !== "completed") throw new Error("Trade is not completed yet");
	const current = (offer["received_confirmed_by"] ?? []).filter(Boolean);
	const next = Array.from(/* @__PURE__ */ new Set([...current, context.userId]));
	const both = next.includes(offer.from_user) && next.includes(offer.to_user);
	const { error } = await context.supabase.from("offers").update({ received_confirmed_by: next }).eq("id", data.id);
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: isFrom ? offer.to_user : offer.from_user,
		type: both ? "trade_finalised" : "receipt_confirmed",
		title: both ? "Swap complete 🎉" : "Receipt confirmed",
		body: both ? "Both sides confirmed receiving the items." : "Confirm you received the items too.",
		link: `/offers/${data.id}`
	});
	return {
		ok: true,
		both
	};
});
var toggleListingItem_createServerFn_handler = createServerRpc({
	id: "7d4947194ca7fb11b507c63372ba63f770bdde176e114790c5804e02174a1409",
	name: "toggleListingItem",
	filename: "src/lib/offers.functions.ts"
}, (opts) => toggleListingItem.__executeServer(opts));
var toggleListingItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	removed: booleanType()
}).parse(d)).handler(toggleListingItem_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: gerr } = await context.supabase.from("offers").select("*").eq("id", data.id).maybeSingle();
	if (gerr || !offer) throw new Error("Offer not found");
	const isFrom = offer.from_user === context.userId;
	if (!(offer.to_user === context.userId)) throw new Error("Only the listing owner can change the listed item");
	if (offer.status !== "accepted") throw new Error("Trade is not open for changes");
	const { error } = await context.supabase.from("offers").update({ listing_removed: data.removed }).eq("id", data.id);
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: isFrom ? offer.to_user : offer.from_user,
		type: "offer_revised",
		title: "Trade items changed",
		body: data.removed ? "The listed item was removed from the trade." : "The listed item was added back to the trade.",
		link: `/offers/${data.id}`
	});
	return { ok: true };
});
//#endregion
export { approveOfferItems_createServerFn_handler, confirmItemsReceived_createServerFn_handler, confirmTradeCompletion_createServerFn_handler, createOffer_createServerFn_handler, getOffer_createServerFn_handler, listMyOffers_createServerFn_handler, respondToOffer_createServerFn_handler, reviseOfferItems_createServerFn_handler, toggleListingItem_createServerFn_handler };
