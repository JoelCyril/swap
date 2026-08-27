import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as ensureProfile } from "./profile.server-B3hjrzIK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/announcements.functions-CMdQPFr7.js
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
var listAnnouncements_createServerFn_handler = createServerRpc({
	id: "d75312e39754628ccbc30c7c27dae53a1f04f162bf29838f1b4be44071b1445a",
	name: "listAnnouncements",
	filename: "src/lib/announcements.functions.ts"
}, (opts) => listAnnouncements.__executeServer(opts));
var listAnnouncements = createServerFn({ method: "GET" }).handler(listAnnouncements_createServerFn_handler, async () => {
	const { data, error } = await publicClient().from("announcements").select("*, author:profiles!announcements_author_id_fkey(id, username, display_name, avatar_color, avatar_url)").order("created_at", { ascending: false }).limit(100);
	if (error) throw new Error(error.message);
	return data ?? [];
});
var createAnnouncement_createServerFn_handler = createServerRpc({
	id: "886fcc9ad3b27ecaa314eb466291dd41e9efc7869b0d887ff5d92f9aff9b7f91",
	name: "createAnnouncement",
	filename: "src/lib/announcements.functions.ts"
}, (opts) => createAnnouncement.__executeServer(opts));
var createAnnouncement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	body: stringType().max(4e3).default(""),
	image_urls: arrayType(stringType().url().max(2048)).max(6).default([])
}).refine((v) => v.body.trim().length > 0 || v.image_urls.length > 0, { message: "Write a message or add a photo" }).parse(d)).handler(createAnnouncement_createServerFn_handler, async ({ data, context }) => {
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Only moderators can post announcements");
	await ensureProfile(context.userId);
	const { data: row, error } = await context.supabase.from("announcements").insert({
		author_id: context.userId,
		body: data.body,
		image_urls: data.image_urls
	}).select().single();
	if (error) throw new Error(error.message);
	try {
		const { supabaseAdmin } = await import("./client.server-B-2s9oPC.mjs");
		const { data: members } = await supabaseAdmin.from("profiles").select("id");
		const { data: offRows } = await supabaseAdmin.from("notification_prefs").select("user_id").eq("announcements", false);
		const muted = new Set((offRows ?? []).map((r) => r.user_id));
		const preview = data.body.trim().slice(0, 120) || "New photo announcement";
		const rows = (members ?? []).filter((m) => m.id !== context.userId && !muted.has(m.id)).map((m) => ({
			user_id: m.id,
			type: "announcement",
			title: "New community announcement",
			body: preview,
			link: "/announcements"
		}));
		if (rows.length > 0) await supabaseAdmin.from("notifications").insert(rows);
	} catch (e) {
		console.error("Announcement notify failed", e);
	}
	return row;
});
var deleteAnnouncement_createServerFn_handler = createServerRpc({
	id: "c11c97af8521520dd3e62a61ff3858e63857b34966188ffb256b53d39e8b55af",
	name: "deleteAnnouncement",
	filename: "src/lib/announcements.functions.ts"
}, (opts) => deleteAnnouncement.__executeServer(opts));
var deleteAnnouncement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteAnnouncement_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { createAnnouncement_createServerFn_handler, deleteAnnouncement_createServerFn_handler, listAnnouncements_createServerFn_handler };
