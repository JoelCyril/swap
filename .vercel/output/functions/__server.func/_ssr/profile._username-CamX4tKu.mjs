import { r as __toESM } from "../_runtime.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, l as handle } from "./db-types-Dz-qEZef.mjs";
import { i as liftBan, r as getUserBan, t as banUser } from "./bans.functions-D1CLk_eh.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { E as MapPin, l as ShieldOff, q as Ban, u as ShieldCheck } from "../_libs/lucide-react.mjs";
import { n as Navbar, o as getMyProfile, s as getPublicProfile, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { o as listListingsByUsername } from "./listings.functions-T0r7f8kn.mjs";
import { t as ListingCard } from "./ListingCard-CtV3JMQc.mjs";
import { t as useBlockedIds } from "./use-blocks-BiwUxoCe.mjs";
import { t as Route } from "./profile._username-5LEV5Vrb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile._username-CamX4tKu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DURATIONS = [
	{
		label: "1 day",
		days: 1
	},
	{
		label: "7 days",
		days: 7
	},
	{
		label: "30 days",
		days: 30
	},
	{
		label: "1 year",
		days: 365
	},
	{
		label: "Permanent",
		days: null
	}
];
/** Admin-only controls to ban or unban a member. */
function BanUserPanel({ userId, displayName }) {
	const qc = useQueryClient();
	const banFn = useServerFn(banUser);
	const liftFn = useServerFn(liftBan);
	const getBan = useServerFn(getUserBan);
	const [reason, setReason] = (0, import_react.useState)("");
	const [durationIdx, setDurationIdx] = (0, import_react.useState)(1);
	const { data: activeBan } = useQuery({
		queryKey: ["user-ban", userId],
		queryFn: () => getBan({ data: { user_id: userId } })
	});
	const ban = useMutation({
		mutationFn: () => banFn({ data: {
			user_id: userId,
			reason: reason.trim(),
			days: DURATIONS[durationIdx].days
		} }),
		onSuccess: () => {
			setReason("");
			qc.invalidateQueries({ queryKey: ["user-ban", userId] });
			toast.success(`${displayName} has been banned`);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const lift = useMutation({
		mutationFn: () => liftFn({ data: { user_id: userId } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["user-ban", userId] });
			toast.success("Ban lifted");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-10 rounded-3xl border-2 border-destructive/30 bg-card p-5 shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "flex items-center gap-2 font-display text-lg font-black text-destructive",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-4 w-4" }), " Moderation"]
		}), activeBan ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-destructive/10 p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold",
						children: "This member is banned"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-muted-foreground",
						children: ["Reason: ", activeBan.reason]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: activeBan.expires_at ? `Until ${new Date(activeBan.expires_at).toLocaleString()}` : "Permanent"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => lift.mutate(),
				disabled: lift.isPending,
				className: "inline-flex items-center gap-2 rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { className: "h-3.5 w-3.5" }), " Lift ban"]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Reason"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: reason,
					onChange: (e) => setReason(e.target.value),
					maxLength: 500,
					placeholder: "Why is this member being banned?",
					className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Duration"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: durationIdx,
					onChange: (e) => setDurationIdx(Number(e.target.value)),
					className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
					children: DURATIONS.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: i,
						children: d.label
					}, d.label))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						if (reason.trim().length < 3) return toast.error("Please add a reason");
						if (confirm(`Ban ${displayName}? They will lose access to the site.`)) ban.mutate();
					},
					disabled: ban.isPending,
					className: "inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-xs font-black uppercase tracking-wider text-destructive-foreground transition hover:opacity-90 disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-3.5 w-3.5" }), " Ban user"]
				})
			]
		})]
	});
}
function ProfilePage() {
	const { username } = Route.useParams();
	const fn = useServerFn(listListingsByUsername);
	const { data, isLoading } = useQuery({
		queryKey: ["profile", username],
		queryFn: () => fn({ data: { username } })
	});
	const pubFn = useServerFn(getPublicProfile);
	const { data: pub } = useQuery({
		queryKey: ["public-profile", username],
		queryFn: () => pubFn({ data: { username } })
	});
	const [showAllItems, setShowAllItems] = (0, import_react.useState)(false);
	const [showAllListings, setShowAllListings] = (0, import_react.useState)(false);
	const [viewerId, setViewerId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setViewerId(data.session?.user.id ?? null));
	}, []);
	const meFn = useServerFn(getMyProfile);
	const { data: me } = useQuery({
		queryKey: ["me", viewerId],
		queryFn: () => meFn(),
		enabled: !!viewerId
	});
	const viewerIsAdmin = !!me?.roles?.includes("admin");
	const blockedIds = useBlockedIds();
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-8 text-center text-muted-foreground",
			children: "Loading…"
		})]
	});
	if (!data?.profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-8 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-black",
				children: "User not found"
			})
		})]
	});
	const owner = data.profile;
	const listings = data.listings;
	if (blockedIds.has(owner.id)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-8 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-black",
				children: "Profile unavailable"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "You can't view this member because one of you has blocked the other."
			})]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative overflow-hidden",
				children: [owner.banner_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: owner.banner_url,
					alt: "",
					className: "absolute inset-0 h-full w-full object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/45 to-foreground/25" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-primary opacity-90" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-hero" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto grid max-w-[1200px] grid-cols-[auto_minmax(0,1fr)] items-center gap-6 px-6 py-12 text-primary-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-24 w-24 sm:h-32 sm:w-32 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-white/90 text-3xl font-black text-white shadow-glow",
						style: { backgroundColor: owner.avatar_url ? "transparent" : owner.avatar_color },
						children: owner.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: owner.avatar_url,
							alt: "",
							className: "h-full w-full object-cover"
						}) : owner.display_name?.split(" ").map((s) => s[0]).join("").slice(0, 2)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-3xl sm:text-5xl font-black truncate",
								children: handle(owner)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-4 text-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" }),
										" ",
										owner.location ?? "UAE"
									]
								})
							}),
							pub?.isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3.5 w-3.5" }), " Moderator"]
							}),
							owner.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-2xl text-sm text-white/90",
								children: owner.bio
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1200px] flex-1 px-6 py-10",
				children: [
					viewerIsAdmin && !pub?.isAdmin && viewerId !== owner.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BanUserPanel, {
						userId: owner.id,
						displayName: owner.display_name
					}),
					(pub?.items ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mb-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl font-black",
								children: "Public inventory"
							}), (pub?.items ?? []).length > 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowAllItems((v) => !v),
								className: "rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft",
								children: showAllItems ? "Show less" : `View all ${(pub?.items ?? []).length} items`
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4",
							children: (showAllItems ? pub?.items ?? [] : (pub?.items ?? []).slice(0, 4)).map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/items/$id",
								params: { id: it.id },
								className: "rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card transition hover:border-primary hover:shadow-card-hover",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid aspect-square place-items-center overflow-hidden rounded-2xl bg-primary-soft text-5xl",
										children: it.image_urls && it.image_urls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: it.image_urls[0],
											alt: it.name,
											className: "h-full w-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": true,
											children: it.image_emoji
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 truncate text-sm font-bold",
										children: it.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[10px] uppercase text-muted-foreground",
										children: [
											it.category,
											" · ",
											it.condition
										]
									})
								]
							}, it.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-black",
							children: "Active listings"
						}), listings.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowAllListings((v) => !v),
							className: "rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft",
							children: showAllListings ? "Show less" : "View all listings"
						})]
					}),
					listings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground",
						children: "No public listings yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3",
						children: (showAllListings ? listings : listings.slice(0, 3)).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, { listing: l }, l.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { ProfilePage as component };
