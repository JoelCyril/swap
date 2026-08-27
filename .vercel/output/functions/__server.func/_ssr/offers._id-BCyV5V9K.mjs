import { r as __toESM } from "../_runtime.mjs";
import { _ as Link, v as require_react_dom } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, l as handle, o as createSsrRpc, u as timeAgo } from "./db-types-Dz-qEZef.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BNoi36Qc.mjs";
import { o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { E as MapPin, P as Hourglass, S as Package, U as Check, W as Calendar, Y as ArrowRightLeft, p as Send, t as X, u as ShieldCheck, x as Paperclip, y as Plus, z as Clock } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as uploadFileTo } from "./upload-COX85Ejj.mjs";
import { c as listOwnerInventory } from "./items2.functions-ABkE3FIJ.mjs";
import { c as toggleListingItem, i as getOffer, n as confirmTradeCompletion, o as respondToOffer, s as reviseOfferItems, t as confirmItemsReceived } from "./offers.functions-DTjDoLub.mjs";
import { i as getTermsStatus, t as Route } from "./offers._id-kjuyk3lR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers._id-BCyV5V9K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var listMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ offer_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("e654f3933a58e7d942461609513a549fc8cec53cb8d19d826771e23bfde0aaea"));
var sendMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	offer_id: stringType().uuid(),
	body: stringType().max(2e3).default(""),
	attachment_urls: arrayType(stringType().url().max(2048)).max(4).default([])
}).refine((v) => v.body.trim().length > 0 || v.attachment_urls.length > 0, { message: "Write a message or attach a file." }).parse(d)).handler(createSsrRpc("190919c9591587f0e69ca09e3e1a05dff4372e8a7afb305e40cf4fec5f6c09a7"));
var markMessagesRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ offer_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("9ea16a04fa87d006c08c4a8b7122e0acb522d4d7fefab1ff2f26a4111282272b"));
var listMeetupProposals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ offer_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("a611de4ad7405c6f148700631c8e1f37cad224d69be349bc63d36900c51cba27"));
var proposeMeetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	offer_id: stringType().uuid(),
	place: stringType().min(2).max(200),
	meet_at: stringType().datetime(),
	note: stringType().max(500).default("")
}).parse(d)).handler(createSsrRpc("3feb5f43d4f8f9b66d19327bf692bdf050643ed7bf1917b0349eb6b586ed6c6f"));
var respondMeetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	action: enumType([
		"accept",
		"reject",
		"cancel"
	])
}).parse(d)).handler(createSsrRpc("5f5ae7e6f5b17441d343d7dba3841f172dcf852dbe267a748457d1f871f1a9ab"));
/** Each participant individually confirms the public-place safety agreement. */
var confirmMeetupSafety = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c9ee2cd1a464df5a4c6cf16a3eae71d698e14ad713bdc95ad87dddc72d142329"));
function OfferDetail() {
	const { id } = Route.useParams();
	const qc = useQueryClient();
	const get = useServerFn(getOffer);
	const respond = useServerFn(respondToOffer);
	const revise = useServerFn(reviseOfferItems);
	const confirmComplete = useServerFn(confirmTradeCompletion);
	const confirmReceived = useServerFn(confirmItemsReceived);
	const toggleListed = useServerFn(toggleListingItem);
	const list = useServerFn(listMessages);
	const markRead = useServerFn(markMessagesRead);
	const [otherTyping, setOtherTyping] = (0, import_react.useState)(false);
	const typingChan = (0, import_react.useRef)(null);
	const typingTimer = (0, import_react.useRef)(null);
	const lastSentTyping = (0, import_react.useRef)(0);
	const send = useServerFn(sendMessage);
	const listProposals = useServerFn(listMeetupProposals);
	const propose = useServerFn(proposeMeetup);
	const respondProp = useServerFn(respondMeetup);
	const confirmSafety = useServerFn(confirmMeetupSafety);
	const [text, setText] = (0, import_react.useState)("");
	const [files, setFiles] = (0, import_react.useState)([]);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const scrollRef = (0, import_react.useRef)(null);
	const [guardianAsk, setGuardianAsk] = (0, import_react.useState)(false);
	const [guardianOk, setGuardianOk] = (0, import_react.useState)(false);
	const [inventoryOf, setInventoryOf] = (0, import_react.useState)(null);
	const [addOpen, setAddOpen] = (0, import_react.useState)(false);
	const termsFn = useServerFn(getTermsStatus);
	const { data: terms } = useQuery({
		queryKey: ["terms-status"],
		queryFn: () => termsFn()
	});
	const isMinor = typeof terms?.age === "number" && terms.age < 18;
	const { data: offer } = useQuery({
		queryKey: ["offer", id],
		queryFn: () => get({ data: { id } })
	});
	const { data: messages } = useQuery({
		queryKey: ["messages", id],
		queryFn: () => list({ data: { offer_id: id } }),
		refetchInterval: 4e3
	});
	const { data: proposals } = useQuery({
		queryKey: ["meetup-proposals", id],
		queryFn: () => listProposals({ data: { offer_id: id } }),
		enabled: offer?.status === "accepted" || offer?.status === "completed",
		refetchInterval: 5e3
	});
	const viewerId = offer?.viewer_id;
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel(`offer-${id}`).on("broadcast", { event: "typing" }, ({ payload }) => {
			if (!payload || payload.userId === viewerId) return;
			setOtherTyping(true);
			if (typingTimer.current) clearTimeout(typingTimer.current);
			typingTimer.current = setTimeout(() => setOtherTyping(false), 3e3);
		}).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "messages",
			filter: `offer_id=eq.${id}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["messages", id] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "meetup_proposals",
			filter: `offer_id=eq.${id}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["meetup-proposals", id] });
			qc.invalidateQueries({ queryKey: ["offer", id] });
		}).subscribe();
		typingChan.current = channel;
		return () => {
			typingChan.current = null;
			supabase.removeChannel(channel);
		};
	}, [
		id,
		qc,
		viewerId
	]);
	(0, import_react.useEffect)(() => {
		if (!messages || messages.length === 0) return;
		if (messages.some((m) => m.sender_id !== viewerId && !m.read_at)) markRead({ data: { offer_id: id } }).catch(() => {});
	}, [
		messages,
		viewerId,
		id,
		markRead
	]);
	(0, import_react.useEffect)(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
	}, [messages, proposals]);
	const invalidateAll = () => {
		qc.invalidateQueries({ queryKey: ["offer", id] });
		qc.invalidateQueries({ queryKey: ["offers"] });
		qc.invalidateQueries({ queryKey: ["meetup-proposals", id] });
	};
	const respondMut = useMutation({
		mutationFn: (action) => respond({ data: {
			id,
			action
		} }),
		onSuccess: () => {
			invalidateAll();
			toast.success("Updated");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const reviseMut = useMutation({
		mutationFn: (ids) => revise({ data: {
			id,
			offered_item_ids: ids
		} }),
		onSuccess: () => {
			invalidateAll();
			setAddOpen(false);
			toast.success("Your side of the trade was updated");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const listedMut = useMutation({
		mutationFn: (removed) => toggleListed({ data: {
			id,
			removed
		} }),
		onSuccess: () => {
			invalidateAll();
			toast.success("Your side of the trade was updated");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const completeMut = useMutation({
		mutationFn: () => confirmComplete({ data: { id } }),
		onSuccess: (r) => {
			invalidateAll();
			toast.success(r?.both ? "Trade marked completed — now confirm you received the items" : "Waiting on the other side to confirm");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const receivedMut = useMutation({
		mutationFn: () => confirmReceived({ data: { id } }),
		onSuccess: (r) => {
			invalidateAll();
			toast.success(r?.both ? "Swap complete 🎉" : "Receipt confirmed — waiting on the other side");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const safetyMut = useMutation({
		mutationFn: (pid) => confirmSafety({ data: { id: pid } }),
		onSuccess: () => invalidateAll(),
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	const sendMut = useMutation({
		mutationFn: async () => {
			let urls = [];
			if (files.length) {
				setUploading(true);
				try {
					urls = await Promise.all(files.map((f) => uploadFileTo("listing-images", f)));
				} finally {
					setUploading(false);
				}
			}
			return send({ data: {
				offer_id: id,
				body: text.trim(),
				attachment_urls: urls
			} });
		},
		onSuccess: () => {
			setText("");
			setFiles([]);
			qc.invalidateQueries({ queryKey: ["messages", id] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Message not sent")
	});
	if (!offer) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-8 text-center text-muted-foreground",
			children: "Loading offer…"
		})]
	});
	const myId = offer.viewer_id;
	const isTo = offer.to_user === myId;
	const other = isTo ? offer.from_profile : offer.to_profile;
	const canAct = offer.status === "pending";
	const accepted = offer.status === "accepted";
	const chatOpen = accepted || offer.status === "completed";
	const items = offer.items ?? [];
	const removedItems = offer.removed_items ?? [];
	const recipientItems = offer.recipient_items ?? [];
	const removedRecipientItems = offer.removed_recipient_items ?? [];
	const confirmedProposal = (proposals ?? []).find((p) => p.status === "accepted" && (p.safety_confirmed_by ?? []).includes(offer.from_user) && (p.safety_confirmed_by ?? []).includes(offer.to_user));
	const acceptedProposal = (proposals ?? []).find((p) => p.status === "accepted");
	const pendingProposal = (proposals ?? []).find((p) => p.status === "pending");
	const completeConfirmed = (offer.complete_confirmed_by ?? []).filter(Boolean);
	const receivedConfirmed = (offer.received_confirmed_by ?? []).filter(Boolean);
	const iConfirmedComplete = completeConfirmed.includes(myId);
	const iConfirmedReceived = receivedConfirmed.includes(myId);
	const bothReceived = receivedConfirmed.includes(offer.from_user) && receivedConfirmed.includes(offer.to_user);
	const statusLabel = offer.status === "completed" ? bothReceived ? "Completed" : "Awaiting item receipt" : offer.status === "accepted" ? confirmedProposal ? "Meetup confirmed" : "Negotiating" : offer.status;
	const toImgs = (list, removed, mine) => [...list.map((it) => ({
		id: it.id,
		src: it.image_urls?.[0] ?? null,
		emoji: it.image_emoji,
		name: it.name,
		to: {
			kind: "item",
			id: it.id
		},
		canRemove: mine && accepted
	})), ...removed.map((it) => ({
		id: it.id,
		src: it.image_urls?.[0] ?? null,
		emoji: it.image_emoji,
		name: it.name,
		removed: true,
		to: {
			kind: "item",
			id: it.id
		}
	}))];
	const listingRemoved = Boolean(offer.listing_removed);
	const listingImgs = [{
		src: offer.listing?.image_urls?.[0] ?? null,
		emoji: offer.listing?.image_emoji ?? "📦",
		name: offer.listing?.title ?? "Listing unavailable",
		removed: listingRemoved,
		to: offer.listing?.id ? {
			kind: "listing",
			id: offer.listing.id
		} : void 0,
		canRemove: isTo && accepted
	}];
	const senderImgs = toImgs(items, removedItems, !isTo);
	const ownerExtraImgs = toImgs(recipientItems, removedRecipientItems, isTo);
	const giveImgs = isTo ? [...listingImgs, ...ownerExtraImgs] : senderImgs;
	const getImgs = isTo ? senderImgs : [...listingImgs, ...ownerExtraImgs];
	const myItemIds = (isTo ? recipientItems : items).map((i) => i.id);
	const giveOwner = isTo ? offer.listing?.owner ?? offer.to_profile : offer.from_profile;
	const getOwner = isTo ? offer.from_profile : offer.listing?.owner ?? offer.to_profile;
	const removeImg = (img) => {
		if (img.to?.kind === "listing") {
			listedMut.mutate(!listingRemoved);
			return;
		}
		if (!img.id) return;
		reviseMut.mutate(myItemIds.filter((i) => i !== img.id));
	};
	const timeline = [...(messages ?? []).map((m) => ({
		kind: "msg",
		at: m.created_at,
		data: m
	})), ...(proposals ?? []).map((p) => ({
		kind: "meetup",
		at: p.created_at,
		data: p
	}))].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1300px] flex-1 px-4 py-6 sm:py-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "font-display text-xl font-black sm:text-2xl",
							children: ["Trade with ", handle(other)]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold capitalize text-primary",
								children: statusLabel
							})]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${!accepted || confirmedProposal ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"}`,
							children: offer.status === "completed" ? bothReceived ? "Swap complete 🎉" : iConfirmedReceived ? `Waiting on ${handle(other)} to confirm receipt` : "Confirm you received the items" : !accepted ? offer.status : iConfirmedComplete ? `Waiting on ${handle(other)} to confirm completion` : confirmedProposal ? "Meeting confirmed" : "Negotiating — adjust items or propose a meetup"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid min-w-0 gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidePanel, {
								heading: "You give",
								images: giveImgs,
								owner: giveOwner,
								onAdd: accepted ? () => setAddOpen(true) : void 0,
								onRemove: accepted ? removeImg : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-card h-[70vh] min-h-[420px] lg:h-[640px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 border-b border-border p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid h-9 w-9 place-items-center overflow-hidden rounded-full text-white font-bold",
												style: { backgroundColor: other?.avatar_color },
												children: other?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: other.avatar_url,
													alt: "",
													className: "h-full w-full object-cover"
												}) : (other?.display_name || other?.username)?.[0]?.toUpperCase()
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "flex-1 text-sm font-bold",
												children: handle(other)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1 text-[10px] font-black uppercase text-primary",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "h-3 w-3" }),
													" ",
													statusLabel
												]
											})
										]
									}),
									confirmedProposal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-b border-border bg-primary-soft px-4 py-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-black uppercase text-primary",
												children: "📌 Confirmed meetup"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm font-semibold flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }),
													" ",
													confirmedProposal.place
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }),
													" ",
													new Date(confirmedProposal.meet_at).toLocaleString()
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										ref: scrollRef,
										className: "flex-1 space-y-2 overflow-y-auto p-4",
										children: [
											offer.message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "inline-block rounded-2xl bg-primary-soft px-4 py-2 text-xs italic text-primary",
													children: [
														"Initial message: \"",
														offer.message,
														"\""
													]
												})
											}),
											timeline.map((entry) => entry.kind === "msg" ? (() => {
												const m = entry.data;
												const mine = m.sender_id === myId;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `flex ${mine ? "justify-end" : "justify-start"}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`,
														children: [
															m.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "break-words",
																children: m.body
															}),
															(m.attachment_urls ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "mt-1 grid gap-1.5",
																children: (m.attachment_urls ?? []).map((u) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
																	src: u,
																	controls: true,
																	className: "max-h-56 w-full rounded-xl bg-black"
																}, u) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																	href: u,
																	target: "_blank",
																	rel: "noreferrer",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																		src: u,
																		alt: "attachment",
																		className: "max-h-56 w-full rounded-xl object-cover"
																	})
																}, u))
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: `mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`,
																children: [timeAgo(m.created_at), mine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "ml-1",
																	children: ["· ", m.read_at ? "Seen" : "Delivered"]
																})]
															})
														]
													})
												}, m.id);
											})() : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeetupCard, {
												p: entry.data,
												myId,
												fromUser: offer.from_user,
												toUser: offer.to_user,
												onRespond: (action) => respondProp({ data: {
													id: entry.data.id,
													action
												} }).then(invalidateAll).catch((e) => toast.error(e instanceof Error ? e.message : "Failed")),
												onSafety: () => safetyMut.mutate(entry.data.id)
											}, entry.data.id)),
											timeline.length === 0 && !chatOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "py-8 text-center text-xs text-muted-foreground",
												children: "🔒 Chat unlocks once the offer is accepted."
											}),
											otherTyping && chatOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[11px] italic text-muted-foreground",
												children: [handle(other), " is typing…"]
											}),
											timeline.length === 0 && chatOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "py-8 text-center text-xs text-muted-foreground",
												children: "Say hi and coordinate your swap 👋"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t border-border p-3",
										children: [files.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 flex flex-wrap gap-2",
											children: files.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex max-w-[160px] items-center gap-1 rounded-full bg-muted px-3 py-1 text-[11px]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: f.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setFiles((prev) => prev.filter((_, x) => x !== i)),
													"aria-label": "Remove",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
												})]
											}, f.name + i))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											onSubmit: (e) => {
												e.preventDefault();
												if (text.trim() || files.length) sendMut.mutate();
											},
											className: "flex gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: `grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-primary/20 text-primary ${chatOpen ? "cursor-pointer hover:bg-primary-soft" : "opacity-50"}`,
													title: "Attach photos or videos",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "file",
														accept: "image/*,video/*",
														multiple: true,
														disabled: !chatOpen,
														className: "hidden",
														onChange: (e) => {
															const picked = Array.from(e.target.files ?? []).slice(0, 4);
															setFiles((prev) => [...prev, ...picked].slice(0, 4));
															e.target.value = "";
														}
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													value: text,
													onChange: (e) => {
														setText(e.target.value);
														const now = Date.now();
														if (chatOpen && now - lastSentTyping.current > 1500) {
															lastSentTyping.current = now;
															typingChan.current?.send({
																type: "broadcast",
																event: "typing",
																payload: { userId: viewerId }
															});
														}
													},
													placeholder: chatOpen ? "Type a message…" : "Chat locked until the offer is accepted",
													maxLength: 2e3,
													disabled: !chatOpen,
													className: "min-w-0 flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "submit",
													disabled: !chatOpen || !text.trim() && !files.length || sendMut.isPending || uploading,
													className: "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground disabled:opacity-50",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
												})
											]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidePanel, {
									heading: "You get",
									images: getImgs,
									owner: getOwner,
									onViewInventory: () => setInventoryOf(isTo ? {
										id: offer.from_user,
										label: handle(offer.from_profile)
									} : {
										id: offer.to_user,
										label: handle(offer.to_profile)
									})
								}), accepted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProposeMeetup, {
									disabledReason: null,
									label: acceptedProposal || pendingProposal ? "Propose a change" : "Propose meetup",
									onPropose: (p) => propose({ data: {
										offer_id: id,
										...p
									} }).then(() => {
										invalidateAll();
										toast.success("Proposal sent");
									}).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
						children: [
							canAct && isTo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => isMinor ? setGuardianAsk(true) : respondMut.mutate("accept"),
									disabled: respondMut.isPending,
									className: "flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground shadow-glow",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Accept"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => respondMut.mutate("waitlist"),
									disabled: respondMut.isPending,
									className: "flex items-center justify-center gap-2 rounded-full border-2 border-yellow-500/40 py-2.5 text-sm font-black uppercase text-yellow-700 hover:bg-yellow-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hourglass, { className: "h-4 w-4" }), " Waitlist"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => respondMut.mutate("decline"),
									disabled: respondMut.isPending,
									className: "flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive hover:bg-destructive/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), " Decline"]
								})
							] }),
							canAct && !isTo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => respondMut.mutate("withdraw"),
								disabled: respondMut.isPending,
								className: "flex items-center justify-center gap-2 rounded-full border-2 border-muted-foreground/30 py-2.5 text-sm font-black uppercase text-muted-foreground hover:bg-muted",
								children: "Withdraw offer"
							}),
							offer.status === "waitlisted" && isTo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => isMinor ? setGuardianAsk(true) : respondMut.mutate("accept"),
								className: "flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Accept now"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => respondMut.mutate("decline"),
								className: "flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), " Decline"]
							})] }),
							accepted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => completeMut.mutate(),
								disabled: iConfirmedComplete || completeMut.isPending,
								className: "flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground disabled:opacity-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), iConfirmedComplete ? "Completion confirmed" : "Mark trade completed"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									if (confirm(isTo ? "Reject this swap? The listing goes back to active." : "Withdraw from this swap?")) respondMut.mutate(isTo ? "decline" : "withdraw");
								},
								className: "flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 py-2.5 text-sm font-black uppercase text-destructive hover:bg-destructive/10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }),
									" ",
									isTo ? "Reject offer" : "Withdraw"
								]
							})] }),
							offer.status === "completed" && !bothReceived && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => receivedMut.mutate(),
								disabled: iConfirmedReceived || receivedMut.isPending,
								className: "flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase text-primary-foreground disabled:opacity-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), iConfirmedReceived ? "Receipt confirmed" : "I received the items"]
							})
						]
					}),
					(accepted || offer.status === "completed" && !bothReceived) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 space-y-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/40 p-4 text-center text-xs font-semibold text-muted-foreground",
							children: offer.status === "completed" ? `Trade marked completed. Both sides must confirm they received the items — you: ${iConfirmedReceived ? "✅" : "⏳"} · ${handle(other)}: ${receivedConfirmed.includes(other?.id) ? "✅" : "⏳"}` : `Completion needs both sides — you: ${iConfirmedComplete ? "✅" : "⏳"} · ${handle(other)}: ${completeConfirmed.includes(other?.id) ? "✅" : "⏳"}`
						})
					})
				]
			}),
			inventoryOf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InventoryModal, {
				ownerId: inventoryOf.id,
				label: inventoryOf.label,
				onClose: () => setInventoryOf(null)
			}),
			addOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddItemsModal, {
				ownerId: myId,
				selected: myItemIds,
				pending: reviseMut.isPending,
				onClose: () => setAddOpen(false),
				onSave: (ids) => reviseMut.mutate(ids)
			}),
			guardianAsk && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 grid place-items-center bg-black/60 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-black",
							children: "Parental permission required"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 flex items-start gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: guardianOk,
								onChange: (e) => setGuardianOk(e.target.checked),
								className: "mt-0.5 h-4 w-4 accent-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "By checking this box, you confirm that you have obtained permission from a parent or legal guardian to participate in this trade." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setGuardianAsk(false);
									setGuardianOk(false);
								},
								className: "flex-1 rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase text-primary",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: !guardianOk || respondMut.isPending,
								onClick: () => {
									setGuardianAsk(false);
									setGuardianOk(false);
									respondMut.mutate("accept");
								},
								className: "flex-1 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase text-primary-foreground disabled:opacity-50",
								children: "Confirm & accept"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function SidePanel({ heading, images, owner, onViewInventory, onAdd, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-center text-[11px] font-black uppercase tracking-wider text-primary",
				children: heading
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap justify-center gap-2",
				children: [
					images.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-primary/30 text-xs text-muted-foreground",
						children: "None"
					}),
					images.map((img, i) => {
						const tile = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `relative grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-2 bg-primary-soft text-3xl ${img.removed ? "border-destructive/50 opacity-60" : "border-primary/20"}`,
							children: [img.src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: img.src,
								alt: img.name,
								className: "h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								children: img.emoji ?? "📦"
							}), img.removed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute inset-0 grid place-items-center bg-destructive/20 text-destructive",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-8 w-8" })
							})]
						});
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative w-20",
							children: [
								img.to ? img.to.kind === "item" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/items/$id",
									params: { id: img.to.id },
									title: `View ${img.name}`,
									children: tile
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/listings/$id",
									params: { id: img.to.id },
									title: `View ${img.name}`,
									children: tile
								}) : tile,
								onRemove && img.canRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onRemove(img),
									title: img.removed ? "Add back to the trade" : "Remove from the trade",
									"aria-label": img.removed ? `Add ${img.name} back to the trade` : `Remove ${img.name} from the trade`,
									className: `absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-card text-white shadow-card ${img.removed ? "bg-primary" : "bg-destructive"}`,
									children: img.removed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `mt-1 truncate text-xs font-semibold ${img.removed ? "text-destructive line-through" : ""}`,
									children: img.name
								})
							]
						}, img.id ?? i);
					}),
					onAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onAdd,
						title: "Add an item from your inventory",
						"aria-label": "Add an item from your inventory",
						className: "grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary-soft",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-7 w-7" })
					})
				]
			}),
			owner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/profile/$username",
				params: { username: owner.username },
				className: "mt-2 block text-center text-xs font-medium text-primary hover:underline",
				children: handle(owner)
			}),
			onViewInventory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onViewInventory,
				className: "mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/30 py-2 text-[11px] font-black uppercase text-primary hover:bg-primary-soft",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-3.5 w-3.5" }), " View inventory"]
			})
		]
	});
}
function MeetupCard({ p, myId, fromUser, toUser, onRespond, onSafety }) {
	const mine = p.proposed_by === myId;
	const confirmedBy = (p.safety_confirmed_by ?? []).filter(Boolean);
	const bothSafe = confirmedBy.includes(fromUser) && confirmedBy.includes(toUser);
	const iConfirmed = myId ? confirmedBy.includes(myId) : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-2xl border-2 p-3 text-sm ${p.status === "accepted" ? bothSafe ? "border-primary/40 bg-primary-soft" : "border-yellow-500/40 bg-yellow-50" : p.status === "pending" ? "border-yellow-500/40 bg-yellow-50" : "border-border bg-muted"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3 w-3" }),
					"Meetup ",
					p.status === "accepted" && !bothSafe ? "awaiting safety confirmation" : p.status
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 flex items-center gap-1 font-bold",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }),
					" ",
					p.place
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1 text-xs text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }),
					" ",
					new Date(p.meet_at).toLocaleString()
				]
			}),
			p.note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs italic",
				children: [
					"\"",
					p.note,
					"\""
				]
			}),
			p.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-2",
				children: mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onRespond("cancel"),
					className: "flex-1 rounded-full border border-muted-foreground/30 px-3 py-1 text-xs font-bold text-muted-foreground",
					children: "Cancel"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onRespond("accept"),
					className: "flex-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground",
					children: "Accept"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onRespond("reject"),
					className: "flex-1 rounded-full border border-destructive/40 px-3 py-1 text-xs font-bold text-destructive",
					children: "Reject"
				})] })
			}),
			p.status === "accepted" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: iConfirmed,
							disabled: iConfirmed,
							onChange: () => onSafety(),
							className: "mt-0.5 h-4 w-4 accent-primary"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "I will only meet in a public place and I am responsible for my own safety during this trade." })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-3 text-[11px] font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: confirmedBy.includes(fromUser) ? "text-primary" : "text-muted-foreground",
							children: [confirmedBy.includes(fromUser) ? "✅" : "⏳", " Sender"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: confirmedBy.includes(toUser) ? "text-primary" : "text-muted-foreground",
							children: [confirmedBy.includes(toUser) ? "✅" : "⏳", " Recipient"]
						})]
					}),
					bothSafe && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1 text-xs font-black uppercase text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3.5 w-3.5" }), " Confirmed"]
					})
				]
			})
		]
	});
}
function ProposeMeetup({ label, disabledReason, onPropose }) {
	const [place, setPlace] = (0, import_react.useState)("");
	const [meetAt, setMeetAt] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-2xl border-2 border-primary/20 bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-xs font-black uppercase tracking-wider",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4 text-primary" }),
					" ",
					label
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: place,
				onChange: (e) => setPlace(e.target.value),
				placeholder: "Public place (e.g. Dubai Mall entrance)",
				className: "w-full rounded-lg border-2 border-primary/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "datetime-local",
				value: meetAt,
				onChange: (e) => setMeetAt(e.target.value),
				className: "w-full rounded-lg border-2 border-primary/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: note,
				onChange: (e) => setNote(e.target.value),
				placeholder: "Optional note",
				rows: 2,
				maxLength: 500,
				className: "w-full resize-none rounded-lg border-2 border-primary/20 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				disabled: !!disabledReason,
				onClick: () => {
					if (!place || !meetAt) return toast.error("Place and time required");
					onPropose({
						place,
						meet_at: new Date(meetAt).toISOString(),
						note
					});
					setPlace("");
					setMeetAt("");
					setNote("");
				},
				className: "w-full rounded-full bg-gradient-primary py-2 text-xs font-black uppercase text-primary-foreground disabled:opacity-50",
				children: "Send proposal"
			})
		]
	});
}
function Modal({ children, onClose }) {
	(0, import_react.useEffect)(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onClick: (e) => e.stopPropagation(),
			className: "max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card",
			children
		})
	}), document.body);
}
function InventoryModal({ ownerId, label, onClose }) {
	const fn = useServerFn(listOwnerInventory);
	const { data } = useQuery({
		queryKey: ["owner-inventory", ownerId],
		queryFn: () => fn({ data: { owner_id: ownerId } })
	});
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const rows = data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-lg font-black",
					children: [label, "'s inventory"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "rounded-full p-1 hover:bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				})]
			}),
			rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-6 text-center text-sm text-muted-foreground",
				children: "No public items."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: rows.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border-2 border-primary/20 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setOpenId(openId === it.id ? null : it.id),
						className: "flex w-full items-center gap-3 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-2xl",
							children: it.image_urls?.[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: it.image_urls[0],
								alt: "",
								className: "h-full w-full object-cover"
							}) : it.image_emoji
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-bold",
								children: it.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[10px] uppercase text-muted-foreground",
								children: [
									it.category,
									" · ",
									it.condition
								]
							})]
						})]
					}), openId === it.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 border-t border-border pt-2 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: it.description || "No description." }),
							it.image_urls?.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex gap-2 overflow-x-auto",
								children: it.image_urls.slice(1).map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: u,
									alt: "",
									className: "h-16 w-16 rounded-lg object-cover"
								}, u))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/items/$id",
								params: { id: it.id },
								className: "mt-2 inline-block font-bold text-primary hover:underline",
								children: "Open full item page"
							})
						]
					})]
				}, it.id))
			})
		]
	});
}
function AddItemsModal({ ownerId, selected, pending, onClose, onSave }) {
	const fn = useServerFn(listOwnerInventory);
	const { data } = useQuery({
		queryKey: ["owner-inventory", ownerId],
		queryFn: () => fn({ data: { owner_id: ownerId } })
	});
	const [ids, setIds] = (0, import_react.useState)(selected);
	const rows = (0, import_react.useMemo)(() => data ?? [], [data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-black",
					children: "Update your side"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "rounded-full p-1 hover:bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-xs text-muted-foreground",
				children: "Tick items from your inventory to add them to your side of the trade, or untick to take them out."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [rows.map((it) => {
					const on = ids.includes(it.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: `flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${on ? "border-primary bg-primary-soft" : "border-primary/20"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: on,
								onChange: () => setIds(on ? ids.filter((x) => x !== it.id) : [...ids, it.id]),
								className: "h-4 w-4 accent-primary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-xl",
								children: it.image_urls?.[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: it.image_urls[0],
									alt: "",
									className: "h-full w-full object-cover"
								}) : it.image_emoji
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `min-w-0 flex-1 truncate text-sm font-semibold ${!on && selected.includes(it.id) ? "text-destructive line-through" : ""}`,
								children: it.name
							})
						]
					}, it.id);
				}), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-4 text-center text-sm text-muted-foreground",
					children: "No items available."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "flex-1 rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase text-primary",
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: ids.length === 0 || pending,
					onClick: () => onSave(ids),
					className: "flex-1 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase text-primary-foreground disabled:opacity-50",
					children: "Save"
				})]
			})
		]
	});
}
//#endregion
export { OfferDetail as component };
