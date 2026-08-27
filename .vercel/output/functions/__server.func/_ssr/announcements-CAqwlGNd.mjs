import { r as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, l as handle, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { T as Megaphone, i as Upload, o as Trash2, p as Send, t as X, u as ShieldCheck } from "../_libs/lucide-react.mjs";
import { c as listAnnouncements, i as deleteAnnouncement, n as Navbar, o as getMyProfile, r as createAnnouncement, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as uploadFileTo } from "./upload-COX85Ejj.mjs";
import { t as ImageCropper } from "./ImageCropper-DlevZXe0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/announcements-CAqwlGNd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AnnouncementsPage() {
	const queryClient = useQueryClient();
	const listFn = useServerFn(listAnnouncements);
	const createFn = useServerFn(createAnnouncement);
	const deleteFn = useServerFn(deleteAnnouncement);
	const meFn = useServerFn(getMyProfile);
	const [signedIn, setSignedIn] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
		localStorage.setItem("announcements-seen-at", String(Date.now()));
		window.dispatchEvent(new Event("announcements-seen"));
	}, []);
	const { data: posts, isLoading } = useQuery({
		queryKey: ["announcements"],
		queryFn: () => listFn()
	});
	const { data: me } = useQuery({
		queryKey: ["me"],
		queryFn: () => meFn(),
		enabled: signedIn
	});
	const isAdmin = !!me?.roles?.includes("admin");
	const [body, setBody] = (0, import_react.useState)("");
	const [images, setImages] = (0, import_react.useState)([]);
	const [queue, setQueue] = (0, import_react.useState)([]);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const post = useMutation({
		mutationFn: () => createFn({ data: {
			body: body.trim(),
			image_urls: images
		} }),
		onSuccess: () => {
			setBody("");
			setImages([]);
			queryClient.invalidateQueries({ queryKey: ["announcements"] });
			toast.success("Announcement posted");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const remove = useMutation({
		mutationFn: (id) => deleteFn({ data: { id } }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	async function uploadCropped(file) {
		setUploading(true);
		try {
			const url = await uploadFileTo("listing-images", file);
			setImages((prev) => [...prev, url]);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			queue.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCropper, {
				file: queue[0],
				aspect: 4 / 3,
				title: "Crop photo",
				onCancel: () => setQueue((q) => q.slice(1)),
				onDone: async (f) => {
					setQueue((q) => q.slice(1));
					await uploadCropped(f);
				}
			}, queue[0].name + queue.length),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[800px] flex-1 px-6 py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-6 w-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl font-black",
							children: "Community announcements"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-muted-foreground",
							children: "Updates from the SWAP team."
						})] })]
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-black uppercase tracking-wider text-primary",
								children: "Post an announcement"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 3,
								maxLength: 4e3,
								value: body,
								onChange: (e) => setBody(e.target.value),
								placeholder: "Share news with the community…",
								className: "mt-3 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
							}),
							images.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 grid grid-cols-4 gap-2",
								children: images.map((url) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative aspect-square overflow-hidden rounded-xl border-2 border-primary/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: url,
										alt: "",
										className: "h-full w-full object-cover"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setImages((prev) => prev.filter((u) => u !== url)),
										className: "absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
									})]
								}, url))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary-soft",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											accept: "image/*",
											multiple: true,
											hidden: true,
											onChange: (e) => {
												const files = Array.from(e.target.files ?? []).slice(0, 6 - images.length);
												e.target.value = "";
												setQueue((q) => [...q, ...files]);
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }),
										" ",
										uploading ? "Uploading…" : "Add photo"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: post.isPending || uploading || !body.trim() && images.length === 0,
									onClick: () => post.mutate(),
									className: "inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow disabled:opacity-50",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" }),
										" ",
										post.isPending ? "Posting…" : "Post"
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 space-y-4",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Loading…"
						}) : !posts || posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-3xl border-2 border-dashed border-primary/30 bg-card p-10 text-center text-muted-foreground",
							children: "No announcements yet. Check back soon!"
						}) : posts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-white text-sm font-black text-white shadow",
											style: { backgroundColor: p.author?.avatar_url ? "transparent" : p.author?.avatar_color ?? "#888" },
											children: p.author?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: p.author.avatar_url,
												alt: "",
												className: "h-full w-full object-cover"
											}) : p.author?.display_name?.[0]?.toUpperCase() ?? "S"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-display font-bold",
													children: p.author ? handle(p.author) : "SWAP team"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3 w-3" }), " Admin"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: timeAgo(p.created_at)
											})]
										}),
										isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												if (window.confirm("Delete this announcement?")) remove.mutate(p.id);
											},
											className: "grid h-8 w-8 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10",
											"aria-label": "Delete announcement",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
										})
									]
								}),
								p.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 whitespace-pre-wrap text-sm leading-relaxed",
									children: p.body
								}),
								p.image_urls?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `mt-3 grid gap-2 ${p.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`,
									children: p.image_urls.map((url) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: url,
										alt: "",
										loading: "lazy",
										className: "w-full rounded-2xl border-2 border-primary/10 object-cover"
									}, url))
								})
							]
						}, p.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { AnnouncementsPage as component };
