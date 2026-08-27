import { r as __toESM } from "../_runtime.mjs";
import { _ as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, r as EMIRATES } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { B as CircleUser, I as FileText, J as ArrowRight, K as Bell, N as Image, i as Upload, k as Lock, n as User, o as Trash2, t as X } from "../_libs/lucide-react.mjs";
import { a as deleteMyAccount, n as Navbar, o as getMyProfile, p as updateMyProfile, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as uploadFileTo } from "./upload-COX85Ejj.mjs";
import { t as ImageCropper } from "./ImageCropper-DlevZXe0.mjs";
import { a as setInventoryPrivacy, i as listBlockedUsers, n as getNotificationPrefs, o as unblockUser, s as updateNotificationPrefs, t as blockUser } from "./settings.functions-CRzd-yIT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BjGSUeFm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		key: "profile",
		label: "Profile",
		icon: CircleUser
	},
	{
		key: "notifications",
		label: "Notifications",
		icon: Bell
	},
	{
		key: "privacy",
		label: "Account Privacy",
		icon: Lock
	},
	{
		key: "terms",
		label: "Terms of Conditions",
		icon: FileText
	}
];
var FALLBACK_COLOR = "oklch(0.75 0.15 55)";
function SettingsPage() {
	const [tab, setTab] = (0, import_react.useState)("profile");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-6 md:flex-row md:gap-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "md:w-64 md:shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-2 pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground",
							children: "\n"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "flex gap-2 overflow-x-auto md:flex-col md:overflow-visible",
							children: TABS.map((t) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setTab(t.key),
									className: `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition md:w-full ${tab === t.key ? "border-2 border-primary/30 bg-primary-soft text-primary" : "border-2 border-transparent text-foreground hover:bg-muted"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(t.icon, { className: "h-5 w-5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "whitespace-nowrap",
										children: t.label
									})]
								}, t.key);
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "min-w-0 flex-1",
						children: [
							tab === "profile" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileTab, {}),
							tab === "notifications" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationsTab, {}),
							tab === "privacy" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrivacyTab, {}),
							tab === "terms" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TermsTab, {})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function ProfileTab() {
	const qc = useQueryClient();
	const me = useServerFn(getMyProfile);
	const update = useServerFn(updateMyProfile);
	const { data } = useQuery({
		queryKey: ["me"],
		queryFn: () => me()
	});
	const navigate = useNavigate();
	const deleteFn = useServerFn(deleteMyAccount);
	const [form, setForm] = (0, import_react.useState)({
		username: "",
		emirate: "",
		full_name: "",
		birthday: "",
		location: "",
		bio: "",
		avatar_url: null,
		banner_url: null
	});
	const [uploadingAvatar, setUploadingAvatar] = (0, import_react.useState)(false);
	const [uploadingBanner, setUploadingBanner] = (0, import_react.useState)(false);
	const [pending, setPending] = (0, import_react.useState)(null);
	const del = useMutation({
		mutationFn: () => deleteFn({ data: { confirm: "DELETE" } }),
		onSuccess: async () => {
			await supabase.auth.signOut();
			qc.clear();
			toast.success("Account deleted");
			navigate({
				to: "/listings",
				replace: true
			});
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete account")
	});
	(0, import_react.useEffect)(() => {
		if (data?.profile) setForm({
			username: data.profile.username ?? "",
			emirate: data.profile.emirate ?? "",
			full_name: data.private?.full_name ?? "",
			birthday: data.private?.birthday ?? "",
			location: data.profile.location ?? "",
			bio: data.profile.bio ?? "",
			avatar_url: data.profile.avatar_url ?? null,
			banner_url: data.profile.banner_url ?? null
		});
	}, [data]);
	const mut = useMutation({
		mutationFn: () => update({ data: {
			username: form.username.trim(),
			bio: form.bio,
			avatar_url: form.avatar_url,
			banner_url: form.banner_url,
			full_name: form.full_name.trim() || null,
			birthday: form.birthday || null,
			emirate: form.emirate || null,
			location: form.location.trim() || null
		} }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["me"] });
			toast.success("Profile updated successfully");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
	});
	async function onPickAvatar(file) {
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) return toast.error("Image over 5 MB");
		setUploadingAvatar(true);
		try {
			const url = await uploadFileTo("avatars", file);
			setForm((f) => ({
				...f,
				avatar_url: url
			}));
			await update({ data: { avatar_url: url } });
			qc.invalidateQueries({ queryKey: ["me"] });
			toast.success("Profile picture updated");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploadingAvatar(false);
		}
	}
	async function onPickBanner(file) {
		if (!file) return;
		if (file.size > 8 * 1024 * 1024) return toast.error("Image over 8 MB");
		setUploadingBanner(true);
		try {
			const url = await uploadFileTo("avatars", file);
			setForm((f) => ({
				...f,
				banner_url: url
			}));
			await update({ data: { banner_url: url } });
			qc.invalidateQueries({ queryKey: ["me"] });
			toast.success("Profile banner updated");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploadingBanner(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		pending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCropper, {
			file: pending.file,
			aspect: pending.kind === "avatar" ? 1 : 3,
			title: pending.kind === "avatar" ? "Crop profile picture" : "Crop banner",
			onCancel: () => setPending(null),
			onDone: async (f) => {
				const kind = pending.kind;
				setPending(null);
				if (kind === "avatar") await onPickAvatar(f);
				else await onPickBanner(f);
			}
		}, pending.file.name + pending.kind),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-black sm:text-4xl",
			children: "Settings"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-muted-foreground",
			children: "Update your public profile."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			className: "mt-6 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Profile picture"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap items-center gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-primary/20",
							style: { backgroundColor: form.avatar_url ? "transparent" : FALLBACK_COLOR },
							children: form.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: form.avatar_url,
								alt: "",
								className: "h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-8 w-8 text-white" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary-soft",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }),
								uploadingAvatar ? "Uploading…" : form.avatar_url ? "Change" : "Upload",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									hidden: true,
									onChange: (e) => {
										const f = e.target.files?.[0];
										if (f) setPending({
											file: f,
											kind: "avatar"
										});
										e.target.value = "";
									}
								})
							]
						}),
						form.avatar_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: async () => {
								setForm((f) => ({
									...f,
									avatar_url: null
								}));
								await update({ data: { avatar_url: null } });
								qc.invalidateQueries({ queryKey: ["me"] });
								toast.success("Profile picture removed");
							},
							className: "text-xs font-bold uppercase text-destructive hover:underline",
							children: "Remove"
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-bold uppercase text-muted-foreground",
						children: "Profile banner"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid h-28 place-items-center overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary-soft",
						children: form.banner_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: form.banner_url,
							alt: "",
							className: "h-full w-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-7 w-7 text-primary/50" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary-soft",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }),
								uploadingBanner ? "Uploading…" : form.banner_url ? "Change" : "Upload",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									hidden: true,
									onChange: (e) => {
										const f = e.target.files?.[0];
										if (f) setPending({
											file: f,
											kind: "banner"
										});
										e.target.value = "";
									}
								})
							]
						}), form.banner_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: async () => {
								setForm((f) => ({
									...f,
									banner_url: null
								}));
								await update({ data: { banner_url: null } });
								qc.invalidateQueries({ queryKey: ["me"] });
								toast.success("Profile banner removed");
							},
							className: "text-xs font-bold uppercase text-destructive hover:underline",
							children: "Remove"
						})]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-bold uppercase text-muted-foreground",
						children: "Username"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						minLength: 3,
						maxLength: 20,
						pattern: "[A-Za-z0-9_]+",
						value: form.username,
						onChange: (e) => setForm({
							...form,
							username: e.target.value.replace(/[^A-Za-z0-9_]/g, "")
						}),
						className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] text-muted-foreground",
						children: "Letters, numbers and underscores. Usernames are unique across SWAP."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Full name"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					maxLength: 120,
					value: form.full_name,
					onChange: (e) => setForm({
						...form,
						full_name: e.target.value
					}),
					placeholder: "e.g. Aisha Rahman",
					className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Date of birth"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: form.birthday,
					onChange: (e) => setForm({
						...form,
						birthday: e.target.value
					}),
					className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Emirate"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: form.emirate,
					onChange: (e) => setForm({
						...form,
						emirate: e.target.value
					}),
					className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Not set"
					}), EMIRATES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: n }, n))]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "General location"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					maxLength: 120,
					placeholder: "e.g. Al Barsha",
					value: form.location,
					onChange: (e) => setForm({
						...form,
						location: e.target.value
					}),
					className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-muted-foreground",
					children: "Bio"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					rows: 3,
					maxLength: 500,
					value: form.bio,
					onChange: (e) => setForm({
						...form,
						bio: e.target.value
					}),
					className: "mt-1 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: mut.isPending,
					className: "w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
					children: "Save changes"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "account",
			className: "mt-6 rounded-3xl border-2 border-destructive/30 bg-card p-5 shadow-card sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "flex items-center gap-2 font-display text-lg font-black text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" }), " Delete account"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "This permanently removes your account, listings and inventory. This cannot be undone."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: del.isPending,
					onClick: () => {
						if (window.confirm("Do you want to delete your account? This can't be undone.")) del.mutate();
					},
					className: "mt-3 rounded-full border-2 border-destructive px-5 py-2 text-xs font-black uppercase tracking-wider text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50",
					children: del.isPending ? "Deleting…" : "Delete my account"
				})
			]
		})
	] });
}
function Toggle({ label, hint, checked, onChange, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-4 border-b border-primary/10 py-4 last:border-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-bold",
				children: label
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-muted-foreground",
				children: hint
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			role: "switch",
			"aria-checked": checked,
			"aria-label": label,
			disabled,
			onClick: () => onChange(!checked),
			className: `relative h-7 w-12 shrink-0 rounded-full border-2 transition disabled:opacity-50 ${checked ? "border-primary bg-primary" : "border-primary/30 bg-muted"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}` })
		})]
	});
}
function Card({ title, subtitle, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-black",
				children: title
			}),
			subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: subtitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children
			})
		]
	});
}
function NotificationsTab() {
	const qc = useQueryClient();
	const getFn = useServerFn(getNotificationPrefs);
	const setFn = useServerFn(updateNotificationPrefs);
	const { data } = useQuery({
		queryKey: ["notification-prefs"],
		queryFn: () => getFn()
	});
	const mut = useMutation({
		mutationFn: (patch) => setFn({ data: patch }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notification-prefs"] });
			toast.success("Notification settings saved");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save")
	});
	const prefs = data ?? {
		announcements: true,
		messages: true,
		saves: true,
		offers: true
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-black sm:text-4xl",
			children: "Notifications"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-muted-foreground",
			children: "Choose what SWAP notifies you about."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "Push & in-app alerts",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Community announcements",
						hint: "New posts from the SWAP team.",
						checked: prefs.announcements,
						disabled: mut.isPending,
						onChange: (v) => mut.mutate({ announcements: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Messages",
						hint: "Chat messages inside a trade.",
						checked: prefs.messages,
						disabled: mut.isPending,
						onChange: (v) => mut.mutate({ messages: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Saves on my listings",
						hint: "When someone saves one of your listings.",
						checked: prefs.saves,
						disabled: mut.isPending,
						onChange: (v) => mut.mutate({ saves: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Offers & trade updates",
						hint: "New offers, accepts, meetups and completions.",
						checked: prefs.offers,
						disabled: mut.isPending,
						onChange: (v) => mut.mutate({ offers: v })
					})
				]
			})
		})
	] });
}
function PrivacyTab() {
	const qc = useQueryClient();
	const meFn = useServerFn(getMyProfile);
	const privacyFn = useServerFn(setInventoryPrivacy);
	const blockedFn = useServerFn(listBlockedUsers);
	const blockFn = useServerFn(blockUser);
	const unblockFn = useServerFn(unblockUser);
	const { data: me } = useQuery({
		queryKey: ["me"],
		queryFn: () => meFn()
	});
	const { data: blocked } = useQuery({
		queryKey: ["blocked-users"],
		queryFn: () => blockedFn()
	});
	const [username, setUsername] = (0, import_react.useState)("");
	const isPrivate = me?.profile?.inventory_default_visibility === "private";
	const privacy = useMutation({
		mutationFn: (v) => privacyFn({ data: { private: v } }),
		onSuccess: (_r, v) => {
			qc.invalidateQueries({ queryKey: ["me"] });
			qc.invalidateQueries({ queryKey: ["my-items"] });
			toast.success(v ? "Your inventory is now private" : "Your inventory is now public");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update privacy")
	});
	const block = useMutation({
		mutationFn: () => blockFn({ data: { username } }),
		onSuccess: (r) => {
			setUsername("");
			qc.invalidateQueries({ queryKey: ["blocked-users"] });
			qc.invalidateQueries({ queryKey: ["blocked-ids"] });
			toast.success(`@${r.username} is now blocked`);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not block that member")
	});
	const unblock = useMutation({
		mutationFn: (id) => unblockFn({ data: { blocked_id: id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["blocked-users"] });
			qc.invalidateQueries({ queryKey: ["blocked-ids"] });
			toast.success("Member unblocked");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not unblock")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-black sm:text-4xl",
			children: "Account privacy"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-muted-foreground",
			children: "Control who can see your stuff."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Inventory visibility",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					label: "Make all inventory items private",
					hint: "Nobody can browse your inventory on your profile. Items you put into a trade are still visible to the person you're swapping with.",
					checked: !!isPrivate,
					disabled: privacy.isPending,
					onChange: (v) => privacy.mutate(v)
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "Blocked members",
				subtitle: "Blocked members can't see your profile, listings or inventory — and you won't see theirs.",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: username,
						onChange: (e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_@]/g, "")),
						placeholder: "@username",
						maxLength: 40,
						className: "min-w-0 flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !username.trim() || block.isPending,
						onClick: () => block.mutate(),
						className: "rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
						children: block.isPending ? "Blocking…" : "Block"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2",
					children: [(blocked ?? []).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "You haven't blocked anyone."
					}), (blocked ?? []).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/15 bg-background px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full",
								style: { backgroundColor: b.user?.avatar_color ?? FALLBACK_COLOR },
								children: b.user?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: b.user.avatar_url,
									alt: "",
									className: "h-full w-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4 text-white" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "truncate text-sm font-bold",
								children: ["@", b.user?.username ?? "member"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: unblock.isPending,
							onClick: () => unblock.mutate(b.blocked_id),
							className: "inline-flex items-center gap-1 rounded-full border-2 border-primary/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary hover:bg-primary-soft disabled:opacity-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" }), " Unblock"]
						})]
					}, b.id))]
				})]
			})]
		})
	] });
}
function TermsTab() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-black sm:text-4xl",
			children: "Terms of Conditions"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-muted-foreground",
			children: "The terms you accepted when joining SWAP."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 space-y-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "Summary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm leading-relaxed text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• SWAP is available to members aged 13 and above; under-18s need guardian permission." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• SWAP connects traders but is never a party to a trade — you trade at your own risk." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Illegal, restricted, counterfeit, vape and smoking items may not be listed." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Harassment, profanity, spam and fraud can get your account banned." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Moderators may withhold or remove listings and suspend accounts." })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/terms",
					className: "mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow",
					children: ["Read full terms ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })]
				})]
			})
		})
	] });
}
//#endregion
export { SettingsPage as component };
