import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { notifyUser } from "./notifications.server-CwIB500t.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-37iZsyOh.js
async function assertAdmin(context) {
	const { data } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!data) throw new Error("Forbidden");
}
var listFlaggedListings_createServerFn_handler = createServerRpc({
	id: "ae5c6d4cb73024264a6b3835bfcc1d8bbdea8173580b6faabfeaae215ecf3d38",
	name: "listFlaggedListings",
	filename: "src/lib/admin.functions.ts"
}, (opts) => listFlaggedListings.__executeServer(opts));
var listFlaggedListings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listFlaggedListings_createServerFn_handler, async ({ context }) => {
	await assertAdmin(context);
	const { data, error } = await context.supabase.from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").gt("flags_count", 0).order("flags_count", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var getFlaggedListingDetail_createServerFn_handler = createServerRpc({
	id: "735ec82217a82ff4bfbab42bda7038f2850637719934f6460f8f2ddaee14ddcf",
	name: "getFlaggedListingDetail",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getFlaggedListingDetail.__executeServer(opts));
var getFlaggedListingDetail = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getFlaggedListingDetail_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const { data: listing, error } = await context.supabase.from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").eq("id", data.id).maybeSingle();
	if (error) throw new Error(error.message);
	const { data: flags } = await context.supabase.from("flags").select("*").eq("listing_id", data.id).order("created_at", { ascending: false });
	const reporterIds = [...new Set((flags ?? []).map((f) => f.reporter_id))];
	const { data: reporters } = reporterIds.length ? await context.supabase.from("profiles").select("id, username, display_name, avatar_color").in("id", reporterIds) : { data: [] };
	return {
		listing,
		flags: (flags ?? []).map((f) => ({
			...f,
			reporter: (reporters ?? []).find((r) => r.id === f.reporter_id) ?? null
		}))
	};
});
var adminRemoveListing_createServerFn_handler = createServerRpc({
	id: "36e309b94bbdc97cbe7289eee16875bbe33300ec5cddbdc27666f4d8161a7fe7",
	name: "adminRemoveListing",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminRemoveListing.__executeServer(opts));
var adminRemoveListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(adminRemoveListing_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const { data: listing } = await context.supabase.from("listings").select("owner_id, title").eq("id", data.id).maybeSingle();
	const { error } = await context.supabase.from("listings").update({ status: "removed" }).eq("id", data.id);
	if (error) throw new Error(error.message);
	if (listing) {
		await notifyUser({
			userId: listing.owner_id,
			type: "listing_removed",
			title: "Your listing was removed",
			body: `"${listing.title}" was removed by a moderator after being reported.`,
			link: "/your-items"
		});
		const { data: reporters } = await context.supabase.from("flags").select("reporter_id").eq("listing_id", data.id);
		const unique = [...new Set((reporters ?? []).map((r) => r.reporter_id))];
		for (const uid of unique) await notifyUser({
			userId: uid,
			type: "flag_actioned",
			title: "A listing you reported was removed",
			body: `"${listing.title}" was taken down.`,
			link: "/listings"
		});
	}
	return { ok: true };
});
var redeemAdminCode_createServerFn_handler = createServerRpc({
	id: "fde7a16cc94c6c94dfc38fb4db984c5f9f078ff79b83af25731a3d95d6412c44",
	name: "redeemAdminCode",
	filename: "src/lib/admin.functions.ts"
}, (opts) => redeemAdminCode.__executeServer(opts));
var redeemAdminCode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ code: stringType().min(4) }).parse(d)).handler(redeemAdminCode_createServerFn_handler, async ({ data, context }) => {
	if (data.code !== "bosh123") throw new Error("Invalid code");
	const { supabaseAdmin } = await import("./client.server-B-2s9oPC.mjs");
	const { error } = await supabaseAdmin.from("user_roles").insert({
		user_id: context.userId,
		role: "admin"
	});
	if (error && !error.message.includes("duplicate")) throw new Error(error.message);
	return { ok: true };
});
var listBannedUsers_createServerFn_handler = createServerRpc({
	id: "c68f8782acc616eb73df9ebd3137821ef65cb867d76237bf0c987c2de20eb5ca",
	name: "listBannedUsers",
	filename: "src/lib/admin.functions.ts"
}, (opts) => listBannedUsers.__executeServer(opts));
var listBannedUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listBannedUsers_createServerFn_handler, async ({ context }) => {
	await assertAdmin(context);
	const { data, error } = await context.supabase.from("user_bans").select("id, user_id, reason, expires_at, created_at").is("lifted_at", null).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	const now = Date.now();
	const active = (data ?? []).filter((b) => b.expires_at === null || new Date(b.expires_at).getTime() > now);
	const ids = [...new Set(active.map((b) => b.user_id))];
	const { data: profiles } = ids.length ? await context.supabase.from("profiles").select("id, username, display_name, avatar_url, avatar_color").in("id", ids) : { data: [] };
	return active.map((b) => ({
		...b,
		profile: (profiles ?? []).find((p) => p.id === b.user_id) ?? null
	}));
});
var listInquiries_createServerFn_handler = createServerRpc({
	id: "cd63362af08c5dc92539f291baaf79550fd7e540f29455914d4a149fb2be20e1",
	name: "listInquiries",
	filename: "src/lib/admin.functions.ts"
}, (opts) => listInquiries.__executeServer(opts));
var listInquiries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listInquiries_createServerFn_handler, async ({ context }) => {
	await assertAdmin(context);
	const { data, error } = await context.supabase.from("support_inquiries").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var listWithheldListings_createServerFn_handler = createServerRpc({
	id: "5086beee22f1a95abe9adf707e82816a64d9dd43856183e8e996fccd1e65d72c",
	name: "listWithheldListings",
	filename: "src/lib/admin.functions.ts"
}, (opts) => listWithheldListings.__executeServer(opts));
var listWithheldListings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listWithheldListings_createServerFn_handler, async ({ context }) => {
	await assertAdmin(context);
	const { data, error } = await context.supabase.from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").eq("status", "withheld").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var reviewWithheldListing_createServerFn_handler = createServerRpc({
	id: "fa67d1daa44be5874994f295c596f861375c51036c80af2214e46ec47a2388ba",
	name: "reviewWithheldListing",
	filename: "src/lib/admin.functions.ts"
}, (opts) => reviewWithheldListing.__executeServer(opts));
var reviewWithheldListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	approve: booleanType()
}).parse(d)).handler(reviewWithheldListing_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const { data: listing } = await context.supabase.from("listings").select("owner_id, title").eq("id", data.id).maybeSingle();
	const { error } = await context.supabase.from("listings").update({ status: data.approve ? "active" : "removed" }).eq("id", data.id);
	if (error) throw new Error(error.message);
	if (listing) await notifyUser({
		userId: listing.owner_id,
		type: data.approve ? "listing_approved" : "listing_removed",
		title: data.approve ? "Your listing is now live" : "Your listing was declined",
		body: data.approve ? `"${listing.title}" passed moderator review.` : `"${listing.title}" was declined by a moderator.`,
		link: "/my-listings"
	});
	return { ok: true };
});
var replyToInquiry_createServerFn_handler = createServerRpc({
	id: "4eeacca8b46e830bce18d82018a74f56608b795ea065bb943685dfa593aeed4c",
	name: "replyToInquiry",
	filename: "src/lib/admin.functions.ts"
}, (opts) => replyToInquiry.__executeServer(opts));
var replyToInquiry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	reply: stringType().trim().min(1).max(2e3)
}).parse(d)).handler(replyToInquiry_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const { error } = await context.supabase.from("support_inquiries").update({
		reply: data.reply,
		replied_at: (/* @__PURE__ */ new Date()).toISOString(),
		replied_by: context.userId
	}).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { adminRemoveListing_createServerFn_handler, getFlaggedListingDetail_createServerFn_handler, listBannedUsers_createServerFn_handler, listFlaggedListings_createServerFn_handler, listInquiries_createServerFn_handler, listWithheldListings_createServerFn_handler, redeemAdminCode_createServerFn_handler, replyToInquiry_createServerFn_handler, reviewWithheldListing_createServerFn_handler };
