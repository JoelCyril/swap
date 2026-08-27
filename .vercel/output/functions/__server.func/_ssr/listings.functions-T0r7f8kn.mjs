import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings.functions-T0r7f8kn.js
var listListings = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ category: stringType().nullable().optional() }).parse(d ?? {})).handler(createSsrRpc("393d89a201a164777207ef82e19865ca3f8316688118ad59b082ec3b97df7e37"));
var getListing = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("3534642b2e7440be71e815e5e597a1650d0dfc52d9ceb96bbaad3e6a46f731ec"));
var listListingsByUsername = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ username: stringType() }).parse(d)).handler(createSsrRpc("1c8acf19b71e1ac82f2c3d8fce667a7f4aaf703f20b6efc07afc758aa201bcb6"));
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
var createListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => createSchema.parse(d)).handler(createSsrRpc("e6bd60a3d681f193640aea255c53be02cf065005566c7fb0afcf870257d8e520"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	status: enumType([
		"active",
		"reserved",
		"completed",
		"removed"
	])
}).parse(d)).handler(createSsrRpc("ca9246f7ca9b35eb9816f7008419b40ddfa90dafa388844852066c7e98ed2d0b"));
var deleteListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("355748bb4fe1e0a54a381e93ab4522e771d97f4bef08293a6bcb103a57b5d2f2"));
/** Every listing owned by the signed-in user, whatever its status. */
var listMyListings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("cbd8cf2a7e1c9686c2247240ab12ed297dd6a2e2928620f69b45a9a06d8decea"));
/** Owner-scoped read so the edit form can load listings in any status. */
var getMyListing = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("5c6dacb987339e57220012df2aaa0f7ec820d9ad2df96c2cc8ee63fcd3ec9cf9"));
var updateListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => createSchema.partial().extend({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c79f7dd11e68357fc90b74489b571e3c20ed0335105ba0ddcd294c39a22b51d9"));
//#endregion
export { listListings as a, updateListing as c, getMyListing as i, deleteListing as n, listListingsByUsername as o, getListing as r, listMyListings as s, createListing as t };
