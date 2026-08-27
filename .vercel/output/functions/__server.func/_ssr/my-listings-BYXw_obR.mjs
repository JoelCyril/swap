import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as gradientForId, d as useServerFn, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { b as Pencil, o as Trash2, y as Plus } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as deleteListing, s as listMyListings } from "./listings.functions-T0r7f8kn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/my-listings-BYXw_obR.js
var import_jsx_runtime = require_jsx_runtime();
var STATUS_COLORS = {
	active: "bg-green-100 text-green-800",
	reserved: "bg-yellow-100 text-yellow-800",
	completed: "bg-blue-100 text-blue-800",
	removed: "bg-gray-100 text-gray-700"
};
function MyListingsPage() {
	const qc = useQueryClient();
	const fn = useServerFn(listMyListings);
	const del = useServerFn(deleteListing);
	const delMut = useMutation({
		mutationFn: (id) => del({ data: { id } }),
		onSuccess: () => {
			toast.success("Listing deleted");
			qc.invalidateQueries({ queryKey: ["my-listings"] });
			qc.invalidateQueries({ queryKey: ["listings"] });
			qc.invalidateQueries({ queryKey: ["favourites"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete listing")
	});
	const { data: listings, isLoading } = useQuery({
		queryKey: ["my-listings"],
		queryFn: () => fn()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1000px] flex-1 px-4 py-6 sm:px-6 sm:py-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-2xl font-black sm:text-4xl",
							children: "My listings"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground sm:text-base",
							children: "All your listings which are up and running."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/new-listing",
						className: "inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow sm:px-5 sm:text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " New listing"]
					})]
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 text-sm text-muted-foreground",
					children: "Loading…"
				}) : !listings || listings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-6 text-center sm:p-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "You haven't posted anything yet."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/new-listing",
						className: "mt-3 inline-block text-sm font-bold text-primary hover:underline",
						children: "Create your first listing →"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-3",
					children: listings.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border-2 border-primary/20 bg-card p-3 transition hover:border-primary hover:shadow-card sm:flex sm:items-center sm:gap-4 sm:p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/listings/$id",
								params: { id: l.id },
								className: `grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradientForId(l.id)} text-2xl sm:h-16 sm:w-16 sm:text-3xl`,
								children: l.image_urls?.[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: l.image_urls[0],
									alt: l.title,
									className: "h-full w-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": true,
									children: l.image_emoji
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/listings/$id",
										params: { id: l.id },
										className: "block truncate font-display text-base font-bold hover:text-primary sm:text-lg",
										children: l.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate text-xs text-muted-foreground",
										children: [
											l.category,
											" · ",
											l.location,
											" · ",
											timeAgo(l.created_at)
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex flex-wrap items-center gap-2 sm:hidden",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[l.status] ?? "bg-muted"}`,
												children: l.status
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/edit-listing/$id",
												params: { id: l.id },
												className: "inline-flex items-center gap-1 rounded-full border-2 border-primary/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3 w-3" }), " Edit"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													if (window.confirm(`Delete "${l.title}"? This can't be undone.`)) delMut.mutate(l.id);
												},
												disabled: delMut.isPending,
												className: "inline-flex items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:opacity-50",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" }), " Delete"]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-block ${STATUS_COLORS[l.status] ?? "bg-muted"}`,
								children: l.status
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/edit-listing/$id",
								params: { id: l.id },
								className: "hidden shrink-0 items-center gap-1 rounded-full border-2 border-primary/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft sm:inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3 w-3" }), " Edit"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									if (window.confirm(`Delete "${l.title}"? This can't be undone.`)) delMut.mutate(l.id);
								},
								disabled: delMut.isPending,
								className: "hidden shrink-0 items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:opacity-50 sm:inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" }), " Delete"]
							})
						]
					}, l.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { MyListingsPage as component };
