import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings.functions-CRzd-yIT.js
var getNotificationPrefs = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("a82687b107579164c1f08d3d70756e9e669fc1b592ad917529b37889dffef6c7"));
var updateNotificationPrefs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	announcements: booleanType().optional(),
	messages: booleanType().optional(),
	saves: booleanType().optional(),
	offers: booleanType().optional()
}).parse(d)).handler(createSsrRpc("159577df88bd5453de4cede9972e10f416a5166edb439cdb536890481867b1eb"));
/** Flip every inventory item (and the account default) to public/private. */
var setInventoryPrivacy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ private: booleanType() }).parse(d)).handler(createSsrRpc("a4f384d24e4f7313dfa6fe1292140260e96627f537e86cc71c51e808350b5e29"));
var listBlockedUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0ec0ed54df9e29e5be34647b1bd6fe0efdd91b65b16a9970bc42c77058eadd7c"));
/** Every user id that should be hidden from me (I blocked them, or they blocked me). */
var listBlockedIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("95f193883271e15b0351957b7722c2eb99af47d3be301c2f4a3b5800ab705ad0"));
var blockUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ username: stringType().trim().min(1).max(40) }).parse(d)).handler(createSsrRpc("65d51d3c1f1765060d763f15223a70601c7ccb0dd49c8a271c0b2e56b7bfa80b"));
var unblockUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ blocked_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("2435068c72b139610d2dc5bc7365df1186786ec561eb3aa49248a1c65fbd8150"));
//#endregion
export { setInventoryPrivacy as a, listBlockedUsers as i, getNotificationPrefs as n, unblockUser as o, listBlockedIds as r, updateNotificationPrefs as s, blockUser as t };
