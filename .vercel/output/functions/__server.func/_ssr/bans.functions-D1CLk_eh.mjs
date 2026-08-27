import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { a as numberType, o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bans.functions-D1CLk_eh.js
/** The signed-in user's active ban, if any. */
var getMyBan = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("46773b702b5df0d0de828e53c78af92c5d53b13874b48b74eb9de886ae8ee93b"));
/** Admin view of a user's active ban. */
var getUserBan = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ user_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("9e29dc1c8941d002433125c84231d5e6a481f588b0cec293dc1e9131b0c8d719"));
/** Ban a user for a number of days, or permanently when days is null. */
var banUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	user_id: stringType().uuid(),
	reason: stringType().trim().min(3).max(500),
	days: numberType().int().min(1).max(3650).nullable()
}).parse(d)).handler(createSsrRpc("097e44e1f3f962a9431b7a50245267024942699de85719c2af21bbf2ab9d1fb7"));
/** Lift every active ban on a user. */
var liftBan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ user_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("728ec7c9132304e9db4b92069085292f3ad24fbc3dc32b252645999546bc7813"));
//#endregion
export { liftBan as i, getMyBan as n, getUserBan as r, banUser as t };
