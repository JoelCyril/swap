import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn } from "./db-types-Dz-qEZef.mjs";
import { G as Bookmark } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as listFavourites } from "./flags2.functions-CKoPdqok.mjs";
import { t as ListingCard } from "./ListingCard-CtV3JMQc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/favourites-DFeh2kcf.js
var import_jsx_runtime = require_jsx_runtime();
function SavedPage() {
	const fn = useServerFn(listFavourites);
	const { data } = useQuery({
		queryKey: ["favourites"],
		queryFn: () => fn()
	});
	const saved = data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1200px] flex-1 px-6 py-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "h-5 w-5 fill-current" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl font-black",
						children: "Saved"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground text-sm",
						children: "Listings you've saved for later."
					})] })]
				}), saved.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground",
					children: ["Nothing saved yet — tap the bookmark on any listing.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/listings",
						className: "mt-3 block text-sm font-bold text-primary hover:underline",
						children: "Browse listings →"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3",
					children: saved.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, {
						listing: l,
						initiallyFavourited: true
					}, l.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { SavedPage as component };
