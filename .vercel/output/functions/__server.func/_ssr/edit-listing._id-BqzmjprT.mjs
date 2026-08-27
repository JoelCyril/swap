import { r as __toESM } from "../_runtime.mjs";
import { x as useParams, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as OTHER_LOCATION, d as useServerFn, i as NEIGHBOURHOODS, n as CONDITIONS, r as EMIRATES, t as CATEGORIES } from "./db-types-Dz-qEZef.mjs";
import { i as Upload, t as X } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as uploadFileTo } from "./upload-COX85Ejj.mjs";
import { t as ImageCropper } from "./ImageCropper-DlevZXe0.mjs";
import { c as updateListing, i as getMyListing } from "./listings.functions-T0r7f8kn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/edit-listing._id-BqzmjprT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EditListingPage() {
	const { id } = useParams({ from: "/_authenticated/edit-listing/$id" });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const getFn = useServerFn(getMyListing);
	const update = useServerFn(updateListing);
	const { data: listing, isLoading } = useQuery({
		queryKey: ["my-listing", id],
		queryFn: () => getFn({ data: { id } })
	});
	const [form, setForm] = (0, import_react.useState)({
		title: "",
		description: "",
		category: "Electronics",
		condition: "Good",
		image_emoji: "📦",
		looking_for: "",
		emirate: "",
		image_urls: []
	});
	const [locationChoice, setLocationChoice] = (0, import_react.useState)(NEIGHBOURHOODS[0]);
	const [otherLocation, setOtherLocation] = (0, import_react.useState)("");
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [queue, setQueue] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!listing) return;
		setForm({
			title: listing.title,
			description: listing.description ?? "",
			category: listing.category,
			condition: listing.condition,
			image_emoji: listing.image_emoji,
			looking_for: listing.looking_for ?? "",
			emirate: listing.emirate ?? "",
			image_urls: listing.image_urls ?? []
		});
		const known = NEIGHBOURHOODS.includes(listing.location);
		setLocationChoice(known ? listing.location : OTHER_LOCATION);
		if (!known) setOtherLocation(listing.location);
	}, [listing]);
	const mut = useMutation({
		mutationFn: () => {
			const location = locationChoice === "Other" ? otherLocation.trim() : locationChoice;
			if (!location) throw new Error("Please enter a location");
			if (form.image_urls.length === 0) throw new Error("Please keep at least one photo");
			return update({ data: {
				id,
				...form,
				location
			} });
		},
		onSuccess: (res) => {
			queryClient.invalidateQueries({ queryKey: ["listing", id] });
			queryClient.invalidateQueries({ queryKey: ["my-listings"] });
			if (res?.withheld) toast.warning("Your edit was flagged for review", {
				description: "Please wait until a moderator approves your listing.",
				duration: 8e3
			});
			else toast.success("Listing successfully updated");
			navigate({
				to: "/listings/$id",
				params: { id }
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
						children: "Edit listing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted-foreground",
						children: "Update your listing details or photos."
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-8 text-sm text-muted-foreground",
						children: "Loading…"
					}) : !listing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-10 text-center text-muted-foreground",
						children: "This listing doesn't exist or isn't yours."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (e) => {
							e.preventDefault();
							mut.mutate();
						},
						className: "mt-8 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card",
						children: [
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
								className: "mt-1 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Photos (up to 8)"
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
								className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: mut.isPending || uploading,
								className: "w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
								children: mut.isPending ? "Saving…" : "Save changes"
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
export { EditListingPage as component };
