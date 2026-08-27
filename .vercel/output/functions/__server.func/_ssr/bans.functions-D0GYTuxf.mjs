import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { a as numberType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bans.functions-D0GYTuxf.js
async function assertAdmin(context) {
	const { data } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!data) throw new Error("Forbidden");
}
/** The signed-in user's active ban, if any. */
var getMyBan_createServerFn_handler = createServerRpc({
	id: "46773b702b5df0d0de828e53c78af92c5d53b13874b48b74eb9de886ae8ee93b",
	name: "getMyBan",
	filename: "src/lib/bans.functions.ts"
}, (opts) => getMyBan.__executeServer(opts));
var getMyBan = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyBan_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("user_bans").select("id, reason, expires_at, created_at").eq("user_id", context.userId).is("lifted_at", null).order("created_at", { ascending: false }).limit(5);
	if (error) return null;
	const now = Date.now();
	return (data ?? []).find((b) => b.expires_at === null || new Date(b.expires_at).getTime() > now) ?? null;
});
var getUserBan_createServerFn_handler = createServerRpc({
	id: "9e29dc1c8941d002433125c84231d5e6a481f588b0cec293dc1e9131b0c8d719",
	name: "getUserBan",
	filename: "src/lib/bans.functions.ts"
}, (opts) => getUserBan.__executeServer(opts));
var getUserBan = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ user_id: stringType().uuid() }).parse(d)).handler(getUserBan_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const { data: rows } = await context.supabase.from("user_bans").select("id, reason, expires_at, created_at").eq("user_id", data.user_id).is("lifted_at", null).order("created_at", { ascending: false }).limit(5);
	const now = Date.now();
	return (rows ?? []).find((b) => b.expires_at === null || new Date(b.expires_at).getTime() > now) ?? null;
});
var banUser_createServerFn_handler = createServerRpc({
	id: "097e44e1f3f962a9431b7a50245267024942699de85719c2af21bbf2ab9d1fb7",
	name: "banUser",
	filename: "src/lib/bans.functions.ts"
}, (opts) => banUser.__executeServer(opts));
var banUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	user_id: stringType().uuid(),
	reason: stringType().trim().min(3).max(500),
	days: numberType().int().min(1).max(3650).nullable()
}).parse(d)).handler(banUser_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	if (data.user_id === context.userId) throw new Error("You cannot ban yourself");
	const { data: targetAdmin } = await context.supabase.from("user_roles").select("role").eq("user_id", data.user_id).eq("role", "admin").maybeSingle();
	if (targetAdmin) throw new Error("Moderators cannot be banned");
	const expires_at = data.days === null ? null : new Date(Date.now() + data.days * 864e5).toISOString();
	const { error } = await context.supabase.from("user_bans").insert({
		user_id: data.user_id,
		banned_by: context.userId,
		reason: data.reason,
		expires_at
	});
	if (error) throw new Error(error.message);
	return {
		ok: true,
		expires_at
	};
});
var liftBan_createServerFn_handler = createServerRpc({
	id: "728ec7c9132304e9db4b92069085292f3ad24fbc3dc32b252645999546bc7813",
	name: "liftBan",
	filename: "src/lib/bans.functions.ts"
}, (opts) => liftBan.__executeServer(opts));
var liftBan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ user_id: stringType().uuid() }).parse(d)).handler(liftBan_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const { error } = await context.supabase.from("user_bans").update({ lifted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("user_id", data.user_id).is("lifted_at", null);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { banUser_createServerFn_handler, getMyBan_createServerFn_handler, getUserBan_createServerFn_handler, liftBan_createServerFn_handler };
