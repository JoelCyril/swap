import { r as __toESM } from "../_runtime.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, l as handle } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { H as ChevronLeft, M as Info, V as ChevronRight, Y as ArrowRightLeft } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { i as getPublicItem, r as getMyItem } from "./items2.functions-ABkE3FIJ.mjs";
import { t as Route } from "./items._id-D1dQdoPK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/items._id-YMFsGMuT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ItemPage() {
	const { id } = Route.useParams();
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [photo, setPhoto] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
	}, []);
	const pubFn = useServerFn(getPublicItem);
	const mineFn = useServerFn(getMyItem);
	const { data: pub, isLoading } = useQuery({
		queryKey: ["item-public", id],
		queryFn: () => pubFn({ data: { id } })
	});
	const { data: mine } = useQuery({
		queryKey: [
			"item-mine",
			id,
			userId
		],
		queryFn: () => mineFn({ data: { id } }),
		enabled: !!userId
	});
	const item = mine ?? pub;
	const isOwner = !!item && !!userId && item.owner_id === userId;
	if (isLoading && !item) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 p-10 text-center text-muted-foreground",
				children: "Loading…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (!item) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 p-10 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-black",
					children: "Item not found"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "It may be private or has been removed."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	const photos = item.image_urls ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-[1000px] flex-1 px-6 py-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl border-2 border-primary/20 bg-primary-soft text-8xl shadow-card",
							children: [photos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: photos[photo],
								alt: item.name,
								className: "absolute inset-0 h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								children: item.image_emoji
							}), photos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setPhoto((p) => (p - 1 + photos.length) % photos.length),
								className: "absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70",
								"aria-label": "Previous photo",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setPhoto((p) => (p + 1) % photos.length),
								className: "absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70",
								"aria-label": "Next photo",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5" })
							})] })]
						}),
						photos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex gap-2 overflow-x-auto",
							children: photos.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setPhoto(i),
								className: `h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === photo ? "border-primary" : "border-primary/20"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: u,
									alt: `Photo ${i + 1}`,
									className: "h-full w-full object-cover"
								})
							}, u))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-6 font-display text-3xl font-black",
							children: item.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								item.category,
								" · ",
								item.condition
							]
						}),
						item.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 whitespace-pre-wrap text-sm",
							children: item.description
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "space-y-4",
						children: [
							item.owner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/profile/$username",
								params: { username: item.owner.username },
								className: "flex items-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-4 transition hover:border-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white",
									style: { backgroundColor: item.owner.avatar_url ? "transparent" : item.owner.avatar_color },
									children: item.owner.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: item.owner.avatar_url,
										alt: "",
										className: "h-full w-full object-cover"
									}) : item.owner.display_name?.[0]?.toUpperCase()
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate font-bold",
										children: handle(item.owner)
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-card p-4 text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Inventory items aren't tradeable here. Swaps happen on listings in Browse." })]
							}),
							isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/new-listing",
									search: { fromItem: item.id },
									className: "flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "h-3.5 w-3.5" }), " List this to swap"]
								})
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { ItemPage as component };
