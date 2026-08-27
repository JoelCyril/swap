import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as ensureProfile } from "./profile.server-B3hjrzIK.mjs";
import { t as moderate } from "./moderation-uKnGKN2x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings.functions-1qcLB2De.js
function publicClient() {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_PUBLISHABLE_KEY;
	return createClient(url, key, {
		auth: {
			storage: void 0,
			persistSession: false,
			autoRefreshToken: false
		},
		global: { fetch: (input, init) => {
			const h = new Headers(init?.headers);
			if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
			h.set("apikey", key);
			return fetch(input, {
				...init,
				headers: h
			});
		} }
	});
}
var listListings_createServerFn_handler = createServerRpc({
	id: "393d89a201a164777207ef82e19865ca3f8316688118ad59b082ec3b97df7e37",
	name: "listListings",
	filename: "src/lib/listings.functions.ts"
}, (opts) => listListings.__executeServer(opts));
var listListings = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ category: stringType().nullable().optional() }).parse(d ?? {})).handler(listListings_createServerFn_handler, async ({ data }) => {
	let q = publicClient().from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").in("status", ["active", "reserved"]).order("created_at", { ascending: false }).limit(60);
	if (data.category) q = q.eq("category", data.category);
	const { data: rows, error } = await q;
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var getListing_createServerFn_handler = createServerRpc({
	id: "3534642b2e7440be71e815e5e597a1650d0dfc52d9ceb96bbaad3e6a46f731ec",
	name: "getListing",
	filename: "src/lib/listings.functions.ts"
}, (opts) => getListing.__executeServer(opts));
var getListing = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getListing_createServerFn_handler, async ({ data }) => {
	const { data: row, error } = await publicClient().from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").eq("id", data.id).maybeSingle();
	if (error) throw new Error(error.message);
	return row;
});
var listListingsByUsername_createServerFn_handler = createServerRpc({
	id: "1c8acf19b71e1ac82f2c3d8fce667a7f4aaf703f20b6efc07afc758aa201bcb6",
	name: "listListingsByUsername",
	filename: "src/lib/listings.functions.ts"
}, (opts) => listListingsByUsername.__executeServer(opts));
var listListingsByUsername = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ username: stringType() }).parse(d)).handler(listListingsByUsername_createServerFn_handler, async ({ data }) => {
	const supabase = publicClient();
	const { data: profile } = await supabase.from("profiles").select("*").eq("username", data.username).maybeSingle();
	if (!profile) return {
		profile: null,
		listings: []
	};
	const { data: listings } = await supabase.from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").eq("owner_id", profile.id).in("status", ["active", "reserved"]).order("created_at", { ascending: false });
	return {
		profile,
		listings: listings ?? []
	};
});
var createSchema = objectType({
	title: stringType().min(2).max(120),
	description: stringType().max(2e3).default(""),
	category: enumType([
		"Electronics",
		"Household Items",
		"Clothing",
		"Outdoors",
		"Accessories",
		"Books",
		"Toys",
		"Sports"
	]),
	condition: enumType([
		"New",
		"Like New",
		"Good",
		"Fair"
	]),
	image_emoji: stringType().max(8).default("📦"),
	location: stringType().min(2).max(120),
	emirate: enumType([
		"Abu Dhabi",
		"Dubai",
		"Sharjah",
		"Ajman",
		"Umm Al Quwain",
		"Ras Al Khaimah",
		"Fujairah"
	]),
	looking_for: stringType().max(500).default(""),
	item_id: stringType().uuid().nullable().optional(),
	image_urls: arrayType(stringType().url().max(2048)).max(8).default([])
});
var createListing_createServerFn_handler = createServerRpc({
	id: "e6bd60a3d681f193640aea255c53be02cf065005566c7fb0afcf870257d8e520",
	name: "createListing",
	filename: "src/lib/listings.functions.ts"
}, (opts) => createListing.__executeServer(opts));
var createListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => createSchema.parse(d)).handler(createListing_createServerFn_handler, async ({ data, context }) => {
	await ensureProfile(context.userId);
	const { count } = await context.supabase.from("listings").select("id", {
		count: "exact",
		head: true
	}).eq("owner_id", context.userId).neq("status", "removed");
	if ((count ?? 0) >= 10) throw new Error("You can have at most 10 listings. Delete one before adding another.");
	if (data.item_id) {
		const { count: already } = await context.supabase.from("listings").select("id", {
			count: "exact",
			head: true
		}).eq("owner_id", context.userId).eq("item_id", data.item_id).neq("status", "removed");
		if ((already ?? 0) > 0) throw new Error("This inventory item is already listed.");
	}
	const verdict = moderate(`${data.title}\n${data.description}\n${data.looking_for}`, "listing");
	const held = verdict.flagged ? {
		status: "withheld",
		moderation_note: `${verdict.category}: ${verdict.reason} Matched: ${verdict.terms.join(", ")}`
	} : {};
	const { data: row, error } = await context.supabase.from("listings").insert({
		...data,
		...held,
		owner_id: context.userId
	}).select().single();
	if (error) throw new Error(error.message);
	return {
		...row,
		withheld: verdict.flagged
	};
});
var updateListingStatus_createServerFn_handler = createServerRpc({
	id: "ca9246f7ca9b35eb9816f7008419b40ddfa90dafa388844852066c7e98ed2d0b",
	name: "updateListingStatus",
	filename: "src/lib/listings.functions.ts"
}, (opts) => updateListingStatus.__executeServer(opts));
var updateListingStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	status: enumType([
		"active",
		"reserved",
		"completed",
		"removed"
	])
}).parse(d)).handler(updateListingStatus_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("listings").update({ status: data.status }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var deleteListing_createServerFn_handler = createServerRpc({
	id: "355748bb4fe1e0a54a381e93ab4522e771d97f4bef08293a6bcb103a57b5d2f2",
	name: "deleteListing",
	filename: "src/lib/listings.functions.ts"
}, (opts) => deleteListing.__executeServer(opts));
var deleteListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteListing_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("listings").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var listMyListings_createServerFn_handler = createServerRpc({
	id: "cbd8cf2a7e1c9686c2247240ab12ed297dd6a2e2928620f69b45a9a06d8decea",
	name: "listMyListings",
	filename: "src/lib/listings.functions.ts"
}, (opts) => listMyListings.__executeServer(opts));
var listMyListings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyListings_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("listings").select("*, owner:profiles!listings_owner_profile_fkey(*)").eq("owner_id", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var getMyListing_createServerFn_handler = createServerRpc({
	id: "5c6dacb987339e57220012df2aaa0f7ec820d9ad2df96c2cc8ee63fcd3ec9cf9",
	name: "getMyListing",
	filename: "src/lib/listings.functions.ts"
}, (opts) => getMyListing.__executeServer(opts));
var getMyListing = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getMyListing_createServerFn_handler, async ({ data, context }) => {
	const { data: row, error } = await context.supabase.from("listings").select("*").eq("id", data.id).eq("owner_id", context.userId).maybeSingle();
	if (error) throw new Error(error.message);
	return row;
});
var updateListing_createServerFn_handler = createServerRpc({
	id: "c79f7dd11e68357fc90b74489b571e3c20ed0335105ba0ddcd294c39a22b51d9",
	name: "updateListing",
	filename: "src/lib/listings.functions.ts"
}, (opts) => updateListing.__executeServer(opts));
var updateListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => createSchema.partial().extend({ id: stringType().uuid() }).parse(d)).handler(updateListing_createServerFn_handler, async ({ data, context }) => {
	const { id, ...fields } = data;
	const verdict = moderate(`${fields.title ?? ""}\n${fields.description ?? ""}\n${fields.looking_for ?? ""}`, "listing");
	const held = verdict.flagged ? {
		status: "withheld",
		moderation_note: `${verdict.category}: ${verdict.reason} Matched: ${verdict.terms.join(", ")}`
	} : {};
	const { error } = await context.supabase.from("listings").update({
		...fields,
		...held
	}).eq("id", id).eq("owner_id", context.userId);
	if (error) throw new Error(error.message);
	return {
		ok: true,
		id,
		withheld: verdict.flagged
	};
});
//#endregion
export { createListing_createServerFn_handler, deleteListing_createServerFn_handler, getListing_createServerFn_handler, getMyListing_createServerFn_handler, listListingsByUsername_createServerFn_handler, listListings_createServerFn_handler, listMyListings_createServerFn_handler, updateListingStatus_createServerFn_handler, updateListing_createServerFn_handler };
