import { r as __toESM } from "../_runtime.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, n as CONDITIONS, t as CATEGORIES } from "./db-types-Dz-qEZef.mjs";
import { L as Eye, R as EyeOff, Y as ArrowRightLeft, b as Pencil, m as Search, o as Trash2, t as X, y as Plus } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as uploadFileTo } from "./upload-COX85Ejj.mjs";
import { t as ImageCropper } from "./ImageCropper-DlevZXe0.mjs";
import { a as listMyItems, l as updateItem, n as deleteItem, o as listMyListedItemIds, s as listMySwappedItemIds, t as createItem } from "./items2.functions-ABkE3FIJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/your-items-CMn0zHpD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMPTY = {
	name: "",
	category: "Electronics",
	condition: "Good",
	image_emoji: "📦",
	description: "",
	visibility: "public",
	image_urls: []
};
function YourItemsPage() {
	const qc = useQueryClient();
	const fn = useServerFn(listMyItems);
	const create = useServerFn(createItem);
	const del = useServerFn(deleteItem);
	const upd = useServerFn(updateItem);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [queue, setQueue] = (0, import_react.useState)([]);
	const [form, setForm] = (0, import_react.useState)({ ...EMPTY });
	const [search, setSearch] = (0, import_react.useState)("");
	const { data: items } = useQuery({
		queryKey: ["my-items"],
		queryFn: () => fn()
	});
	const listedFn = useServerFn(listMyListedItemIds);
	const { data: listedIds } = useQuery({
		queryKey: ["my-listed-item-ids"],
		queryFn: () => listedFn()
	});
	const listed = new Set(listedIds ?? []);
	const swappedFn = useServerFn(listMySwappedItemIds);
	const { data: swappedIds } = useQuery({
		queryKey: ["my-swapped-item-ids"],
		queryFn: () => swappedFn()
	});
	const swapped = new Set(swappedIds ?? []);
	const q = search.trim().toLowerCase();
	const visibleItems = (items ?? []).filter((i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.condition.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q));
	function openNew() {
		setEditingId(null);
		setForm({ ...EMPTY });
		setOpen(true);
	}
	function openEdit(item) {
		setEditingId(item.id);
		setForm({
			name: item.name,
			category: item.category,
			condition: item.condition,
			image_emoji: item.image_emoji,
			description: item.description ?? "",
			visibility: item.visibility,
			image_urls: item.image_urls ?? []
		});
		setOpen(true);
	}
	function onPickFiles(files) {
		if (!files || files.length === 0) return;
		const room = 8 - form.image_urls.length;
		const picked = Array.from(files).slice(0, Math.max(room, 0)).filter((f) => {
			if (f.size > 10 * 1024 * 1024) {
				toast.error(`${f.name} is over 10 MB`);
				return false;
			}
			return true;
		});
		setQueue((q) => [...q, ...picked]);
	}
	async function uploadCropped(file) {
		setUploading(true);
		try {
			const url = await uploadFileTo("listing-images", file);
			setForm((f) => ({
				...f,
				image_urls: [...f.image_urls, url]
			}));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	}
	const saveMut = useMutation({
		mutationFn: async () => {
			if (!form.name.trim()) throw new Error("Please add a name");
			if (form.image_urls.length === 0) throw new Error("Please add at least one photo");
			return editingId ? await upd({ data: {
				id: editingId,
				...form
			} }) : await create({ data: form });
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-items"] });
			setOpen(false);
			setForm({ ...EMPTY });
			toast.success(editingId ? "Item updated" : "Item added");
			setEditingId(null);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const delMut = useMutation({
		mutationFn: (id) => del({ data: { id } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["my-items"] })
	});
	const toggleVis = useMutation({
		mutationFn: (i) => upd({ data: {
			id: i.id,
			visibility: i.visibility
		} }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["my-items"] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			queue.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCropper, {
				file: queue[0],
				aspect: 1,
				title: "Crop item photo",
				onCancel: () => setQueue((q) => q.slice(1)),
				onDone: async (f) => {
					setQueue((q) => q.slice(1));
					await uploadCropped(f);
				}
			}, queue[0].name + queue.length),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1200px] flex-1 px-6 py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8 flex flex-wrap items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl font-black",
							children: "Your inventory"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-muted-foreground",
							children: "Items you own — list any of them directly to the browse page."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: openNew,
							className: "inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add item"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: search,
								onChange: (e) => setSearch(e.target.value),
								placeholder: "Search your items…",
								"aria-label": "Search your items",
								className: "w-full rounded-full border-2 border-primary/25 bg-card py-3 pl-11 pr-10 text-sm outline-none transition focus:border-primary"
							}),
							search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setSearch(""),
								"aria-label": "Clear search",
								className: "absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: [
							visibleItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "group flex flex-col rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/items/$id",
										params: { id: item.id },
										className: "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft to-white text-7xl",
										children: item.image_urls && item.image_urls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: item.image_urls[0],
											alt: item.name,
											className: "absolute inset-0 h-full w-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": true,
											children: item.image_emoji
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/items/$id",
												params: { id: item.id },
												className: "font-display text-lg font-bold truncate hover:text-primary",
												children: item.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => toggleVis.mutate({
													id: item.id,
													visibility: item.visibility === "public" ? "private" : "public"
												}),
												className: `shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.visibility === "public" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`,
												children: [item.visibility === "public" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-3 w-3" }), item.visibility]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.category }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.condition })
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex gap-2",
										children: [
											swapped.has(item.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-soft py-2 text-xs font-black uppercase text-primary",
												children: "Item swapped"
											}) : listed.has(item.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-muted py-2 text-xs font-black uppercase text-muted-foreground",
												children: "Already listed"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/new-listing",
												search: { fromItem: item.id },
												className: "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2 text-xs font-black uppercase text-primary-foreground shadow-md hover:shadow-glow transition",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "h-3.5 w-3.5" }), " List this"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => openEdit(item),
												className: "inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-primary/30 px-3 py-2 text-xs font-bold uppercase text-primary hover:bg-primary-soft transition",
												"aria-label": "Edit item",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													if (confirm("Delete this item?")) delMut.mutate(item.id);
												},
												className: "inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-destructive/30 px-3 py-2 text-xs font-bold uppercase text-destructive hover:bg-destructive/10 transition",
												"aria-label": "Delete item",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
											})
										]
									})
								]
							}, item.id)),
							items && items.length > 0 && visibleItems.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col-span-full rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground",
								children: [
									"No items match “",
									search,
									"”."
								]
							}),
							items?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "col-span-full rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground",
								children: "No items yet — add your first!"
							})
						]
					})
				]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-card-hover border-2 border-primary/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-black",
							children: editingId ? "Edit item" : "New item"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setOpen(false),
							className: "grid h-9 w-9 place-items-center rounded-full hover:bg-primary-soft",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.name,
								onChange: (e) => setForm({
									...form,
									name: e.target.value
								}),
								maxLength: 120,
								className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-muted-foreground",
									children: "Category"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: form.category,
									onChange: (e) => setForm({
										...form,
										category: e.target.value
									}),
									className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
									children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: c }, c))
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-muted-foreground",
									children: "Condition"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: form.condition,
									onChange: (e) => setForm({
										...form,
										condition: e.target.value
									}),
									className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
									children: CONDITIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: c }, c))
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Photos (required, up to 8)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 grid grid-cols-4 gap-2",
								children: [form.image_urls.map((url, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative aspect-square overflow-hidden rounded-xl border-2 border-primary/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: url,
										alt: `Photo ${i + 1}`,
										className: "h-full w-full object-cover"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setForm((f) => ({
											...f,
											image_urls: f.image_urls.filter((u) => u !== url)
										})),
										className: "absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white",
										"aria-label": "Remove photo",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
									})]
								}, url)), form.image_urls.length < 8 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/30 text-xs font-bold text-primary hover:bg-primary-soft",
									children: [uploading ? "…" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "image/*",
										multiple: true,
										className: "hidden",
										onChange: (e) => {
											onPickFiles(e.target.files);
											e.target.value = "";
										}
									})]
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Visibility"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: form.visibility,
								onChange: (e) => setForm({
									...form,
									visibility: e.target.value
								}),
								className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "public",
									children: "Public — visible on your profile"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "private",
									children: "Private — only you"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Description (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: form.description,
								onChange: (e) => setForm({
									...form,
									description: e.target.value
								}),
								rows: 2,
								maxLength: 1e3,
								className: "mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary resize-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => saveMut.mutate(),
								disabled: saveMut.isPending || !form.name || form.image_urls.length === 0 || uploading,
								className: "w-full rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
								children: editingId ? "Save changes" : "Add item"
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
export { YourItemsPage as component };
