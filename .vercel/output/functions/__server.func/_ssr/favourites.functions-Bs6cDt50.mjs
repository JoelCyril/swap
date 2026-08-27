import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/favourites.functions-Bs6cDt50.js
var listFavourites_createServerFn_handler = createServerRpc({
	id: "555a6c50a007a36232ce8e34bb33b6240e28ed5e3ad99871a7efb4c777e8ee2f",
	name: "listFavourites",
	filename: "src/lib/favourites.functions.ts"
}, (opts) => listFavourites.__executeServer(opts));
var listFavourites = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listFavourites_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("favourites").select("listing_id, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*))").eq("user_id", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return (data ?? []).map((r) => r.listing).filter((l) => !!l && l.status !== "removed");
});
var toggleFavourite_createServerFn_handler = createServerRpc({
	id: "471db9717c925a0be6ff54d89b61f9a17056ef49c2b35add6841795b08c1e029",
	name: "toggleFavourite",
	filename: "src/lib/favourites.functions.ts"
}, (opts) => toggleFavourite.__executeServer(opts));
var toggleFavourite = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ listing_id: stringType().uuid() }).parse(d)).handler(toggleFavourite_createServerFn_handler, async ({ data, context }) => {
	const { data: listing } = await context.supabase.from("listings").select("owner_id, title").eq("id", data.listing_id).maybeSingle();
	if (!listing) throw new Error("That listing no longer exists");
	if (listing.owner_id === context.userId) throw new Error("You can't save your own listing");
	const { data: existing } = await context.supabase.from("favourites").select("listing_id").eq("user_id", context.userId).eq("listing_id", data.listing_id).maybeSingle();
	if (existing) {
		await context.supabase.from("favourites").delete().eq("user_id", context.userId).eq("listing_id", data.listing_id);
		return { favourited: false };
	}
	await context.supabase.from("favourites").insert({
		user_id: context.userId,
		listing_id: data.listing_id
	});
	const { data: me } = await context.supabase.from("profiles").select("username").eq("id", context.userId).maybeSingle();
	const { notifyUser } = await import("./notifications.server-CwIB500t.mjs");
	await notifyUser({
		userId: listing.owner_id,
		type: "save",
		title: "Someone saved your listing",
		body: `@${me?.username ?? "A user"} saved "${listing.title}"`,
		link: `/listings/${data.listing_id}`
	});
	return { favourited: true };
});
var listMyFavouriteIds_createServerFn_handler = createServerRpc({
	id: "3d09b0b32ae23c5a17d38044f5776dd04916708659eefd3cc908acc5f39dfa1f",
	name: "listMyFavouriteIds",
	filename: "src/lib/favourites.functions.ts"
}, (opts) => listMyFavouriteIds.__executeServer(opts));
var listMyFavouriteIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMyFavouriteIds_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.from("favourites").select("listing_id").eq("user_id", context.userId);
	return (data ?? []).map((r) => r.listing_id);
});
//#endregion
export { listFavourites_createServerFn_handler, listMyFavouriteIds_createServerFn_handler, toggleFavourite_createServerFn_handler };
