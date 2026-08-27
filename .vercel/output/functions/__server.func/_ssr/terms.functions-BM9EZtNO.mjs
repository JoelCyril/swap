import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { a as numberType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as ensureProfile } from "./profile.server-B3hjrzIK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/terms.functions-BM9EZtNO.js
/** Whether the signed-in user still needs to accept the terms. */
var getTermsStatus_createServerFn_handler = createServerRpc({
	id: "4aa9bbaa5018eef1f28011b2aeee2f27c6324281cc623b202e221907351127d6",
	name: "getTermsStatus",
	filename: "src/lib/terms.functions.ts"
}, (opts) => getTermsStatus.__executeServer(opts));
var getTermsStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getTermsStatus_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.from("profiles").select("tos_accepted_at, age_confirmed").eq("id", context.userId).maybeSingle();
	if (!data) {
		await ensureProfile(context.userId);
		return {
			accepted: false,
			age: null
		};
	}
	const row = data;
	return {
		accepted: Boolean(row.tos_accepted_at),
		age: row.age_confirmed ?? null
	};
});
var acceptTerms_createServerFn_handler = createServerRpc({
	id: "f7466595ead67a3609a9330ffbcb1f4eb5e8b72f76091b4f54bb99ac5c9bfcc3",
	name: "acceptTerms",
	filename: "src/lib/terms.functions.ts"
}, (opts) => acceptTerms.__executeServer(opts));
var acceptTerms = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	age: numberType().int().min(13).max(120),
	username: stringType().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores"),
	full_name: stringType().trim().max(120).optional().nullable(),
	birthday: stringType().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
	emirate: stringType().trim().max(40).optional().nullable(),
	location: stringType().trim().max(120).optional().nullable(),
	bio: stringType().trim().max(500).optional().nullable(),
	avatar_color: stringType().max(60).optional()
}).parse(d)).handler(acceptTerms_createServerFn_handler, async ({ data, context }) => {
	await ensureProfile(context.userId);
	const username = data.username.toLowerCase();
	const { data: taken } = await context.supabase.from("profiles").select("id").ilike("username", username).maybeSingle();
	if (taken && taken.id !== context.userId) throw new Error("That username is already taken — pick another one.");
	const { error } = await context.supabase.from("profiles").update({
		username,
		display_name: username,
		emirate: data.emirate || null,
		location: data.location || null,
		bio: data.bio || null,
		...data.avatar_color ? { avatar_color: data.avatar_color } : {},
		tos_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
		age_confirmed: data.age
	}).eq("id", context.userId);
	if (error) throw new Error(error.message.includes("duplicate") ? "That username is already taken — pick another one." : error.message);
	if (data.full_name || data.birthday) await context.supabase.from("profile_private").upsert({
		id: context.userId,
		full_name: data.full_name || null,
		birthday: data.birthday || null
	}, { onConflict: "id" });
	return { ok: true };
});
var checkUsername_createServerFn_handler = createServerRpc({
	id: "c4df7711fd95aa4b2a7c306329b740ae5e2f8d323b400c01ba9919726620bb29",
	name: "checkUsername",
	filename: "src/lib/terms.functions.ts"
}, (opts) => checkUsername.__executeServer(opts));
var checkUsername = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ username: stringType().trim().min(3).max(20) }).parse(d)).handler(checkUsername_createServerFn_handler, async ({ data, context }) => {
	const { data: rows } = await context.supabase.from("profiles").select("id").ilike("username", data.username.toLowerCase()).limit(1);
	const taken = (rows ?? [])[0];
	return { available: !taken || taken.id === context.userId };
});
//#endregion
export { acceptTerms_createServerFn_handler, checkUsername_createServerFn_handler, getTermsStatus_createServerFn_handler };
