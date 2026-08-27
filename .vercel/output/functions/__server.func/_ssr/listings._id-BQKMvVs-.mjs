import { r as __toESM } from "../_runtime.mjs";
import { _ as Link, l as useLocation, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as gradientForId, d as useServerFn, l as handle, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { E as MapPin, F as Flag, H as ChevronLeft, V as ChevronRight, Y as ArrowRightLeft, b as Pencil, o as Trash2, s as Star, u as ShieldCheck } from "../_libs/lucide-react.mjs";
import { n as Navbar, s as getPublicProfile, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as deleteListing, r as getListing } from "./listings.functions-T0r7f8kn.mjs";
import { a as useSavedIds, s as useToggleSaved, t as flagListing } from "./flags2.functions-CKoPdqok.mjs";
import { a as listMyItems } from "./items2.functions-ABkE3FIJ.mjs";
import { r as createOffer } from "./offers.functions-DTjDoLub.mjs";
import { t as Route } from "./listings._id-C6w8BZl_.mjs";
import { t as useBlockedIds } from "./use-blocks-BiwUxoCe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings._id-BQKMvVs-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ListingDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const qc = useQueryClient();
	const get = useServerFn(getListing);
	const myItems = useServerFn(listMyItems);
	const flag = useServerFn(flagListing);
	const offer = useServerFn(createOffer);
	const removeListing = useServerFn(deleteListing);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [message, setMessage] = (0, import_react.useState)("");
	const [activePhoto, setActivePhoto] = (0, import_react.useState)(0);
	const offerPanelRef = (0, import_react.useRef)(null);
	const { data: listing, isLoading } = useQuery({
		queryKey: ["listing", id],
		queryFn: () => get({ data: { id } })
	});
	const publicProfileFn = useServerFn(getPublicProfile);
	const ownerUsername = listing?.owner?.username;
	const { data: ownerPublic } = useQuery({
		queryKey: ["public-profile", ownerUsername],
		queryFn: () => publicProfileFn({ data: { username: ownerUsername } }),
		enabled: !!ownerUsername
	});
	const [signedIn, setSignedIn] = (0, import_react.useState)(null);
	const [myUserId, setMyUserId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSignedIn(!!data.session);
			setMyUserId(data.session?.user.id ?? null);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
			setSignedIn(!!s);
			setMyUserId(s?.user.id ?? null);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	(0, import_react.useEffect)(() => {
		if (location.hash !== "offer") return;
		offerPanelRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}, [location.hash]);
	const { data: items } = useQuery({
		queryKey: ["my-items"],
		queryFn: () => myItems(),
		enabled: !!signedIn
	});
	const { savedIds } = useSavedIds();
	const toggleSaved = useToggleSaved();
	const createOfferMut = useMutation({
		mutationFn: async () => {
			if (selected.size === 0) throw new Error("Pick at least one item to offer");
			await offer({ data: {
				listing_id: id,
				offered_item_ids: [...selected],
				message
			} });
		},
		onSuccess: () => {
			toast.success("Offer sent!");
			setSelected(/* @__PURE__ */ new Set());
			setMessage("");
			navigate({ to: "/offers" });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const blockedIds = useBlockedIds();
	const deleteMut = useMutation({
		mutationFn: () => removeListing({ data: { id } }),
		onSuccess: () => {
			toast.success("Listing deleted");
			qc.invalidateQueries({ queryKey: ["listings"] });
			navigate({ to: "/listings" });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete listing")
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-4xl p-8 text-center text-muted-foreground",
			children: "Loading…"
		})]
	});
	if (listing && blockedIds.has(listing.owner_id)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-4xl p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-black",
					children: "Listing unavailable"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "You can't view this listing because one of you has blocked the other."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/listings",
					className: "mt-4 inline-block text-primary hover:underline",
					children: "Browse other listings"
				})
			]
		})]
	});
	if (!listing) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-4xl p-8 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-black",
				children: "Listing not found"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/listings",
				className: "mt-4 inline-block text-primary hover:underline",
				children: "Browse other listings"
			})]
		})]
	});
	const isFav = savedIds.includes(id);
	const isOwner = !!myUserId && myUserId === listing.owner_id;
	const owner = listing.owner;
	const photos = listing.image_urls ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br ${gradientForId(listing.id)}`,
								children: [
									photos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: photos[Math.min(activePhoto, photos.length - 1)],
										alt: listing.title,
										className: "absolute inset-0 h-full w-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 grid place-items-center text-[90px] drop-shadow-lg sm:text-[160px] lg:text-[200px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": true,
											children: listing.image_emoji
										})
									}),
									photos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": "Previous photo",
											onClick: () => setActivePhoto((i) => (i - 1 + photos.length) % photos.length),
											className: "absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow transition hover:scale-110",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-5 w-5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": "Next photo",
											onClick: () => setActivePhoto((i) => (i + 1) % photos.length),
											className: "absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow transition hover:scale-110",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white",
											children: [
												Math.min(activePhoto, photos.length - 1) + 1,
												" / ",
												photos.length
											]
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow",
										children: listing.condition
									})
								]
							}),
							photos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 grid grid-cols-5 gap-2",
								children: photos.map((url, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setActivePhoto(i),
									"aria-label": `Show photo ${i + 1}`,
									className: `overflow-hidden rounded-xl border-2 transition ${i === activePhoto ? "border-primary" : "border-transparent hover:border-primary/40"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: url,
										alt: "",
										className: "aspect-square w-full object-cover"
									})
								}, url))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "font-display text-2xl font-black break-words sm:text-3xl lg:text-4xl",
										children: listing.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" }),
													" ",
													listing.location
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", listing.category] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", timeAgo(listing.created_at)] })
										]
									}),
									listing.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-foreground/80 whitespace-pre-wrap",
										children: listing.description
									}),
									listing.looking_for && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 rounded-2xl border-2 border-primary/20 bg-primary-soft p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold uppercase tracking-wider text-primary",
											children: "Looking for"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1",
											children: listing.looking_for
										})]
									})
								]
							}),
							owner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex items-center gap-4 rounded-2xl border-2 border-primary/20 bg-card p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white text-lg font-black text-white shadow",
									style: { backgroundColor: owner.avatar_url ? "transparent" : owner.avatar_color },
									children: owner.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: owner.avatar_url,
										alt: owner.display_name,
										className: "h-full w-full object-cover"
									}) : owner.display_name?.[0]?.toUpperCase()
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/profile/$username",
											params: { username: owner.username },
											className: "font-display text-lg font-bold hover:text-primary",
											children: handle(owner)
										}), ownerPublic?.isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3 w-3" }), " Admin"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											"Listed by ",
											handle(owner),
											" · ",
											owner.location ?? "UAE"
										]
									})]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "space-y-4",
						children: [
							isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-xl font-black",
										children: "Your listing"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted-foreground",
										children: "Edit the details anytime, or delete it for everyone."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/edit-listing/$id",
										params: { id: listing.id },
										className: "mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" }), " Edit listing"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										disabled: deleteMut.isPending,
										onClick: () => {
											if (window.confirm("Delete this listing? This can't be undone.")) deleteMut.mutate();
										},
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-destructive px-5 py-2 text-xs font-black uppercase tracking-wider text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }),
											" ",
											deleteMut.isPending ? "Deleting…" : "Delete listing"
										]
									})
								]
							}),
							!isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								id: "offer",
								ref: offerPanelRef,
								className: "rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
									className: "font-display text-xl font-black flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "h-5 w-5 text-primary" }), " Make an offer"]
								}), !signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted-foreground",
									children: "Sign in to offer one of your items."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/auth",
									className: "mt-4 flex items-center justify-center rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase tracking-wider text-primary-foreground",
									children: "Sign in"
								})] }) : listing.status !== "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-sm text-muted-foreground",
									children: [
										"This listing is ",
										listing.status,
										"."
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-xs text-muted-foreground",
										children: "Pick items from your inventory to offer:"
									}),
									items && items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 max-h-60 overflow-y-auto space-y-2",
										children: items.map((it) => {
											const on = selected.has(it.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													const next = new Set(selected);
													on ? next.delete(it.id) : next.add(it.id);
													setSelected(next);
												},
												className: `flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition ${on ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-xl",
													children: it.image_emoji
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-semibold truncate",
														children: it.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-muted-foreground uppercase",
														children: it.condition
													})]
												})]
											}, it.id);
										})
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 rounded-2xl border-2 border-dashed border-primary/30 p-4 text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "You don't have any items yet."
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/new-listing",
											className: "mt-2 inline-block text-xs font-bold text-primary hover:underline",
											children: "Create an item →"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: message,
										onChange: (e) => setMessage(e.target.value),
										placeholder: "Optional message…",
										maxLength: 1e3,
										rows: 3,
										className: "mt-3 w-full rounded-2xl border-2 border-primary/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary resize-none"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => createOfferMut.mutate(),
										disabled: createOfferMut.isPending || selected.size === 0,
										className: "mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
										children: createOfferMut.isPending ? "Sending…" : `Send offer (${selected.size})`
									})
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-3xl border-2 border-primary/20 bg-card p-4 flex gap-2",
								children: [!isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => signedIn ? toggleSaved.mutate(id) : navigate({ to: "/auth" }),
									className: "flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/30 py-2 text-xs font-bold uppercase text-primary hover:bg-primary-soft transition",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-4 w-4 ${isFav ? "fill-primary" : ""}` }),
										" ",
										isFav ? "Saved" : "Save"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: async () => {
										if (!signedIn) return navigate({ to: "/auth" });
										const reason = window.prompt("Why are you reporting this?");
										if (!reason) return;
										try {
											await flag({ data: {
												listing_id: id,
												reason
											} });
											toast.success("Report submitted");
										} catch (e) {
											toast.error(e instanceof Error ? e.message : "Failed");
										}
									},
									className: "inline-flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 px-4 py-2 text-xs font-bold uppercase text-destructive hover:bg-destructive/10 transition",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-4 w-4" }), " Report"]
								})]
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
export { ListingDetailPage as component };
