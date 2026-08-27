import { r as __toESM } from "../_runtime.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, n as CONDITIONS, r as EMIRATES, s as emirateOf, t as CATEGORIES, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { A as LifeBuoy, _ as RotateCcw, c as SlidersHorizontal, t as X, y as Plus } from "../_libs/lucide-react.mjs";
import { f as searchProfiles, n as Navbar, o as getMyProfile, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { a as listListings } from "./listings.functions-T0r7f8kn.mjs";
import { i as listMyFlaggedListingIds, r as listMyFavouriteIds } from "./flags2.functions-CKoPdqok.mjs";
import { t as ListingCard } from "./ListingCard-CtV3JMQc.mjs";
import { t as listMyInquiries } from "./support.functions-BAa5Ojl2.mjs";
import { t as useBlockedIds } from "./use-blocks-BiwUxoCe.mjs";
import { t as Route } from "./listings.index--djcYRW4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings.index-BrwEFH-Y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CategoryBar({ active = "All", onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "bg-gradient-to-r from-primary/95 via-primary to-primary-glow text-primary-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			children: ["All", ...CATEGORIES].map((cat) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onChange?.(cat),
					className: `shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${cat === active ? "bg-white text-primary shadow-md scale-105" : "bg-white/10 hover:bg-white/25"}`,
					children: cat
				}, cat);
			})
		})
	});
}
/**
* Small corner widget showing the signed-in member's support inquiries and any
* moderator replies. Hidden entirely when they have never sent one.
*/
function InquiryUpdates({ signedIn, placement = "floating" }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [hasSession, setHasSession] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let alive = true;
		supabase.auth.getSession().then(({ data }) => {
			if (alive) setHasSession(Boolean(data.session?.access_token));
		});
		return () => {
			alive = false;
		};
	}, [signedIn]);
	const fn = useServerFn(listMyInquiries);
	const { data } = useQuery({
		queryKey: ["my-inquiries"],
		queryFn: () => fn(),
		enabled: signedIn && hasSession,
		retry: false,
		refetchInterval: 6e4
	});
	const items = data ?? [];
	if (!signedIn) return null;
	const replies = items.filter((i) => i.reply).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: placement === "floating" ? "fixed bottom-4 right-4 z-40 print:hidden" : "mt-4 print:hidden",
		children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${placement === "sidebar" ? "w-full" : "w-[min(340px,calc(100vw-2rem))]"} overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-card-hover`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "inline-flex items-center gap-2 font-display text-sm font-black",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-4 w-4 text-primary" }), " Inquiry updates"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setOpen(false),
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-72 space-y-3 overflow-y-auto p-4",
				children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "You haven't sent any inquiries yet. Send one from the Help page and moderator replies will show up here."
				}), items.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-muted p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold",
							children: i.subject
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 text-[11px] text-muted-foreground",
							children: ["Sent ", timeAgo(i.created_at)]
						}),
						i.reply ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 rounded-xl bg-primary-soft p-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-black uppercase tracking-wider text-primary",
								children: "Moderator reply"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 whitespace-pre-wrap text-xs",
								children: i.reply
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[11px] italic text-muted-foreground",
							children: "Waiting for a reply…"
						})
					]
				}, i.id))]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen(true),
			className: "inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-card px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary shadow-card transition hover:shadow-card-hover",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-4 w-4" }),
				" Inquiry updates",
				replies > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-5 min-w-5 place-items-center rounded-full bg-gradient-primary px-1 text-[10px] text-primary-foreground",
					children: replies
				})
			]
		})
	});
}
var SORTS = [
	{
		key: "shuffle",
		label: "Shuffled"
	},
	{
		key: "newest",
		label: "Newest first"
	},
	{
		key: "oldest",
		label: "Oldest first"
	},
	{
		key: "nearest",
		label: "Nearest to me"
	}
];
function FilterSidebar(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "hidden lg:block w-64 shrink-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-40 flex flex-col gap-4 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPanel, { ...props })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InquiryUpdates, {
			signedIn: props.signedIn,
			placement: "sidebar"
		})]
	});
}
function MobileFilters(props) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lg:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen(true),
			className: "inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-card py-3 text-xs font-black uppercase tracking-wider text-primary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "h-4 w-4" }), " Filters & sort"]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-end bg-black/50",
			onClick: () => setOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8",
				onClick: (e) => e.stopPropagation(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPanel, { ...props }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOpen(false),
						className: "rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase tracking-wider text-primary",
						children: "Done"
					})]
				})
			})
		})]
	});
}
function FilterPanel({ conditions, onToggleCondition, emirate, onEmirate, sort, onSort, onReset }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 border-b border-border pb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display font-bold",
				children: "Filters"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
			className: "mb-2 text-xs font-black uppercase tracking-wider text-primary",
			children: "Condition"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2",
			children: CONDITIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm cursor-pointer group",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: conditions.includes(c),
					onChange: () => onToggleCondition(c),
					className: "h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary accent-primary"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "group-hover:text-primary transition",
					children: c
				})]
			}, c))
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
			className: "mb-2 text-xs font-black uppercase tracking-wider text-primary",
			children: "Emirate"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			value: emirate,
			onChange: (e) => onEmirate(e.target.value),
			className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: "All emirates"
			}), EMIRATES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: n,
				children: n
			}, n))]
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
			className: "mb-2 text-xs font-black uppercase tracking-wider text-primary",
			children: "Sort by"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-1.5",
			children: SORTS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm cursor-pointer",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "radio",
					name: "sort",
					checked: sort === s.key,
					onChange: () => onSort(s.key),
					className: "h-4 w-4 accent-primary"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.label })]
			}, s.key))
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onReset,
			className: "mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3.5 w-3.5" }), " Reset filters"]
		})
	] });
}
function ListingsPage() {
	const { q } = Route.useSearch();
	const [active, setActive] = (0, import_react.useState)("All");
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [hidden, setHidden] = (0, import_react.useState)([]);
	const [conditions, setConditions] = (0, import_react.useState)([]);
	const [emirate, setEmirate] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)("shuffle");
	const [seed] = (0, import_react.useState)(() => Math.random());
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
		return () => sub.subscription.unsubscribe();
	}, []);
	const signedIn = !!userId;
	const fn = useServerFn(listListings);
	const savedFn = useServerFn(listMyFavouriteIds);
	const flaggedFn = useServerFn(listMyFlaggedListingIds);
	const peopleFn = useServerFn(searchProfiles);
	const meFn = useServerFn(getMyProfile);
	const { data, isLoading } = useQuery({
		queryKey: ["listings", active],
		queryFn: () => fn({ data: { category: active === "All" ? null : active } })
	});
	const { data: savedIds } = useQuery({
		queryKey: ["my-fav-ids", userId],
		queryFn: () => savedFn(),
		enabled: signedIn
	});
	const { data: flaggedIds } = useQuery({
		queryKey: ["flagged-ids", userId],
		queryFn: () => flaggedFn(),
		enabled: signedIn
	});
	const { data: me } = useQuery({
		queryKey: ["me", userId],
		queryFn: () => meFn(),
		enabled: signedIn
	});
	const { data: people } = useQuery({
		queryKey: ["people", q],
		queryFn: () => peopleFn({ data: { q } }),
		enabled: !!q
	});
	const blockedIds = useBlockedIds();
	const myLocation = me?.profile?.location ?? null;
	const term = (q ?? "").toLowerCase().trim();
	const excluded = /* @__PURE__ */ new Set([...flaggedIds ?? [], ...hidden]);
	const listings = (data ?? []).filter((l) => l.owner_id !== userId).filter((l) => !blockedIds.has(l.owner_id)).filter((l) => !excluded.has(l.id)).filter((l) => conditions.length === 0 || conditions.includes(l.condition)).filter((l) => !emirate || l.emirate === emirate || !l.emirate && emirateOf(l.location) === emirate).filter((l) => !term ? true : [
		l.title,
		l.description,
		l.looking_for,
		l.category,
		l.location,
		l.owner?.username,
		l.owner?.display_name
	].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))).sort((a, b) => {
		if (sort === "shuffle") {
			const hash = (id) => Math.abs(Math.sin([...id].reduce((s, c) => s + c.charCodeAt(0), 0) * (seed + 1)));
			return hash(a.id) - hash(b.id);
		}
		if (sort === "nearest" && myLocation) {
			const rank = (l) => l.location === myLocation ? 0 : 1;
			const diff = rank(a) - rank(b);
			if (diff !== 0) return diff;
		}
		const at = new Date(a.created_at).getTime();
		const bt = new Date(b.created_at).getTime();
		return sort === "oldest" ? at - bt : bt - at;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryBar, {
				active,
				onChange: setActive
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 py-8 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSidebar, {
					conditions,
					onToggleCondition: (c) => setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]),
					emirate,
					onEmirate: setEmirate,
					signedIn,
					sort,
					onSort: setSort,
					onReset: () => {
						setConditions([]);
						setEmirate("");
						setSort("shuffle");
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "flex-1 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-w-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-2xl font-black sm:text-3xl",
									children: q ? `Results for “${q}”` : active === "All" ? "All listings" : active
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: signedIn ? "/new-listing" : "/auth",
								className: "inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 sm:px-6 sm:text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " List an item"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileFilters, {
								conditions,
								onToggleCondition: (c) => setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]),
								emirate,
								onEmirate: setEmirate,
								signedIn,
								sort,
								onSort: setSort,
								onReset: () => {
									setConditions([]);
									setEmirate("");
									setSort("shuffle");
								}
							})
						}),
						q && (people ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground",
								children: "People"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: (people ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/profile/$username",
									params: { username: p.username },
									className: "flex items-center gap-2 rounded-full border-2 border-primary/20 bg-card px-3 py-2 text-sm transition hover:border-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-7 w-7 place-items-center overflow-hidden rounded-full text-[10px] font-black text-white",
										style: { backgroundColor: p.avatar_url ? "transparent" : p.avatar_color },
										children: p.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: p.avatar_url,
											alt: "",
											className: "h-full w-full object-cover"
										}) : p.username?.[0]?.toUpperCase()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold",
										children: ["@", p.username]
									})]
								}, p.id))
							})]
						}),
						isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground",
							children: "Loading listings…"
						}) : listings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: q ? "No listings match your search." : "Nothing here yet — be the first to list something."
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3",
							children: listings.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, {
								listing: l,
								initiallyFavourited: (savedIds ?? []).includes(l.id),
								onReported: (id) => setHidden((h) => [...h, id])
							}, l.id))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { ListingsPage as component };
