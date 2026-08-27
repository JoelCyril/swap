import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { a as numberType, o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers._id-kjuyk3lR.js
/** Whether the signed-in user still needs to accept the terms. */
var getTermsStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("4aa9bbaa5018eef1f28011b2aeee2f27c6324281cc623b202e221907351127d6"));
var acceptTerms = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	age: numberType().int().min(13).max(120),
	username: stringType().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores"),
	full_name: stringType().trim().max(120).optional().nullable(),
	birthday: stringType().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
	emirate: stringType().trim().max(40).optional().nullable(),
	location: stringType().trim().max(120).optional().nullable(),
	bio: stringType().trim().max(500).optional().nullable(),
	avatar_color: stringType().max(60).optional()
}).parse(d)).handler(createSsrRpc("f7466595ead67a3609a9330ffbcb1f4eb5e8b72f76091b4f54bb99ac5c9bfcc3"));
/** Live availability check for the sign-up username step (case-insensitive). */
var checkUsername = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ username: stringType().trim().min(3).max(20) }).parse(d)).handler(createSsrRpc("c4df7711fd95aa4b2a7c306329b740ae5e2f8d323b400c01ba9919726620bb29"));
var $$splitComponentImporter = () => import("./offers._id-BCyV5V9K.mjs");
var Route = createFileRoute("/_authenticated/offers/$id")({
	head: () => ({ meta: [
		{ title: "Offer — SWAP" },
		{
			name: "description",
			content: "Chat about a swap and agree a meetup."
		},
		{
			property: "og:title",
			content: "Offer — SWAP"
		},
		{
			property: "og:description",
			content: "Chat and coordinate a swap."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { getTermsStatus as i, acceptTerms as n, checkUsername as r, Route as t };
