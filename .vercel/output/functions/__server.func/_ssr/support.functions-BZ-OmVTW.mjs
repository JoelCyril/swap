import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/support.functions-BZ-OmVTW.js
var schema = objectType({
	name: stringType().trim().min(1).max(80),
	email: stringType().trim().email().max(255),
	subject: stringType().trim().min(1).max(140),
	message: stringType().trim().min(5).max(2e3)
});
/** Stores a Help / support inquiry from a visitor who is not signed in. */
var submitInquiry_createServerFn_handler = createServerRpc({
	id: "f484412a84e5c96ad3935a8b83ca487b77d5ce71c6e46a0236f96119ef7e0aa1",
	name: "submitInquiry",
	filename: "src/lib/support.functions.ts"
}, (opts) => submitInquiry.__executeServer(opts));
var submitInquiry = createServerFn({ method: "POST" }).inputValidator((d) => schema.parse(d)).handler(submitInquiry_createServerFn_handler, async ({ data }) => {
	const url = process.env["SUPABASE_URL"];
	const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
	const { error } = await createClient(url, key, {
		auth: { persistSession: false },
		global: { fetch: (input, init) => {
			const h = new Headers(init?.headers);
			if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
			h.set("apikey", key);
			return fetch(input, {
				...init,
				headers: h
			});
		} }
	}).from("support_inquiries").insert({
		name: data.name,
		email: data.email,
		subject: data.subject,
		message: data.message
	});
	if (error) throw new Error(error.message);
	return { ok: true };
});
var submitMyInquiry_createServerFn_handler = createServerRpc({
	id: "6159c83d8862d3c1ec1770a8518a0e00d7fa68d630b88c110a98fad8b1ac9413",
	name: "submitMyInquiry",
	filename: "src/lib/support.functions.ts"
}, (opts) => submitMyInquiry.__executeServer(opts));
var submitMyInquiry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => schema.parse(d)).handler(submitMyInquiry_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("support_inquiries").insert({
		user_id: context.userId,
		name: data.name,
		email: data.email,
		subject: data.subject,
		message: data.message
	});
	if (error) throw new Error(error.message);
	return { ok: true };
});
var listMyInquiries_createServerFn_handler = createServerRpc({
	id: "fc2aff25c62a69d3ede7ddf59b7a693b29c480499699e913c9ecd931a3f328b9",
	name: "listMyInquiries",
	filename: "src/lib/support.functions.ts"
}, (opts) => listMyInquiries.__executeServer(opts));
var listMyInquiries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyInquiries_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("support_inquiries").select("id, subject, message, reply, replied_at, created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20);
	if (error) throw new Error(error.message);
	return data ?? [];
});
//#endregion
export { listMyInquiries_createServerFn_handler, submitInquiry_createServerFn_handler, submitMyInquiry_createServerFn_handler };
