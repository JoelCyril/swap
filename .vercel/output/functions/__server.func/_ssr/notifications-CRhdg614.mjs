import { _ as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn } from "./db-types-Dz-qEZef.mjs";
import { K as Bell } from "../_libs/lucide-react.mjs";
import { d as markNotificationRead, l as listMyNotifications, n as Navbar, t as Footer, u as markAllNotificationsRead } from "./Footer-BAgeypoZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-CRhdg614.js
var import_jsx_runtime = require_jsx_runtime();
function NotificationsPage() {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const list = useServerFn(listMyNotifications);
	const markRead = useServerFn(markNotificationRead);
	const markAll = useServerFn(markAllNotificationsRead);
	const { data: notifs } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => list()
	});
	const unread = (notifs ?? []).filter((n) => !n.read).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[800px] flex-1 px-6 py-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl font-black",
							children: "Notifications"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted-foreground text-sm",
							children: [unread, " unread"]
						})] })]
					}), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: async () => {
							await markAll();
							qc.invalidateQueries({ queryKey: ["notifications"] });
						},
						className: "rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-bold uppercase text-primary hover:bg-primary-soft",
						children: "Mark all read"
					})]
				}), (notifs ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-10 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "You're all caught up."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/listings",
						className: "mt-4 inline-block text-primary font-bold hover:underline",
						children: "Browse listings →"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: (notifs ?? []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: async () => {
							if (!n.read) {
								await markRead({ data: { id: n.id } });
								qc.invalidateQueries({ queryKey: ["notifications"] });
							}
							if (n.link) navigate({ to: n.link });
						},
						className: `flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${n.read ? "border-border bg-card" : "border-primary/40 bg-primary-soft/40"}`,
						children: [!n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold",
									children: n.title
								}),
								n.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: n.body
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] uppercase text-muted-foreground",
									children: new Date(n.created_at).toLocaleString()
								})
							]
						})]
					}) }, n.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { NotificationsPage as component };
