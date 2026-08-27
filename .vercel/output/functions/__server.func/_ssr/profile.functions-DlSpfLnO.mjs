import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { i as literalType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as ensureProfile } from "./profile.server-B3hjrzIK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile.functions-DlSpfLnO.js
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
var getMyProfile_createServerFn_handler = createServerRpc({
	id: "5dbf46616266e7bfe81c82694a91090a42de6200b3efc1b9d156faf41ac3a479",
	name: "getMyProfile",
	filename: "src/lib/profile.functions.ts"
}, (opts) => getMyProfile.__executeServer(opts));
var getMyProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyProfile_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
	if (error) throw new Error(error.message);
	const profile = data ?? await ensureProfile(context.userId);
	const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
	const { data: privateInfo } = await context.supabase.from("profile_private").select("full_name, birthday").eq("id", context.userId).maybeSingle();
	return {
		profile,
		private: privateInfo ?? {
			full_name: null,
			birthday: null
		},
		roles: (roles ?? []).map((r) => r.role)
	};
});
var updateMyProfile_createServerFn_handler = createServerRpc({
	id: "af00eb763dce352dc2f42ef901ef426a138feb40fdc7f79166552837a77fae5f",
	name: "updateMyProfile",
	filename: "src/lib/profile.functions.ts"
}, (opts) => updateMyProfile.__executeServer(opts));
var updateMyProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	username: stringType().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores").optional(),
	display_name: stringType().min(1).max(80).optional(),
	full_name: stringType().max(120).optional().nullable(),
	birthday: stringType().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
	emirate: stringType().max(40).optional().nullable(),
	location: stringType().max(120).optional().nullable(),
	bio: stringType().max(500).optional().nullable(),
	avatar_color: stringType().max(60).optional(),
	avatar_url: stringType().url().max(2048).optional().nullable(),
	banner_url: stringType().url().max(2048).optional().nullable(),
	inventory_default_visibility: enumType(["public", "private"]).optional()
}).parse(d)).handler(updateMyProfile_createServerFn_handler, async ({ data, context }) => {
	const { full_name, birthday, username, ...rest } = data;
	const publicFields = { ...rest };
	if (username) {
		const uname = username.toLowerCase();
		const { data: rows } = await context.supabase.from("profiles").select("id").ilike("username", uname).limit(1);
		const taken = (rows ?? [])[0];
		if (taken && taken.id !== context.userId) throw new Error("That username is already taken — pick another one.");
		publicFields.username = uname;
		publicFields.display_name = uname;
	}
	if (Object.keys(publicFields).length > 0) {
		const { error } = await context.supabase.from("profiles").update(publicFields).eq("id", context.userId);
		if (error) throw new Error(error.message.includes("duplicate") ? "That username is already taken — pick another one." : error.message);
	}
	if (full_name !== void 0 || birthday !== void 0) {
		const patch = { id: context.userId };
		if (full_name !== void 0) patch.full_name = full_name;
		if (birthday !== void 0) patch.birthday = birthday;
		const { error } = await context.supabase.from("profile_private").upsert(patch, { onConflict: "id" });
		if (error) throw new Error(error.message);
	}
	return { ok: true };
});
var searchProfiles_createServerFn_handler = createServerRpc({
	id: "41c2658cb728e60fb97f1736fa405f98fa2efe2d2cf6241836e7e6c547df2711",
	name: "searchProfiles",
	filename: "src/lib/profile.functions.ts"
}, (opts) => searchProfiles.__executeServer(opts));
var searchProfiles = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ q: stringType().min(1).max(80) }).parse(d)).handler(searchProfiles_createServerFn_handler, async ({ data }) => {
	const supabase = publicClient();
	const term = data.q.replace(/[%,()]/g, "");
	if (!term) return [];
	const { data: rows, error } = await supabase.from("profiles").select("id, username, display_name, avatar_color, avatar_url, location").or(`username.ilike.%${term}%,display_name.ilike.%${term}%`).limit(8);
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var getPublicProfile_createServerFn_handler = createServerRpc({
	id: "4bf0d871c1b1448bf83ecae994053dfefc9592abecd0f940b98c0f46242944f0",
	name: "getPublicProfile",
	filename: "src/lib/profile.functions.ts"
}, (opts) => getPublicProfile.__executeServer(opts));
var getPublicProfile = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ username: stringType().max(80) }).parse(d)).handler(getPublicProfile_createServerFn_handler, async ({ data }) => {
	const supabase = publicClient();
	const { data: profile } = await supabase.from("profiles").select("id, username, display_name, avatar_color, avatar_url, banner_url, location, bio, created_at").eq("username", data.username).maybeSingle();
	if (!profile) return {
		profile: null,
		isAdmin: false,
		items: []
	};
	const { data: adminRow } = await supabase.from("user_roles").select("role").eq("user_id", profile.id).eq("role", "admin").maybeSingle();
	const { data: items } = await supabase.from("items").select("id, name, category, condition, image_emoji, image_urls, description").eq("owner_id", profile.id).eq("visibility", "public").order("created_at", { ascending: false }).limit(24);
	return {
		profile,
		isAdmin: !!adminRow,
		items: items ?? []
	};
});
var deleteMyAccount_createServerFn_handler = createServerRpc({
	id: "bffc6a45c963bea429a809fecd2b561dfb936da39f654d35165b0702b257c9c2",
	name: "deleteMyAccount",
	filename: "src/lib/profile.functions.ts"
}, (opts) => deleteMyAccount.__executeServer(opts));
var deleteMyAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ confirm: literalType("DELETE") }).parse(d)).handler(deleteMyAccount_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-B-2s9oPC.mjs");
	await supabaseAdmin.from("listings").delete().eq("owner_id", context.userId);
	await supabaseAdmin.from("items").delete().eq("owner_id", context.userId);
	const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
//#endregion
export { deleteMyAccount_createServerFn_handler, getMyProfile_createServerFn_handler, getPublicProfile_createServerFn_handler, searchProfiles_createServerFn_handler, updateMyProfile_createServerFn_handler };
