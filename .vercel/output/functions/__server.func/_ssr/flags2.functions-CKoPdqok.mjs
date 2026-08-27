import { r as __toESM } from "../_runtime.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/flags2.functions-CKoPdqok.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var listFavourites = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("555a6c50a007a36232ce8e34bb33b6240e28ed5e3ad99871a7efb4c777e8ee2f"));
var toggleFavourite = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ listing_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("471db9717c925a0be6ff54d89b61f9a17056ef49c2b35add6841795b08c1e029"));
var listMyFavouriteIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("3d09b0b32ae23c5a17d38044f5776dd04916708659eefd3cc908acc5f39dfa1f"));
function useSession() {
	const [session, setSession] = (0, import_react.useState)(null);
	const [user, setUser] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
			setSession(s);
			setUser(s?.user ?? null);
		});
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setUser(data.session?.user ?? null);
			setLoading(false);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	return {
		session,
		user,
		loading
	};
}
var SAVED_KEY = ["saved-ids"];
/** Shared, cached list of listing ids the signed-in user has saved. */
function useSavedIds() {
	const { user } = useSession();
	const fn = useServerFn(listMyFavouriteIds);
	const q = useQuery({
		queryKey: [...SAVED_KEY, user?.id ?? "anon"],
		queryFn: () => fn(),
		enabled: !!user,
		staleTime: 5 * 6e4,
		gcTime: 30 * 6e4,
		placeholderData: (prev) => prev,
		refetchOnMount: false,
		refetchOnWindowFocus: false
	});
	return {
		savedIds: q.data ?? [],
		isLoading: !!user && q.data === void 0,
		isSignedIn: !!user,
		userId: user?.id ?? null
	};
}
/** Toggle a listing's saved state with optimistic UI + cache invalidation. */
function useToggleSaved() {
	const qc = useQueryClient();
	const { user } = useSession();
	const fn = useServerFn(toggleFavourite);
	return useMutation({
		mutationFn: (listingId) => fn({ data: { listing_id: listingId } }),
		onMutate: async (listingId) => {
			const key = [...SAVED_KEY, user?.id ?? "anon"];
			await qc.cancelQueries({ queryKey: key });
			const prev = qc.getQueryData(key) ?? [];
			const next = prev.includes(listingId) ? prev.filter((i) => i !== listingId) : [...prev, listingId];
			qc.setQueryData(key, next);
			return {
				key,
				prev
			};
		},
		onError: (e, _v, ctx) => {
			if (ctx) qc.setQueryData(ctx.key, ctx.prev);
			toast.error(e instanceof Error ? e.message : "Could not update saved listings");
		},
		onSuccess: (res, listingId, ctx) => {
			if (ctx && res && typeof res === "object" && "favourited" in res) {
				const prev = qc.getQueryData(ctx.key) ?? [];
				const next = res.favourited ? Array.from(/* @__PURE__ */ new Set([...prev, listingId])) : prev.filter((i) => i !== listingId);
				qc.setQueryData(ctx.key, next);
			}
			qc.invalidateQueries({ queryKey: ["favourites"] });
		}
	});
}
var flagListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	listing_id: stringType().uuid(),
	reason: stringType().min(3).max(500)
}).parse(d)).handler(createSsrRpc("21d2794ae9c3ec96629a8f54cd91369e5fa3878e4223ce9317c4692e37a0d7f8"));
var listMyFlaggedListingIds = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("76f65f18065c713216f07570f65bf8e1f85c330cdfaf4d1d6ec1d40098ade353"));
//#endregion
export { useSavedIds as a, listMyFlaggedListingIds as i, listFavourites as n, useSession as o, listMyFavouriteIds as r, useToggleSaved as s, flagListing as t };
