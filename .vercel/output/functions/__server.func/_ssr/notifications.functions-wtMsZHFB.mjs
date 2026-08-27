import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications.functions-wtMsZHFB.js
var listMyNotifications_createServerFn_handler = createServerRpc({
	id: "acdc1590236f0839542f983a97a7193af437f8125c921a77e6feea3b73ccec73",
	name: "listMyNotifications",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => listMyNotifications.__executeServer(opts));
var listMyNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyNotifications_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
	if (error) throw new Error(error.message);
	return data ?? [];
});
var markNotificationRead_createServerFn_handler = createServerRpc({
	id: "385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64",
	name: "markNotificationRead",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => markNotificationRead.__executeServer(opts));
var markNotificationRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(markNotificationRead_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("notifications").update({ read: true }).eq("id", data.id).eq("user_id", context.userId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var markAllNotificationsRead_createServerFn_handler = createServerRpc({
	id: "9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b",
	name: "markAllNotificationsRead",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => markAllNotificationsRead.__executeServer(opts));
var markAllNotificationsRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(markAllNotificationsRead_createServerFn_handler, async ({ context }) => {
	const { error } = await context.supabase.from("notifications").update({ read: true }).eq("user_id", context.userId).eq("read", false);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { listMyNotifications_createServerFn_handler, markAllNotificationsRead_createServerFn_handler, markNotificationRead_createServerFn_handler };
