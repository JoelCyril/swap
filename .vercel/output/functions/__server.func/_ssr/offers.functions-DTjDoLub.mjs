import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { n as booleanType, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers.functions-DTjDoLub.js
var createOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	listing_id: stringType().uuid(),
	offered_item_ids: arrayType(stringType().uuid()).min(1).max(6),
	message: stringType().max(1e3).default("")
}).parse(d)).handler(createSsrRpc("9497b3018ae07b97743d6588f7944955abc937e50ba1a0ce8af94a1c855c5f8b"));
var listMyOffers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("d522cd210393069b72a64cb1968ff8722e85c1c2944d249e7a9547d7b40fec03"));
var getOffer = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c56f1f06093187a6f47c9227d81ab0b41f9bee1107941be9c7c7601fa72af17d"));
/** Either party freely edits the items on their OWN side. No turn-taking. */
var reviseOfferItems = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	offered_item_ids: arrayType(stringType().uuid()).max(6)
}).parse(d)).handler(createSsrRpc("0332a42156bc496a6c44d02bd35ae069e0b5871f446db557453ea550971fa667"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("f9d9f7821b1deb0a1af140abe282a3abfa44a6100d48d0860e7d1d4d8332b600"));
var respondToOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	action: enumType([
		"accept",
		"decline",
		"waitlist",
		"withdraw",
		"complete"
	])
}).parse(d)).handler(createSsrRpc("1001ef192a9e4793aa11e821237aa19d0535b7386828a54ea9ba46d41fe3701b"));
/** Stage 1: both sides must confirm before the trade is marked completed. */
var confirmTradeCompletion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("9e7e7a7f626f4f8bc2a0af80b9824cac031194ab31e6c213c1a2540d88668b09"));
/** Stage 2: after completion, each side confirms they received the items. */
var confirmItemsReceived = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("4d2898f4f8b044bc374c94f6bfbda4ad9ed8882ae8d92e44287717699c9fc647"));
/** Toggle whether the originally listed item is part of the trade. */
var toggleListingItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	removed: booleanType()
}).parse(d)).handler(createSsrRpc("7d4947194ca7fb11b507c63372ba63f770bdde176e114790c5804e02174a1409"));
//#endregion
export { listMyOffers as a, toggleListingItem as c, getOffer as i, confirmTradeCompletion as n, respondToOffer as o, createOffer as r, reviseOfferItems as s, confirmItemsReceived as t };
