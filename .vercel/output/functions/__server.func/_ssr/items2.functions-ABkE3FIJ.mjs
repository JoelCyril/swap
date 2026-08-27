import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/items2.functions-ABkE3FIJ.js
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
var listMyItems = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("b8f09ef618d80a4a2347093d05bd1d6e71c5695b75a371395143002e34b9cc98"));
/** IDs of the signed-in user's inventory items that already have a live listing. */
var listMyListedItemIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0b6e4a7ed7438d86c6567fada5d525710912eef4c0e9a9f80361063e93febcf0"));
/** Item ids whose listing has been fully swapped. */
var listMySwappedItemIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("85de83dc5f1d8b4afb722a6cc7c6645e359770493809119d327728bc777d9508"));
/** Public inventory of any user (used by the trade negotiation "View inventory" popup). */
var listOwnerInventory = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ owner_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("330fcba60f18d78bb7c280fbe00ccdbc4701391ef991c35dccc436a9e371c789"));
/** Public item detail (only items whose visibility is public). */
var getPublicItem = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("a578d6cab6e115532a20684f9b5fa9015bbc4f7b45687e9e608910c6e4e818dc"));
/** Owner-scoped item detail so private items are still viewable by their owner. */
var getMyItem = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("fc0f242351bad5afb49462bad1716410ff16bb5c4d93ce643ad93ca9f83c2b32"));
var createItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => itemSchema.parse(d)).handler(createSsrRpc("14b46c83e0921d23a7c343ff099b54c9b9e3f37609cac0834d7c758e0bab4824"));
var updateItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).merge(itemSchema.partial()).parse(d)).handler(createSsrRpc("7cbc9e2674a223f35a213bafe23220afb9f4f756f27d8c1a27608f7330202785"));
var deleteItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("b5296a793467ade63ff5da7e1e3af7702ab70499ad72934731f4df67a3f9dbe9"));
//#endregion
export { listMyItems as a, listOwnerInventory as c, getPublicItem as i, updateItem as l, deleteItem as n, listMyListedItemIds as o, getMyItem as r, listMySwappedItemIds as s, createItem as t };
