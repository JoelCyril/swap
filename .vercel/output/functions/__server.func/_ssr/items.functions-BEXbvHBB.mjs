import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as ensureProfile } from "./profile.server-B3hjrzIK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/items.functions-BEXbvHBB.js
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
var itemSchema = objectType({
	name: stringType().min(1).max(120),
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
	description: stringType().max(1e3).optional().nullable(),
	visibility: enumType(["public", "private"]).default("public"),
	image_urls: arrayType(stringType().url()).max(8).default([])
});
var listMyItems_createServerFn_handler = createServerRpc({
	id: "b8f09ef618d80a4a2347093d05bd1d6e71c5695b75a371395143002e34b9cc98",
	name: "listMyItems",
	filename: "src/lib/items.functions.ts"
}, (opts) => listMyItems.__executeServer(opts));
var listMyItems = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyItems_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("items").select("*").eq("owner_id", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var listMyListedItemIds_createServerFn_handler = createServerRpc({
	id: "0b6e4a7ed7438d86c6567fada5d525710912eef4c0e9a9f80361063e93febcf0",
	name: "listMyListedItemIds",
	filename: "src/lib/items.functions.ts"
}, (opts) => listMyListedItemIds.__executeServer(opts));
var listMyListedItemIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyListedItemIds_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("listings").select("item_id").eq("owner_id", context.userId).neq("status", "removed").not("item_id", "is", null);
	if (error) throw new Error(error.message);
	return (data ?? []).map((r) => r.item_id);
});
var listMySwappedItemIds_createServerFn_handler = createServerRpc({
	id: "85de83dc5f1d8b4afb722a6cc7c6645e359770493809119d327728bc777d9508",
	name: "listMySwappedItemIds",
	filename: "src/lib/items.functions.ts"
}, (opts) => listMySwappedItemIds.__executeServer(opts));
var listMySwappedItemIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMySwappedItemIds_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.from("listings").select("item_id").eq("owner_id", context.userId).eq("status", "completed").not("item_id", "is", null);
	return (data ?? []).map((r) => r.item_id);
});
var listOwnerInventory_createServerFn_handler = createServerRpc({
	id: "330fcba60f18d78bb7c280fbe00ccdbc4701391ef991c35dccc436a9e371c789",
	name: "listOwnerInventory",
	filename: "src/lib/items.functions.ts"
}, (opts) => listOwnerInventory.__executeServer(opts));
var listOwnerInventory = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ owner_id: stringType().uuid() }).parse(d)).handler(listOwnerInventory_createServerFn_handler, async ({ data }) => {
	const { data: rows } = await publicClient().from("items").select("*").eq("owner_id", data.owner_id).eq("visibility", "public").order("created_at", { ascending: false });
	return rows ?? [];
});
var getPublicItem_createServerFn_handler = createServerRpc({
	id: "a578d6cab6e115532a20684f9b5fa9015bbc4f7b45687e9e608910c6e4e818dc",
	name: "getPublicItem",
	filename: "src/lib/items.functions.ts"
}, (opts) => getPublicItem.__executeServer(opts));
var getPublicItem = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getPublicItem_createServerFn_handler, async ({ data }) => {
	const { data: item } = await publicClient().from("items").select("*, owner:profiles!items_owner_profile_fkey(id, username, display_name, avatar_color, avatar_url)").eq("id", data.id).eq("visibility", "public").maybeSingle();
	return item ?? null;
});
var getMyItem_createServerFn_handler = createServerRpc({
	id: "fc0f242351bad5afb49462bad1716410ff16bb5c4d93ce643ad93ca9f83c2b32",
	name: "getMyItem",
	filename: "src/lib/items.functions.ts"
}, (opts) => getMyItem.__executeServer(opts));
var getMyItem = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getMyItem_createServerFn_handler, async ({ data, context }) => {
	const { data: item } = await context.supabase.from("items").select("*, owner:profiles!items_owner_profile_fkey(id, username, display_name, avatar_color, avatar_url)").eq("id", data.id).eq("owner_id", context.userId).maybeSingle();
	return item ?? null;
});
var createItem_createServerFn_handler = createServerRpc({
	id: "14b46c83e0921d23a7c343ff099b54c9b9e3f37609cac0834d7c758e0bab4824",
	name: "createItem",
	filename: "src/lib/items.functions.ts"
}, (opts) => createItem.__executeServer(opts));
var createItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => itemSchema.parse(d)).handler(createItem_createServerFn_handler, async ({ data, context }) => {
	await ensureProfile(context.userId);
	const { data: row, error } = await context.supabase.from("items").insert({
		...data,
		owner_id: context.userId
	}).select().single();
	if (error) throw new Error(error.message);
	return row;
});
var updateItem_createServerFn_handler = createServerRpc({
	id: "7cbc9e2674a223f35a213bafe23220afb9f4f756f27d8c1a27608f7330202785",
	name: "updateItem",
	filename: "src/lib/items.functions.ts"
}, (opts) => updateItem.__executeServer(opts));
var updateItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).merge(itemSchema.partial()).parse(d)).handler(updateItem_createServerFn_handler, async ({ data, context }) => {
	const { id, ...rest } = data;
	const { error } = await context.supabase.from("items").update(rest).eq("id", id).eq("owner_id", context.userId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var deleteItem_createServerFn_handler = createServerRpc({
	id: "b5296a793467ade63ff5da7e1e3af7702ab70499ad72934731f4df67a3f9dbe9",
	name: "deleteItem",
	filename: "src/lib/items.functions.ts"
}, (opts) => deleteItem.__executeServer(opts));
var deleteItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteItem_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("items").delete().eq("id", data.id).eq("owner_id", context.userId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { createItem_createServerFn_handler, deleteItem_createServerFn_handler, getMyItem_createServerFn_handler, getPublicItem_createServerFn_handler, listMyItems_createServerFn_handler, listMyListedItemIds_createServerFn_handler, listMySwappedItemIds_createServerFn_handler, listOwnerInventory_createServerFn_handler, updateItem_createServerFn_handler };
