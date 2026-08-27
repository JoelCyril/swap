import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { notifyUser } from "./notifications.server-CwIB500t.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/meetups.functions-D8UkkfmV.js
var listMeetupProposals_createServerFn_handler = createServerRpc({
	id: "a611de4ad7405c6f148700631c8e1f37cad224d69be349bc63d36900c51cba27",
	name: "listMeetupProposals",
	filename: "src/lib/meetups.functions.ts"
}, (opts) => listMeetupProposals.__executeServer(opts));
var listMeetupProposals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ offer_id: stringType().uuid() }).parse(d)).handler(listMeetupProposals_createServerFn_handler, async ({ data, context }) => {
	const { data: rows, error } = await context.supabase.from("meetup_proposals").select("*").eq("offer_id", data.offer_id).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var proposeMeetup_createServerFn_handler = createServerRpc({
	id: "3feb5f43d4f8f9b66d19327bf692bdf050643ed7bf1917b0349eb6b586ed6c6f",
	name: "proposeMeetup",
	filename: "src/lib/meetups.functions.ts"
}, (opts) => proposeMeetup.__executeServer(opts));
var proposeMeetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	offer_id: stringType().uuid(),
	place: stringType().min(2).max(200),
	meet_at: stringType().datetime(),
	note: stringType().max(500).default("")
}).parse(d)).handler(proposeMeetup_createServerFn_handler, async ({ data, context }) => {
	const { data: offer, error: oerr } = await context.supabase.from("offers").select("id, from_user, to_user, status").eq("id", data.offer_id).maybeSingle();
	if (oerr || !offer) throw new Error("Offer not found");
	if (offer.status !== "accepted") throw new Error("Offer must be accepted first");
	await context.supabase.from("meetup_proposals").update({ status: "countered" }).eq("offer_id", data.offer_id).eq("status", "pending");
	const { data: row, error } = await context.supabase.from("meetup_proposals").insert({
		offer_id: data.offer_id,
		proposed_by: context.userId,
		place: data.place,
		meet_at: data.meet_at,
		note: data.note
	}).select().single();
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: offer.from_user === context.userId ? offer.to_user : offer.from_user,
		type: "meetup_proposed",
		title: "New meetup proposal",
		body: `${data.place} · ${new Date(data.meet_at).toLocaleString()}`,
		link: `/offers/${data.offer_id}`
	});
	return row;
});
var respondMeetup_createServerFn_handler = createServerRpc({
	id: "5f5ae7e6f5b17441d343d7dba3841f172dcf852dbe267a748457d1f871f1a9ab",
	name: "respondMeetup",
	filename: "src/lib/meetups.functions.ts"
}, (opts) => respondMeetup.__executeServer(opts));
var respondMeetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	action: enumType([
		"accept",
		"reject",
		"cancel"
	])
}).parse(d)).handler(respondMeetup_createServerFn_handler, async ({ data, context }) => {
	const { data: prop, error: perr } = await context.supabase.from("meetup_proposals").select("*, offer:offers(id, from_user, to_user)").eq("id", data.id).maybeSingle();
	if (perr || !prop) throw new Error("Proposal not found");
	const offer = prop.offer;
	const nextStatus = data.action === "accept" ? "accepted" : data.action === "reject" ? "rejected" : "cancelled";
	if ((data.action === "accept" || data.action === "reject") && prop.proposed_by === context.userId) throw new Error("You cannot respond to your own proposal");
	if (data.action === "cancel" && prop.proposed_by !== context.userId) throw new Error("Only the proposer can cancel");
	const { error } = await context.supabase.from("meetup_proposals").update({ status: nextStatus }).eq("id", data.id);
	if (error) throw new Error(error.message);
	await notifyUser({
		userId: data.action === "cancel" ? offer.from_user === context.userId ? offer.to_user : offer.from_user : prop.proposed_by,
		type: `meetup_${nextStatus}`,
		title: nextStatus === "accepted" ? "Meetup confirmed" : nextStatus === "rejected" ? "Meetup rejected" : "Meetup cancelled",
		body: `${prop.place} · ${new Date(prop.meet_at).toLocaleString()}`,
		link: `/offers/${offer.id}`
	});
	if (nextStatus === "accepted") await context.supabase.from("meetup_proposals").update({ safety_confirmed_by: [] }).eq("id", data.id);
	return {
		ok: true,
		status: nextStatus
	};
});
var confirmMeetupSafety_createServerFn_handler = createServerRpc({
	id: "c9ee2cd1a464df5a4c6cf16a3eae71d698e14ad713bdc95ad87dddc72d142329",
	name: "confirmMeetupSafety",
	filename: "src/lib/meetups.functions.ts"
}, (opts) => confirmMeetupSafety.__executeServer(opts));
var confirmMeetupSafety = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(confirmMeetupSafety_createServerFn_handler, async ({ data, context }) => {
	const { data: prop, error: perr } = await context.supabase.from("meetup_proposals").select("*, offer:offers(id, from_user, to_user)").eq("id", data.id).maybeSingle();
	if (perr || !prop) throw new Error("Proposal not found");
	if (prop.status !== "accepted") throw new Error("Meetup is not accepted yet");
	const offer = prop.offer;
	const current = (prop.safety_confirmed_by ?? []).filter(Boolean);
	const next = Array.from(/* @__PURE__ */ new Set([...current, context.userId]));
	const { error } = await context.supabase.from("meetup_proposals").update({ safety_confirmed_by: next }).eq("id", data.id);
	if (error) throw new Error(error.message);
	const both = next.includes(offer.from_user) && next.includes(offer.to_user);
	if (both) await context.supabase.from("offers").update({
		meetup_at: prop.meet_at,
		meetup_location: prop.place
	}).eq("id", offer.id);
	await notifyUser({
		userId: offer.from_user === context.userId ? offer.to_user : offer.from_user,
		type: both ? "meetup_confirmed" : "meetup_safety",
		title: both ? "Meetup confirmed" : "Safety confirmation received",
		body: both ? `${prop.place} · ${new Date(prop.meet_at).toLocaleString()}` : "Tick your safety box to confirm the meetup.",
		link: `/offers/${offer.id}`
	});
	return {
		ok: true,
		both
	};
});
//#endregion
export { confirmMeetupSafety_createServerFn_handler, listMeetupProposals_createServerFn_handler, proposeMeetup_createServerFn_handler, respondMeetup_createServerFn_handler };
