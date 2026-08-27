import { r as __toESM } from "../_runtime.mjs";
import { _ as Link, v as require_react_dom, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as gradientForId, d as useServerFn, l as handle, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { F as Flag, G as Bookmark, Y as ArrowRightLeft, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useSavedIds, s as useToggleSaved, t as flagListing } from "./flags2.functions-CKoPdqok.mjs";
import { a as listMyItems } from "./items2.functions-ABkE3FIJ.mjs";
import { r as createOffer } from "./offers.functions-DTjDoLub.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ListingCard-CtV3JMQc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function OfferDialog({ listingId, listingTitle, onClose }) {
	const navigate = useNavigate();
	const myItems = useServerFn(listMyItems);
	const offer = useServerFn(createOffer);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [message, setMessage] = (0, import_react.useState)("");
	const { data: items, isLoading } = useQuery({
		queryKey: ["my-items"],
		queryFn: () => myItems()
	});
	const send = useMutation({
		mutationFn: async () => {
			if (selected.size === 0) throw new Error("Pick at least one item to offer");
			await offer({ data: {
				listing_id: listingId,
				offered_item_ids: [...selected],
				message
			} });
		},
		onSuccess: () => {
			toast.success("Offer sent!");
			onClose();
			navigate({ to: "/offers" });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send offer")
	});
	(0, import_react.useEffect)(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[120] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": `Make an offer on ${listingTitle}`,
		onClick: (e) => {
			e.stopPropagation();
			if (e.target === e.currentTarget) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card-hover",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-xl font-black flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "h-5 w-5 text-primary" }), " Make an offer"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted-foreground truncate",
					children: ["For: ", listingTitle]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					"aria-label": "Close",
					className: "rounded-full p-1 hover:bg-primary-soft",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
				})]
			}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted-foreground",
				children: "Loading your inventory…"
			}) : items && items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground",
					children: "Pick items to offer"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 max-h-60 space-y-2 overflow-y-auto",
					children: items.map((it) => {
						const on = selected.has(it.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								const next = new Set(selected);
								if (on) next.delete(it.id);
								else next.add(it.id);
								setSelected(next);
							},
							className: `flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition ${on ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-xl",
								children: it.image_urls && it.image_urls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: it.image_urls[0],
									alt: "",
									className: "h-full w-full object-cover"
								}) : it.image_emoji
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold",
									children: it.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase text-muted-foreground",
									children: it.condition
								})]
							})]
						}, it.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: message,
					onChange: (e) => setMessage(e.target.value),
					placeholder: "Optional message…",
					maxLength: 1e3,
					rows: 3,
					className: "mt-3 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => send.mutate(),
					disabled: send.isPending || selected.size === 0,
					className: "mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
					children: send.isPending ? "Sending…" : `Send offer (${selected.size})`
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "You need at least one item in your inventory to make an offer."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/new-listing",
					className: "mt-3 inline-block rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground",
					children: "Create an item"
				})]
			})]
		})
	}), document.body);
}
function ListingCard({ listing, initiallyFavourited = false, initiallyReported = false, onReported }) {
	const { savedIds, isLoading: savedLoading, userId } = useSavedIds();
	const toggleSaved = useToggleSaved();
	const saved = savedLoading ? initiallyFavourited : savedIds.includes(listing.id);
	const isOwner = !!userId && userId === listing.owner_id;
	const [reported, setReported] = (0, import_react.useState)(initiallyReported);
	const [offerOpen, setOfferOpen] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	const flag = useServerFn(flagListing);
	const owner = listing.owner;
	const initials = owner?.display_name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() ?? "?";
	async function ensureAuth() {
		const { data } = await supabase.auth.getSession();
		if (!data.session) {
			navigate({ to: "/auth" });
			return false;
		}
		return true;
	}
	async function handleSave(e) {
		e.preventDefault();
		e.stopPropagation();
		if (!await ensureAuth()) return;
		const wasSaved = saved;
		toggleSaved.mutate(listing.id, { onSuccess: () => toast.success(wasSaved ? "Removed from Saved" : "Saved") });
	}
	async function handleFlag(e) {
		e.preventDefault();
		e.stopPropagation();
		if (reported) return;
		if (!await ensureAuth()) return;
		const reason = window.prompt("Why are you reporting this listing?");
		if (!reason) return;
		setReported(true);
		try {
			await flag({ data: {
				listing_id: listing.id,
				reason
			} });
			toast.success("Report submitted — this listing is now hidden from your feed");
			onReported?.(listing.id);
		} catch (err) {
			setReported(false);
			toast.error(err instanceof Error ? err.message : "Could not report");
		}
	}
	async function handleOffer(e) {
		e.preventDefault();
		e.stopPropagation();
		if (!await ensureAuth()) return;
		setOfferOpen(true);
	}
	function openListing() {
		navigate({
			to: "/listings/$id",
			params: { id: listing.id }
		});
	}
	function handleCardKeyDown(e) {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		openListing();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		role: "link",
		tabIndex: 0,
		onClick: openListing,
		onKeyDown: handleCardKeyDown,
		className: "group relative flex min-w-0 flex-col rounded-md border-2 border-primary/25 bg-card p-3 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-card-hover",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `relative aspect-[4/3] overflow-hidden rounded-sm bg-gradient-to-br ${gradientForId(listing.id)}`,
				children: [
					!isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleSave,
						"aria-pressed": saved,
						"aria-label": saved ? "Remove from saved" : "Save listing",
						title: saved ? "Saved" : "Save",
						className: "absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-110 z-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: `h-4 w-4 transition ${saved ? "fill-primary text-primary" : "text-primary/70"}` })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleFlag,
						"aria-pressed": reported,
						"aria-label": reported ? "Already reported" : "Report listing",
						title: reported ? "You reported this listing" : "Report listing",
						className: "absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-110 z-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: `h-4 w-4 transition ${reported ? "fill-destructive text-destructive" : "text-primary/70"}` })
					}),
					listing.image_urls && listing.image_urls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: listing.image_urls[0],
						alt: listing.title,
						loading: "lazy",
						className: "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 grid place-items-center text-7xl drop-shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							children: listing.image_emoji
						})
					}),
					owner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/profile/$username",
						params: { username: owner.username },
						onClick: (e) => e.stopPropagation(),
						"aria-label": `View ${owner.display_name}'s profile`,
						className: "absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition hover:scale-110 z-10 overflow-hidden",
						style: { backgroundColor: owner.avatar_url ? "transparent" : owner.avatar_color },
						children: owner.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: owner.avatar_url,
							alt: "",
							className: "h-full w-full object-cover"
						}) : initials
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow",
						children: listing.condition
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-2 px-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "truncate font-display text-sm font-black uppercase tracking-wide text-foreground",
						children: listing.title
					}),
					listing.looking_for && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-full bg-primary-soft px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-primary",
						children: ["Looking for: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "normal-case font-medium text-foreground/80",
							children: listing.looking_for
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground",
						children: [owner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/profile/$username",
							params: { username: owner.username },
							onClick: (e) => e.stopPropagation(),
							className: "truncate font-medium hover:text-primary hover:underline",
							children: handle(owner)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0",
							children: timeAgo(listing.created_at)
						})]
					}),
					isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 rounded-full border-2 border-primary/30 py-2 text-center text-[11px] font-black uppercase tracking-wider text-primary",
						children: "Your listing"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: handleOffer,
						className: "mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow hover:scale-[1.02] active:scale-95",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "h-3.5 w-3.5" }), "Make an Offer"]
					})
				]
			}),
			offerOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferDialog, {
				listingId: listing.id,
				listingTitle: listing.title,
				onClose: () => setOfferOpen(false)
			})
		]
	});
}
//#endregion
export { ListingCard as t };
