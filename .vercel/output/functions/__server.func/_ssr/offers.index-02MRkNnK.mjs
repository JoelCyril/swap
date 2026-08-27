import { r as __toESM } from "../_runtime.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { c as gradientForId, d as useServerFn, l as handle, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { J as ArrowRight, t as X } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { a as listMyOffers } from "./offers.functions-DTjDoLub.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers.index-02MRkNnK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_COLORS = {
	pending: "bg-yellow-100 text-yellow-800",
	accepted: "bg-green-100 text-green-800",
	declined: "bg-red-100 text-red-800",
	withdrawn: "bg-gray-100 text-gray-700",
	completed: "bg-blue-100 text-blue-800"
};
var CLEARED_KEY = "swap.clearedOffers";
function useClearedOffers() {
	const [cleared, setCleared] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(CLEARED_KEY);
			if (raw) setCleared(JSON.parse(raw));
		} catch {}
	}, []);
	function clear(id) {
		setCleared((prev) => {
			const next = Array.from(/* @__PURE__ */ new Set([...prev, id]));
			try {
				localStorage.setItem(CLEARED_KEY, JSON.stringify(next));
			} catch {}
			return next;
		});
	}
	function reset() {
		setCleared([]);
		try {
			localStorage.removeItem(CLEARED_KEY);
		} catch {}
	}
	return {
		cleared,
		clear,
		reset
	};
}
function OffersPage() {
	const fn = useServerFn(listMyOffers);
	const { data } = useQuery({
		queryKey: ["offers"],
		queryFn: () => fn()
	});
	const { cleared, clear, reset } = useClearedOffers();
	const myId = data?.viewer_id ?? null;
	const offers = (data?.offers ?? []).filter((o) => !cleared.includes(o.id));
	const incoming = offers.filter((o) => o.to_user === myId);
	const outgoing = offers.filter((o) => o.from_user === myId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10 space-y-8 sm:space-y-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl font-black sm:text-4xl",
								children: "Offers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground sm:text-base",
								children: "All incoming and outgoing swap requests."
							}),
							cleared.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: reset,
								className: "mt-3 text-xs font-bold uppercase tracking-wider text-primary hover:underline",
								children: [
									"Show ",
									cleared.length,
									" cleared offer",
									cleared.length === 1 ? "" : "s"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-display text-lg font-black mb-4 sm:text-2xl",
							children: [
								"Incoming (",
								incoming.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferList, {
							offers: incoming,
							incoming: true,
							onClear: clear
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-display text-lg font-black mb-4 sm:text-2xl",
							children: [
								"Outgoing (",
								outgoing.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferList, {
							offers: outgoing,
							onClear: clear
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function OfferList({ offers, incoming = false, onClear }) {
	if (offers.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-8 text-center text-muted-foreground text-sm",
		children: incoming ? "No incoming offers yet." : "You haven't made any offers yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3",
		children: offers.map((o) => {
			const other = incoming ? o.from_profile : o.to_profile;
			const listing = o.listing ?? null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/offers/$id",
					params: { id: o.id },
					className: "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-3 hover:border-primary hover:shadow-card transition sm:flex sm:gap-4 sm:p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(listing?.id ?? o.id)} text-2xl sm:h-16 sm:w-16 sm:text-3xl`,
							children: listing?.image_emoji ?? "📦"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-base font-bold truncate sm:text-lg",
									children: listing?.title ?? "Listing unavailable"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground truncate",
									children: [
										incoming ? "From" : "To",
										" ",
										handle(other),
										" · ",
										timeAgo(o.created_at)
									]
								}),
								o.message && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-foreground/70 truncate",
									children: [
										"\"",
										o.message,
										"\""
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:hidden ${STATUS_COLORS[o.status] ?? "bg-muted"}`,
									children: o.status
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-block ${STATUS_COLORS[o.status] ?? "bg-muted"}`,
							children: o.status
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onClear(o.id),
					"aria-label": "Clear this offer from the list",
					title: "Clear from list",
					className: "absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-primary/20 bg-card text-muted-foreground transition hover:border-destructive/40 hover:text-destructive",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
				})]
			}, o.id);
		})
	});
}
//#endregion
export { OffersPage as component };
