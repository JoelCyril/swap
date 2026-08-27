import { r as __toESM } from "../_runtime.mjs";
import { M as isRedirect, S as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-DH5CO1qB.mjs";
import { o as require_react } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/db-types-Dz-qEZef.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var CATEGORIES = [
	"Electronics",
	"Household Items",
	"Clothing",
	"Outdoors",
	"Accessories",
	"Books",
	"Toys",
	"Sports"
];
var CONDITIONS = [
	"New",
	"Like New",
	"Good",
	"Fair"
];
var NEIGHBOURHOODS = [
	"Downtown Abu Dhabi",
	"Al Reem Island",
	"Yas Island",
	"Al Raha",
	"Khalifa City",
	"Corniche",
	"Al Bateen",
	"Saadiyat Island",
	"Downtown Dubai",
	"Dubai Marina",
	"JBR",
	"Palm Jumeirah",
	"Business Bay",
	"Sharjah Al Majaz"
];
var OTHER_LOCATION = "Other";
var EMIRATES = [
	"Abu Dhabi",
	"Dubai",
	"Sharjah",
	"Ajman",
	"Umm Al Quwain",
	"Ras Al Khaimah",
	"Fujairah"
];
/** Best-effort mapping of a free-text location to its emirate. */
function emirateOf(location) {
	const l = (location ?? "").toLowerCase();
	if (!l) return null;
	for (const [emirate, keys] of [
		["Abu Dhabi", [
			"abu dhabi",
			"reem",
			"yas island",
			"al raha",
			"khalifa city",
			"corniche",
			"bateen",
			"saadiyat",
			"mussafah",
			"al ain",
			"shakhbout",
			"ruwais",
			"masdar"
		]],
		["Dubai", [
			"dubai",
			"jbr",
			"marina",
			"palm jumeirah",
			"jumeirah",
			"business bay",
			"deira",
			"bur dubai",
			"jlt",
			"silicon oasis",
			"mirdif",
			"barsha",
			"tecom",
			"motor city",
			"arabian ranches",
			"damac",
			"jvc"
		]],
		["Sharjah", [
			"sharjah",
			"majaz",
			"muwaileh",
			"nahda",
			"khan",
			"qasimia",
			"kalba",
			"khor fakkan"
		]],
		["Ajman", [
			"ajman",
			"nuaimiya",
			"rashidiya"
		]],
		["Umm Al Quwain", [
			"umm al quwain",
			"umm al quwayn",
			"uaq"
		]],
		["Ras Al Khaimah", [
			"ras al khaimah",
			"rak ",
			"al hamra",
			"mina al arab"
		]],
		["Fujairah", ["fujairah", "dibba"]]
	]) if (keys.some((k) => l.includes(k))) return emirate;
	return null;
}
var gradients = [
	"from-orange-200 via-orange-100 to-amber-50",
	"from-amber-200 via-orange-100 to-rose-50",
	"from-orange-300 via-amber-200 to-yellow-100",
	"from-rose-200 via-orange-100 to-amber-100",
	"from-yellow-200 via-orange-200 to-orange-100",
	"from-orange-100 via-rose-100 to-amber-100"
];
var gradientForId = (id) => gradients[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % gradients.length];
function timeAgo(iso) {
	const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1e3);
	if (s < 60) return `${s}s ago`;
	if (s < 3600) return `${Math.floor(s / 60)}m ago`;
	if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
	return `${Math.floor(s / 86400)}d ago`;
}
/** Display handle for a user: their chosen username, prefixed with "@". */
function handle(owner) {
	const name = owner?.username?.trim() || owner?.display_name?.trim();
	return name ? `@${name.replace(/^@/, "")}` : "@user";
}
//#endregion
export { OTHER_LOCATION as a, gradientForId as c, useServerFn as d, NEIGHBOURHOODS as i, handle as l, CONDITIONS as n, createSsrRpc as o, EMIRATES as r, emirateOf as s, CATEGORIES as t, timeAgo as u };
