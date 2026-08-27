import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as moderate } from "./moderation-uKnGKN2x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/messages.functions-Vc5re1Nb.js
var listMessages_createServerFn_handler = createServerRpc({
	id: "e654f3933a58e7d942461609513a549fc8cec53cb8d19d826771e23bfde0aaea",
	name: "listMessages",
	filename: "src/lib/messages.functions.ts"
}, (opts) => listMessages.__executeServer(opts));
var listMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ offer_id: stringType().uuid() }).parse(d)).handler(listMessages_createServerFn_handler, async ({ data, context }) => {
	const { data: rows, error } = await context.supabase.from("messages").select("*, sender:profiles!messages_sender_profile_fkey(*)").eq("offer_id", data.offer_id).order("created_at", { ascending: true });
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var sendMessage_createServerFn_handler = createServerRpc({
	id: "190919c9591587f0e69ca09e3e1a05dff4372e8a7afb305e40cf4fec5f6c09a7",
	name: "sendMessage",
	filename: "src/lib/messages.functions.ts"
}, (opts) => sendMessage.__executeServer(opts));
var sendMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	offer_id: stringType().uuid(),
	body: stringType().max(2e3).default(""),
	attachment_urls: arrayType(stringType().url().max(2048)).max(4).default([])
}).refine((v) => v.body.trim().length > 0 || v.attachment_urls.length > 0, { message: "Write a message or attach a file." }).parse(d)).handler(sendMessage_createServerFn_handler, async ({ data, context }) => {
	const verdict = moderate(data.body || "", "chat");
	if (verdict.flagged) throw new Error(`Message blocked: ${verdict.reason} Prohibited: ${verdict.terms.join(", ")}`);
	const { data: row, error } = await context.supabase.from("messages").insert({
		offer_id: data.offer_id,
		sender_id: context.userId,
		body: data.body,
		attachment_urls: data.attachment_urls
	}).select().single();
	if (error) throw new Error(error.message);
	return row;
});
var markMessagesRead_createServerFn_handler = createServerRpc({
	id: "9ea16a04fa87d006c08c4a8b7122e0acb522d4d7fefab1ff2f26a4111282272b",
	name: "markMessagesRead",
	filename: "src/lib/messages.functions.ts"
}, (opts) => markMessagesRead.__executeServer(opts));
var markMessagesRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ offer_id: stringType().uuid() }).parse(d)).handler(markMessagesRead_createServerFn_handler, async ({ data, context }) => {
	await context.supabase.from("messages").update({ read_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("offer_id", data.offer_id).neq("sender_id", context.userId).is("read_at", null);
	return { ok: true };
});
//#endregion
export { listMessages_createServerFn_handler, markMessagesRead_createServerFn_handler, sendMessage_createServerFn_handler };
