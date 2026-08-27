import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings.functions-BPXCx35S.js
var getNotificationPrefs_createServerFn_handler = createServerRpc({
	id: "a82687b107579164c1f08d3d70756e9e669fc1b592ad917529b37889dffef6c7",
	name: "getNotificationPrefs",
	filename: "src/lib/settings.functions.ts"
}, (opts) => getNotificationPrefs.__executeServer(opts));
var getNotificationPrefs = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getNotificationPrefs_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.from("notification_prefs").select("announcements, messages, saves, offers").eq("user_id", context.userId).maybeSingle();
	return data ?? {
		announcements: true,
		messages: true,
		saves: true,
		offers: true
	};
});
var updateNotificationPrefs_createServerFn_handler = createServerRpc({
	id: "159577df88bd5453de4cede9972e10f416a5166edb439cdb536890481867b1eb",
	name: "updateNotificationPrefs",
	filename: "src/lib/settings.functions.ts"
}, (opts) => updateNotificationPrefs.__executeServer(opts));
var updateNotificationPrefs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	announcements: booleanType().optional(),
	messages: booleanType().optional(),
	saves: booleanType().optional(),
	offers: booleanType().optional()
}).parse(d)).handler(updateNotificationPrefs_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("notification_prefs").upsert({
		user_id: context.userId,
		...data
	}, { onConflict: "user_id" });
	if (error) throw new Error(error.message);
	return { ok: true };
});
var setInventoryPrivacy_createServerFn_handler = createServerRpc({
	id: "a4f384d24e4f7313dfa6fe1292140260e96627f537e86cc71c51e808350b5e29",
	name: "setInventoryPrivacy",
	filename: "src/lib/settings.functions.ts"
}, (opts) => setInventoryPrivacy.__executeServer(opts));
var setInventoryPrivacy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ private: booleanType() }).parse(d)).handler(setInventoryPrivacy_createServerFn_handler, async ({ data, context }) => {
	const visibility = data.private ? "private" : "public";
	const { error } = await context.supabase.from("items").update({ visibility }).eq("owner_id", context.userId);
	if (error) throw new Error(error.message);
	const { error: pErr } = await context.supabase.from("profiles").update({ inventory_default_visibility: visibility }).eq("id", context.userId);
	if (pErr) throw new Error(pErr.message);
	return { ok: true };
});
var listBlockedUsers_createServerFn_handler = createServerRpc({
	id: "0ec0ed54df9e29e5be34647b1bd6fe0efdd91b65b16a9970bc42c77058eadd7c",
	name: "listBlockedUsers",
	filename: "src/lib/settings.functions.ts"
}, (opts) => listBlockedUsers.__executeServer(opts));
var listBlockedUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listBlockedUsers_createServerFn_handler, async ({ context }) => {
	const { data: blocks, error } = await context.supabase.from("user_blocks").select("id, blocked_id, created_at").eq("blocker_id", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	const ids = (blocks ?? []).map((b) => b.blocked_id);
	if (!ids.length) return [];
	const { data: profiles } = await context.supabase.from("profiles").select("id, username, avatar_url, avatar_color").in("id", ids);
	const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
	return (blocks ?? []).map((b) => ({
		id: b.id,
		user: byId.get(b.blocked_id) ?? null,
		blocked_id: b.blocked_id,
		created_at: b.created_at
	}));
});
var listBlockedIds_createServerFn_handler = createServerRpc({
	id: "95f193883271e15b0351957b7722c2eb99af47d3be301c2f4a3b5800ab705ad0",
	name: "listBlockedIds",
	filename: "src/lib/settings.functions.ts"
}, (opts) => listBlockedIds.__executeServer(opts));
var listBlockedIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listBlockedIds_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.from("user_blocks").select("blocker_id, blocked_id").or(`blocker_id.eq.${context.userId},blocked_id.eq.${context.userId}`);
	const ids = /* @__PURE__ */ new Set();
	for (const row of data ?? []) ids.add(row.blocker_id === context.userId ? row.blocked_id : row.blocker_id);
	return [...ids];
});
var blockUser_createServerFn_handler = createServerRpc({
	id: "65d51d3c1f1765060d763f15223a70601c7ccb0dd49c8a271c0b2e56b7bfa80b",
	name: "blockUser",
	filename: "src/lib/settings.functions.ts"
}, (opts) => blockUser.__executeServer(opts));
var blockUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ username: stringType().trim().min(1).max(40) }).parse(d)).handler(blockUser_createServerFn_handler, async ({ data, context }) => {
	const uname = data.username.replace(/^@/, "").toLowerCase();
	const { data: target } = await context.supabase.from("profiles").select("id, username").ilike("username", uname).maybeSingle();
	if (!target) throw new Error("No member found with that username.");
	if (target.id === context.userId) throw new Error("You can't block yourself.");
	const { error } = await context.supabase.from("user_blocks").insert({
		blocker_id: context.userId,
		blocked_id: target.id
	});
	if (error && !error.message.includes("duplicate")) throw new Error(error.message);
	return {
		ok: true,
		username: target.username
	};
});
var unblockUser_createServerFn_handler = createServerRpc({
	id: "2435068c72b139610d2dc5bc7365df1186786ec561eb3aa49248a1c65fbd8150",
	name: "unblockUser",
	filename: "src/lib/settings.functions.ts"
}, (opts) => unblockUser.__executeServer(opts));
var unblockUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ blocked_id: stringType().uuid() }).parse(d)).handler(unblockUser_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("user_blocks").delete().eq("blocker_id", context.userId).eq("blocked_id", data.blocked_id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { blockUser_createServerFn_handler, getNotificationPrefs_createServerFn_handler, listBlockedIds_createServerFn_handler, listBlockedUsers_createServerFn_handler, setInventoryPrivacy_createServerFn_handler, unblockUser_createServerFn_handler, updateNotificationPrefs_createServerFn_handler };
