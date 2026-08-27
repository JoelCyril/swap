import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/support.functions-BAa5Ojl2.js
var schema = objectType({
	name: stringType().trim().min(1).max(80),
	email: stringType().trim().email().max(255),
	subject: stringType().trim().min(1).max(140),
	message: stringType().trim().min(5).max(2e3)
});
/** Stores a Help / support inquiry from a visitor who is not signed in. */
var submitInquiry = createServerFn({ method: "POST" }).inputValidator((d) => schema.parse(d)).handler(createSsrRpc("f484412a84e5c96ad3935a8b83ca487b77d5ce71c6e46a0236f96119ef7e0aa1"));
/** Same, but linked to the signed-in member so they can read the moderator reply. */
var submitMyInquiry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => schema.parse(d)).handler(createSsrRpc("6159c83d8862d3c1ec1770a8518a0e00d7fa68d630b88c110a98fad8b1ac9413"));
/** The signed-in member's own inquiries plus any moderator replies. */
var listMyInquiries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("fc2aff25c62a69d3ede7ddf59b7a693b29c480499699e913c9ecd931a3f328b9"));
//#endregion
export { submitInquiry as n, submitMyInquiry as r, listMyInquiries as t };
