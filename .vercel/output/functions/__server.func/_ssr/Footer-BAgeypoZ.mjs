import { r as __toESM } from "../_runtime.mjs";
import { _ as Link, u as useRouterState, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, l as handle, o as createSsrRpc } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { i as literalType, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { K as Bell, O as LogOut, f as Settings, m as Search, n as User, t as X, u as ShieldCheck, w as Menu } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Footer-BAgeypoZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getMyProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("5dbf46616266e7bfe81c82694a91090a42de6200b3efc1b9d156faf41ac3a479"));
var updateMyProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	username: stringType().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores").optional(),
	display_name: stringType().min(1).max(80).optional(),
	full_name: stringType().max(120).optional().nullable(),
	birthday: stringType().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
	emirate: stringType().max(40).optional().nullable(),
	location: stringType().max(120).optional().nullable(),
	bio: stringType().max(500).optional().nullable(),
	avatar_color: stringType().max(60).optional(),
	avatar_url: stringType().url().max(2048).optional().nullable(),
	banner_url: stringType().url().max(2048).optional().nullable(),
	inventory_default_visibility: enumType(["public", "private"]).optional()
}).parse(d)).handler(createSsrRpc("af00eb763dce352dc2f42ef901ef426a138feb40fdc7f79166552837a77fae5f"));
/** Public search for other users by username or display name. */
var searchProfiles = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ q: stringType().min(1).max(80) }).parse(d)).handler(createSsrRpc("41c2658cb728e60fb97f1736fa405f98fa2efe2d2cf6241836e7e6c547df2711"));
/** Public profile view: profile, admin badge and public inventory items. */
var getPublicProfile = createServerFn({ method: "GET" }).inputValidator((d) => objectType({ username: stringType().max(80) }).parse(d)).handler(createSsrRpc("4bf0d871c1b1448bf83ecae994053dfefc9592abecd0f940b98c0f46242944f0"));
/** Permanently delete the signed-in user's account and their content. */
var deleteMyAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ confirm: literalType("DELETE") }).parse(d)).handler(createSsrRpc("bffc6a45c963bea429a809fecd2b561dfb936da39f654d35165b0702b257c9c2"));
var listMyNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("acdc1590236f0839542f983a97a7193af437f8125c921a77e6feea3b73ccec73"));
var markNotificationRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64"));
var markAllNotificationsRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b"));
var listAnnouncements = createServerFn({ method: "GET" }).handler(createSsrRpc("d75312e39754628ccbc30c7c27dae53a1f04f162bf29838f1b4be44071b1445a"));
var createAnnouncement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	body: stringType().max(4e3).default(""),
	image_urls: arrayType(stringType().url().max(2048)).max(6).default([])
}).refine((v) => v.body.trim().length > 0 || v.image_urls.length > 0, { message: "Write a message or add a photo" }).parse(d)).handler(createSsrRpc("886fcc9ad3b27ecaa314eb466291dd41e9efc7869b0d887ff5d92f9aff9b7f91"));
var deleteAnnouncement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c11c97af8521520dd3e62a61ff3858e63857b34966188ffb256b53d39e8b55af"));
var logoUrl$1 = "/swap-logo.png";
function Navbar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const [session, setSession] = (0, import_react.useState)(null);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [navOpen, setNavOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const queryClient = useQueryClient();
	useServerFn(updateMyProfile);
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
		supabase.auth.getSession().then(({ data }) => setSession(data.session));
		return () => sub.subscription.unsubscribe();
	}, []);
	const getProfile = useServerFn(getMyProfile);
	const { data: me } = useQuery({
		queryKey: ["me", session?.user.id],
		queryFn: () => getProfile(),
		enabled: !!session
	});
	const isAdmin = me?.roles?.includes("admin");
	const listNotifs = useServerFn(listMyNotifications);
	const markRead = useServerFn(markNotificationRead);
	const markAll = useServerFn(markAllNotificationsRead);
	const [bellOpen, setBellOpen] = (0, import_react.useState)(false);
	const { data: notifs } = useQuery({
		queryKey: ["notifications", session?.user.id],
		queryFn: () => listNotifs(),
		enabled: !!session,
		refetchInterval: 3e4
	});
	const unreadCount = (notifs ?? []).filter((n) => !n.read).length;
	(0, import_react.useEffect)(() => {
		if (!session) return;
		const channel = supabase.channel(`notif-${session.user.id}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "notifications",
			filter: `user_id=eq.${session.user.id}`
		}, () => queryClient.invalidateQueries({ queryKey: ["notifications"] })).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [session, queryClient]);
	const annFn = useServerFn(listAnnouncements);
	const { data: announcements } = useQuery({
		queryKey: ["announcements-nav"],
		queryFn: () => annFn(),
		refetchInterval: 6e4
	});
	const [annSeen, setAnnSeen] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const read = () => setAnnSeen(Number(localStorage.getItem("announcements-seen-at") ?? 0));
		read();
		window.addEventListener("announcements-seen", read);
		return () => window.removeEventListener("announcements-seen", read);
	}, []);
	const newAnnouncements = (announcements ?? []).filter((a) => new Date(a.created_at).getTime() > annSeen).length;
	const links = session ? [
		{
			to: "/listings",
			label: "Browse"
		},
		{
			to: "/my-listings",
			label: "My Listings"
		},
		{
			to: "/favourites",
			label: "Saved"
		},
		{
			to: "/offers",
			label: "Offers"
		},
		{
			to: "/announcements",
			label: "Announcements"
		}
	] : [{
		to: "/listings",
		label: "Browse"
	}, {
		to: "/announcements",
		label: "Announcements"
	}];
	async function handleSignOut() {
		await queryClient.cancelQueries();
		queryClient.clear();
		await supabase.auth.signOut();
		setMenuOpen(false);
		navigate({
			to: "/listings",
			replace: true
		});
	}
	const avatarUrl = me?.profile?.avatar_url;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-40 bg-gradient-primary text-primary-foreground shadow-glow",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-3 sm:gap-6 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setNavOpen((v) => !v);
						setMenuOpen(false);
						setBellOpen(false);
					},
					className: "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 xl:hidden",
					"aria-label": "Menu",
					"aria-expanded": navOpen,
					children: navOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-5 w-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/listings",
					className: "flex items-center gap-2 shrink-0 group",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: logoUrl$1,
						alt: "SWAP",
						className: "h-12 w-auto object-contain transition-transform group-hover:rotate-[-4deg] drop-shadow sm:h-16"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden xl:flex shrink-0 items-center gap-1 text-sm font-semibold uppercase tracking-wider",
					children: links.map((l) => {
						const active = pathname.startsWith(l.to);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: l.to,
							className: `relative rounded-full px-4 py-2 transition-all ${active ? "bg-white/25 shadow-inner" : "opacity-80 hover:bg-white/15 hover:opacity-100"}`,
							children: [l.label, l.to === "/announcements" && newAnnouncements > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground shadow",
								children: newAnnouncements > 9 ? "9+" : newAnnouncements
							})]
						}, l.to);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "relative ml-auto w-full min-w-0 flex-1 sm:max-w-md lg:max-w-xl",
					onSubmit: (e) => {
						e.preventDefault();
						navigate({
							to: "/listings",
							search: { q: query.trim() || void 0 }
						});
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search items or people…",
						"aria-label": "Search items or people",
						className: "w-full rounded-full border-0 bg-white py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-md outline-none ring-0 focus:ring-2 focus:ring-white/70"
					})]
				}),
				session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setBellOpen((v) => !v);
							setMenuOpen(false);
						},
						className: "relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition",
						"aria-label": "Notifications",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4" }), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground px-1 shadow",
							children: unreadCount > 9 ? "9+" : unreadCount
						})]
					}), bellOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border-2 border-primary/20 bg-card text-foreground shadow-card-hover",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-border px-4 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-bold",
									children: "Notifications"
								}), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: async () => {
										await markAll();
										queryClient.invalidateQueries({ queryKey: ["notifications"] });
									},
									className: "text-xs text-primary hover:underline",
									children: "Mark all read"
								})]
							}),
							(notifs ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "p-6 text-center text-xs text-muted-foreground",
								children: "No notifications yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "divide-y divide-border",
								children: (notifs ?? []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: async () => {
										if (!n.read) {
											await markRead({ data: { id: n.id } });
											queryClient.invalidateQueries({ queryKey: ["notifications"] });
										}
										setBellOpen(false);
										if (n.link) navigate({ to: n.link });
									},
									className: `block w-full text-left px-4 py-3 hover:bg-primary-soft ${n.read ? "" : "bg-primary-soft/40"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-2",
										children: [!n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold",
													children: n.title
												}),
												n.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground line-clamp-2",
													children: n.body
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-[10px] text-muted-foreground uppercase",
													children: new Date(n.created_at).toLocaleString()
												})
											]
										})]
									})
								}) }, n.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/notifications",
								onClick: () => setBellOpen(false),
								className: "block border-t border-border px-4 py-2 text-center text-xs font-bold text-primary hover:bg-primary-soft",
								children: "View all"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMenuOpen((v) => !v),
						className: "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-primary shadow-md hover:scale-105 transition",
						style: { backgroundColor: avatarUrl ? "transparent" : me?.profile?.avatar_color ?? "white" },
						"aria-label": "Account menu",
						children: avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: avatarUrl,
							alt: "",
							className: "h-full w-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-black text-white drop-shadow",
							children: me?.profile?.display_name?.[0]?.toUpperCase() ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" })
						})
					}), menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute right-0 mt-2 w-56 rounded-2xl border-2 border-primary/20 bg-card p-2 text-foreground shadow-card-hover",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-3 py-2 border-b border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-bold truncate",
									children: handle(me?.profile)
								})
							}),
							me?.profile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/profile/$username",
								params: { username: me.profile.username },
								onClick: () => setMenuOpen(false),
								className: "block rounded-lg px-3 py-2 text-sm hover:bg-primary-soft",
								children: "View profile"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/settings",
								onClick: () => setMenuOpen(false),
								className: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-soft",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4" }), " Settings"]
							}),
							isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/admin",
								onClick: () => setMenuOpen(false),
								className: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-soft",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4" }), " Admin"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleSignOut,
								className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), " Sign out"]
							})
						]
					})]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					className: "shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-primary shadow-md transition hover:scale-105 sm:px-5 sm:text-sm",
					children: "Sign in"
				})
			]
		}), navOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "border-t border-white/20 px-3 pb-3 xl:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-1 pt-2 text-sm font-semibold uppercase tracking-wider",
				children: links.map((l) => {
					const active = pathname.startsWith(l.to);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: l.to,
						onClick: () => setNavOpen(false),
						className: `flex items-center justify-between rounded-xl px-4 py-3 transition ${active ? "bg-white/25" : "hover:bg-white/15"}`,
						children: [l.label, l.to === "/announcements" && newAnnouncements > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid min-w-5 h-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground",
							children: newAnnouncements > 9 ? "9+" : newAnnouncements
						})]
					}, l.to);
				})
			})
		})]
	}) });
}
var logoUrl = "/swap-logo.png";
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "mt-10 border-t-2 border-primary/15 bg-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: logoUrl,
						alt: "SWAP",
						className: "h-9 w-auto object-contain"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-sm font-black uppercase tracking-wider text-foreground",
					children: "SWAP"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" · Trade, don't spend."
					]
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/listings",
						className: "transition hover:text-primary",
						children: "Browse"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/terms",
						className: "transition hover:text-primary",
						children: "Terms & Conditions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/help",
						className: "transition hover:text-primary",
						children: "Contact Support"
					})
				]
			})]
		})
	});
}
//#endregion
export { deleteMyAccount as a, listAnnouncements as c, markNotificationRead as d, searchProfiles as f, deleteAnnouncement as i, listMyNotifications as l, Navbar as n, getMyProfile as o, updateMyProfile as p, createAnnouncement as r, getPublicProfile as s, Footer as t, markAllNotificationsRead as u };
