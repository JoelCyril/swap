import { r as __toESM } from "../_runtime.mjs";
import { b as useSearch, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as OTHER_LOCATION, d as useServerFn, i as NEIGHBOURHOODS, n as CONDITIONS, r as EMIRATES, t as CATEGORIES } from "./db-types-Dz-qEZef.mjs";
import { i as Upload, t as X } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as uploadFileTo } from "./upload-COX85Ejj.mjs";
import { t as ImageCropper } from "./ImageCropper-DlevZXe0.mjs";
import { t as createListing } from "./listings.functions-T0r7f8kn.mjs";
import { a as listMyItems, o as listMyListedItemIds, t as createItem } from "./items2.functions-ABkE3FIJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-listing-B8g5-WKC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NewListingPage() {
	const navigate = useNavigate();
	const { fromItem } = useSearch({ from: "/_authenticated/new-listing" });
	const create = useServerFn(createListing);
	const createInventoryItem = useServerFn(createItem);
	const myItemsFn = useServerFn(listMyItems);
	const { data: myItems } = useQuery({
		queryKey: ["my-items"],
		queryFn: () => myItemsFn()
	});
	const listedFn = useServerFn(listMyListedItemIds);
	const { data: listedIds } = useQuery({
		queryKey: ["my-listed-item-ids"],
		queryFn: () => listedFn()
	});
	const listedSet = new Set(listedIds ?? []);
	const [form, setForm] = (0, import_react.useState)({
		title: "",
		description: "",
		category: "Electronics",
		condition: "Good",
		image_emoji: "📦",
		location: NEIGHBOURHOODS[0],
		emirate: "",
		looking_for: "",
		item_id: null,
		image_urls: []
	});
	const [locationChoice, setLocationChoice] = (0, import_react.useState)(NEIGHBOURHOODS[0]);
	const [otherLocation, setOtherLocation] = (0, import_react.useState)("");
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [queue, setQueue] = (0, import_react.useState)([]);
	const [saveAsItem, setSaveAsItem] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!fromItem || !myItems) return;
		const it = myItems.find((i) => i.id === fromItem);
		if (!it) return;
		setForm((f) => ({
			...f,
			title: it.name,
			description: it.description ?? "",
			category: it.category,
			condition: it.condition,
			image_emoji: it.image_emoji,
			item_id: it.id,
			image_urls: it.image_urls ?? []
		}));
	}, [fromItem, myItems]);
	const mut = useMutation({
		mutationFn: async () => {
			const location = locationChoice === "Other" ? otherLocation.trim() : locationChoice;
			if (!location) throw new Error("Please enter a location");
			if (!form.emirate) throw new Error("Please select an emirate");
			if (form.image_urls.length === 0) throw new Error("Please add at least one photo");
			const item = form.item_id ? null : saveAsItem ? await createInventoryItem({ data: {
				name: form.title,
				category: form.category,
				condition: form.condition,
				image_emoji: form.image_emoji,
				description: form.description,
				visibility: "public",
				image_urls: form.image_urls
			} }) : null;
			return create({ data: {
				...form,
				item_id: form.item_id ?? item?.id ?? null,
				location
			} });
		},
		onSuccess: (row) => {
			if (row.withheld) {
				const reason = String(row.moderation_note ?? "prohibited content").replace(/\s+Matched:.*$/, "");
				toast.warning(`Your listing was flagged for: ${reason}`, {
					description: "Please wait until a moderator approves your listing.",
					duration: 8e3
				});
			} else toast.success("Listing successfully created", { description: "It is live on the browse page now." });
			navigate({
				to: "/listings/$id",
				params: { id: row.id }
			});
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			queue.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCropper, {
				file: queue[0],
				aspect: 4 / 3,
				title: "Crop listing photo",
				onCancel: () => setQueue((q) => q.slice(1)),
				onDone: async (f) => {
					setQueue((q) => q.slice(1));
					await uploadCropped(f);
				}
			}, queue[0].name + queue.length),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-2xl flex-1 px-6 py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl font-black",
						children: "New listing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted-foreground",
						children: "Post an item you're willing to swap."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (e) => {
							e.preventDefault();
							mut.mutate();
						},
						className: "mt-8 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card",
						children: [
							(myItems ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/40 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold uppercase text-muted-foreground",
									children: "Start from your inventory"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex gap-2 overflow-x-auto pb-1",
									children: (myItems ?? []).filter((it) => !listedSet.has(it.id)).map((it) => {
										const picked = form.item_id === it.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => picked ? setForm((f) => ({
												...f,
												item_id: null
											})) : setForm((f) => ({
												...f,
												title: it.name,
												description: it.description ?? "",
												category: it.category,
												condition: it.condition,
												image_emoji: it.image_emoji,
												item_id: it.id,
												image_urls: it.image_urls ?? []
											})),
											className: `w-24 shrink-0 rounded-2xl border-2 bg-card p-2 text-left transition ${picked ? "border-primary shadow-glow" : "border-primary/20 hover:border-primary"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "grid aspect-square place-items-center overflow-hidden rounded-xl bg-primary-soft text-2xl",
												children: it.image_urls?.[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: it.image_urls[0],
													alt: it.name,
													className: "h-full w-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													"aria-hidden": true,
													children: it.image_emoji
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block truncate text-[11px] font-bold",
												children: it.name
											})]
										}, it.id);
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								maxLength: 120,
								value: form.title,
								onChange: (e) => setForm({
									...form,
									title: e.target.value
								}),
								className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 4,
								maxLength: 2e3,
								value: form.description,
								onChange: (e) => setForm({
									...form,
									description: e.target.value
								}),
								className: "mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary resize-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Photos (required, up to 8)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 grid grid-cols-4 gap-2",
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
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
									})]
								}, url)), form.image_urls.length < 8 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary-soft",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "image/*",
										multiple: true,
										hidden: true,
										onChange: (e) => onPickFiles(e.target.files)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center gap-1 text-xs font-bold uppercase",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }), uploading ? "…" : "Add"]
									})]
								})]
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-muted-foreground",
									children: "Emirate"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									required: true,
									value: form.emirate,
									onChange: (e) => setForm({
										...form,
										emirate: e.target.value
									}),
									className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Select emirate"
									}), EMIRATES.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: name,
										children: name
									}, name))]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold uppercase text-muted-foreground",
										children: "Neighbourhood"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: locationChoice,
										onChange: (e) => setLocationChoice(e.target.value),
										className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
										children: [NEIGHBOURHOODS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: n }, n)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: OTHER_LOCATION,
											children: "Other (type your own)"
										})]
									}),
									locationChoice === "Other" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										required: true,
										placeholder: "Enter your neighbourhood",
										maxLength: 120,
										value: otherLocation,
										onChange: (e) => setOtherLocation(e.target.value),
										className: "mt-2 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
									})
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Looking for (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								maxLength: 500,
								value: form.looking_for,
								onChange: (e) => setForm({
									...form,
									looking_for: e.target.value
								}),
								placeholder: "e.g. Wireless headphones, board games…",
								className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
							})] }),
							!form.item_id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-primary/20 bg-primary-soft/30 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: saveAsItem,
									onChange: (e) => setSaveAsItem(e.target.checked),
									className: "mt-0.5 h-4 w-4 accent-primary"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-bold",
									children: "Save this as one of my items"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block text-xs text-muted-foreground",
									children: "You can offer it in future swaps."
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: mut.isPending || uploading || form.image_urls.length === 0,
								className: "w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
								children: mut.isPending ? "Publishing…" : "Publish listing"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { NewListingPage as component };
