import { r as __toESM } from "../_runtime.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as gradientForId, d as useServerFn, o as createSsrRpc, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { i as liftBan } from "./bans.functions-D1CLk_eh.mjs";
import { A as LifeBuoy, D as Mail, E as MapPin, F as Flag, R as EyeOff, U as Check, V as ChevronRight, l as ShieldOff, o as Trash2, q as Ban, t as X, u as ShieldCheck } from "../_libs/lucide-react.mjs";
import { n as Navbar, o as getMyProfile, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Dd7ETM3p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listFlaggedListings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("ae5c6d4cb73024264a6b3835bfcc1d8bbdea8173580b6faabfeaae215ecf3d38"));
var getFlaggedListingDetail = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("735ec82217a82ff4bfbab42bda7038f2850637719934f6460f8f2ddaee14ddcf"));
var adminRemoveListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("36e309b94bbdc97cbe7289eee16875bbe33300ec5cddbdc27666f4d8161a7fe7"));
var redeemAdminCode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ code: stringType().min(4) }).parse(d)).handler(createSsrRpc("fde7a16cc94c6c94dfc38fb4db984c5f9f078ff79b83af25731a3d95d6412c44"));
/** Active bans with the banned member's profile. */
var listBannedUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("c68f8782acc616eb73df9ebd3137821ef65cb867d76237bf0c987c2de20eb5ca"));
/** Support inquiries submitted from the Help page. */
var listInquiries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("cd63362af08c5dc92539f291baaf79550fd7e540f29455914d4a149fb2be20e1"));
/** Listings held back by the automated content check, awaiting moderator review. */
var listWithheldListings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("5086beee22f1a95abe9adf707e82816a64d9dd43856183e8e996fccd1e65d72c"));
/** Approve (publish) or decline (remove) a withheld listing. */
var reviewWithheldListing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	approve: booleanType()
}).parse(d)).handler(createSsrRpc("fa67d1daa44be5874994f295c596f861375c51036c80af2214e46ec47a2388ba"));
/** Moderator reply to a support inquiry. */
var replyToInquiry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	reply: stringType().trim().min(1).max(2e3)
}).parse(d)).handler(createSsrRpc("4eeacca8b46e830bce18d82018a74f56608b795ea065bb943685dfa593aeed4c"));
function AdminPage() {
	const qc = useQueryClient();
	const me = useServerFn(getMyProfile);
	const list = useServerFn(listFlaggedListings);
	const remove = useServerFn(adminRemoveListing);
	const redeem = useServerFn(redeemAdminCode);
	const [code, setCode] = (0, import_react.useState)("");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("flagged");
	const withheldFn = useServerFn(listWithheldListings);
	const reviewFn = useServerFn(reviewWithheldListing);
	const bannedFn = useServerFn(listBannedUsers);
	const inquiriesFn = useServerFn(listInquiries);
	const liftFn = useServerFn(liftBan);
	const { data: profile } = useQuery({
		queryKey: ["me"],
		queryFn: () => me()
	});
	const isAdmin = profile?.roles?.includes("admin");
	const { data: flagged } = useQuery({
		queryKey: ["admin-flagged"],
		queryFn: () => list(),
		enabled: !!isAdmin
	});
	const { data: banned } = useQuery({
		queryKey: ["admin-banned"],
		queryFn: () => bannedFn(),
		enabled: !!isAdmin
	});
	const { data: inquiries } = useQuery({
		queryKey: ["admin-inquiries"],
		queryFn: () => inquiriesFn(),
		enabled: !!isAdmin
	});
	const { data: withheld } = useQuery({
		queryKey: ["admin-withheld"],
		queryFn: () => withheldFn(),
		enabled: !!isAdmin
	});
	const reviewMut = useMutation({
		mutationFn: (v) => reviewFn({ data: v }),
		onSuccess: (_d, v) => {
			qc.invalidateQueries({ queryKey: ["admin-withheld"] });
			toast.success(v.approve ? "Listing published" : "Listing declined");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const liftMut = useMutation({
		mutationFn: (userId) => liftFn({ data: { user_id: userId } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-banned"] });
			toast.success("Ban lifted");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const removeMut = useMutation({
		mutationFn: (id) => remove({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-flagged"] });
			setOpenId(null);
			toast.success("Listing removed");
		}
	});
	const redeemMut = useMutation({
		mutationFn: () => redeem({ data: { code } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["me"] });
			toast.success("You are now an admin");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1200px] flex-1 px-6 py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl font-black",
							children: "Admin"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground text-sm",
							children: "Moderate reports, bans and inquiries."
						})] })]
					}),
					!isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "You are not an admin. Enter the bootstrap code to gain access (This page is only for the moderator team)."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: code,
								onChange: (e) => setCode(e.target.value),
								placeholder: "Admin code",
								className: "flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => redeemMut.mutate(),
								disabled: !code,
								className: "rounded-full bg-gradient-primary px-5 py-2 text-sm font-black uppercase text-primary-foreground disabled:opacity-50",
								children: "Redeem"
							})]
						})]
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-5 flex flex-wrap gap-2",
							children: [
								[
									"flagged",
									"Flagged listings",
									(flagged ?? []).length,
									Flag
								],
								[
									"withheld",
									"Withheld listings",
									(withheld ?? []).length,
									EyeOff
								],
								[
									"banned",
									"Banned users",
									(banned ?? []).length,
									Ban
								],
								[
									"inquiries",
									"Inquiries",
									(inquiries ?? []).length,
									LifeBuoy
								]
							].map(([key, label, count, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setTab(key),
								className: `inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-wider transition ${tab === key ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow" : "border-primary/25 text-primary hover:bg-primary-soft"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5" }),
									" ",
									label,
									" (",
									count,
									")"
								]
							}, key))
						}),
						tab === "flagged" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: (flagged ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground",
								children: "Nothing flagged. 🎉"
							}) : (flagged ?? []).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setOpenId(l.id),
								className: "flex w-full items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-card p-4 text-left hover:border-destructive transition",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(l.id)} text-3xl`,
										children: l.image_emoji
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-lg font-bold truncate",
												children: l.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: [
													"by @",
													l.owner?.username,
													" · ",
													l.category,
													" · ",
													l.status
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-3 w-3" }),
													" ",
													l.flags_count,
													" flags"
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-muted-foreground shrink-0" })
								]
							}, l.id))
						}),
						tab === "withheld" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: (withheld ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground",
								children: "No listings awaiting review. 🎉"
							}) : (withheld ?? []).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-2xl border-2 border-primary/20 bg-card p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-lg font-bold truncate",
												children: l.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: [
													"@",
													l.owner?.username ?? "unknown",
													" · ",
													timeAgo(l.created_at)
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-sm text-muted-foreground line-clamp-3",
												children: l.description
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive",
												children: l.moderation_note ?? "Held for review"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => reviewMut.mutate({
												id: l.id,
												approve: true
											}),
											disabled: reviewMut.isPending,
											className: "inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), " Accept"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => reviewMut.mutate({
												id: l.id,
												approve: false
											}),
											disabled: reviewMut.isPending,
											className: "inline-flex items-center gap-1.5 rounded-full border-2 border-destructive/40 px-4 py-2 text-xs font-black uppercase text-destructive disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" }), " Decline"]
										})]
									})]
								})
							}, l.id))
						}),
						tab === "banned" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: (banned ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground",
								children: "No banned members."
							}) : (banned ?? []).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-card p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-display text-lg font-bold truncate",
											children: ["@", b.profile?.username ?? "unknown"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: ["Reason: ", b.reason || "—"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												b.expires_at ? `Until ${new Date(b.expires_at).toLocaleString()}` : "Permanent",
												" · banned",
												" ",
												timeAgo(b.created_at)
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => liftMut.mutate(b.user_id),
									disabled: liftMut.isPending,
									className: "inline-flex items-center gap-1.5 rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase text-primary hover:bg-primary-soft disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { className: "h-3.5 w-3.5" }), " Lift ban"]
								})]
							}, b.id))
						}),
						tab === "inquiries" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: (inquiries ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground",
								children: "No inquiries yet."
							}) : (inquiries ?? []).map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border-2 border-primary/20 bg-card p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-lg font-bold",
										children: q.subject
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											q.name,
											" ·",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: `mailto:${q.email}`,
												className: "inline-flex items-center gap-1 text-primary hover:underline",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3 w-3" }), q.email]
											}),
											" ",
											"· ",
											timeAgo(q.created_at)
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 whitespace-pre-wrap text-sm text-foreground/80",
										children: q.message
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InquiryReply, { inquiry: q })
								]
							}, q.id))
						})
					] }),
					openId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaggedListingModal, {
						id: openId,
						onClose: () => setOpenId(null),
						onRemove: () => removeMut.mutate(openId),
						removing: removeMut.isPending
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function FlaggedListingModal({ id, onClose, onRemove, removing }) {
	const detail = useServerFn(getFlaggedListingDetail);
	const { data, isLoading } = useQuery({
		queryKey: ["admin-flagged-detail", id],
		queryFn: () => detail({ data: { id } })
	});
	const listing = data?.listing;
	const flags = data?.flags ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: (e) => e.stopPropagation(),
			className: "relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card shadow-card-hover border-2 border-primary/20",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onClose,
				className: "absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted-foreground/20",
				"aria-label": "Close",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
			}), isLoading || !listing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-10 text-center text-muted-foreground",
				children: "Loading listing…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6 space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br ${gradientForId(listing.id)}`,
						children: [listing.image_urls && listing.image_urls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: listing.image_urls[0],
							alt: listing.title,
							className: "absolute inset-0 h-full w-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0 grid place-items-center text-[140px]",
							children: listing.image_emoji
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase text-primary shadow",
							children: listing.status
						})]
					}),
					listing.image_urls && listing.image_urls.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-5 gap-2",
						children: listing.image_urls.slice(1).map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: u,
							alt: "",
							className: "aspect-square rounded-lg object-cover"
						}, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl font-black",
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", listing.condition] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· by @", listing.owner?.username] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", timeAgo(listing.created_at)] })
							]
						}),
						listing.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 whitespace-pre-wrap text-foreground/80",
							children: listing.description
						}),
						listing.looking_for && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-2xl border-2 border-primary/20 bg-primary-soft p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold uppercase text-primary text-xs",
								children: "Looking for: "
							}), listing.looking_for]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-display text-lg font-black mb-2",
						children: [
							"Reports (",
							flags.length,
							")"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: flags.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-xl border border-destructive/30 bg-destructive/5 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"@",
									f.reporter?.username ?? "unknown",
									" · ",
									timeAgo(f.created_at)
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm mt-1",
								children: f.reason
							})]
						}, f.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 justify-end pt-2 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClose,
							className: "rounded-full border-2 border-primary/30 px-5 py-2 text-sm font-bold text-primary hover:bg-primary-soft",
							children: "Close"
						}), listing.status !== "removed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								if (confirm("Remove this listing?")) onRemove();
							},
							disabled: removing,
							className: "inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-5 py-2 text-sm font-bold uppercase hover:opacity-90 disabled:opacity-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" }), " Remove listing"]
						})]
					})
				]
			})]
		})
	});
}
function InquiryReply({ inquiry }) {
	const qc = useQueryClient();
	const replyFn = useServerFn(replyToInquiry);
	const [text, setText] = (0, import_react.useState)(inquiry.reply ?? "");
	const [editing, setEditing] = (0, import_react.useState)(!inquiry.reply);
	const mut = useMutation({
		mutationFn: () => replyFn({ data: {
			id: inquiry.id,
			reply: text.trim()
		} }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
			setEditing(false);
			toast.success("Reply sent to the member");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send reply")
	});
	if (!editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 rounded-2xl bg-primary-soft p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] font-black uppercase tracking-wider text-primary",
				children: "Your reply"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 whitespace-pre-wrap text-sm",
				children: inquiry.reply
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setEditing(true),
				className: "mt-2 text-xs font-bold uppercase text-primary hover:underline",
				children: "Edit reply"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			rows: 3,
			maxLength: 2e3,
			value: text,
			onChange: (e) => setText(e.target.value),
			placeholder: "Write a reply the member will see in their Inquiry updates…",
			className: "w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => mut.mutate(),
			disabled: !text.trim() || mut.isPending,
			className: "mt-2 rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
			children: mut.isPending ? "Sending…" : "Send reply"
		})]
	});
}
//#endregion
export { AdminPage as component };
