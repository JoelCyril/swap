import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/flags.functions-B0BAF236.js
var flagListing_createServerFn_handler = createServerRpc({
	id: "21d2794ae9c3ec96629a8f54cd91369e5fa3878e4223ce9317c4692e37a0d7f8",
	name: "flagListing",
	filename: "src/lib/flags.functions.ts"
}, (opts) => flagListing.__executeServer(opts));
var flagListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	listing_id: stringType().uuid(),
	reason: stringType().min(3).max(500)
}).parse(d)).handler(flagListing_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("flags").insert({
		listing_id: data.listing_id,
		reporter_id: context.userId,
		reason: data.reason
	});
	if (error && !error.message.includes("duplicate")) throw new Error(error.message);
	return { ok: true };
});
var listMyFlaggedListingIds_createServerFn_handler = createServerRpc({
	id: "76f65f18065c713216f07570f65bf8e1f85c330cdfaf4d1d6ec1d40098ade353",
	name: "listMyFlaggedListingIds",
	filename: "src/lib/flags.functions.ts"
}, (opts) => listMyFlaggedListingIds.__executeServer(opts));
var listMyFlaggedListingIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyFlaggedListingIds_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("flags").select("listing_id").eq("reporter_id", context.userId);
	if (error) throw new Error(error.message);
	return [...new Set((data ?? []).map((r) => r.listing_id))];
});
//#endregion
export { flagListing_createServerFn_handler, listMyFlaggedListingIds_createServerFn_handler };
