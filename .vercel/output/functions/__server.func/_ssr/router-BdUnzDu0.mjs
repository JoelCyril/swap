import { r as __toESM } from "../_runtime.mjs";
import { F as redirect, S as useRouter, _ as Link, c as HeadContent, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, m as lazyRouteComponent, p as Outlet, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, r as QueryClientProvider, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn, r as EMIRATES } from "./db-types-Dz-qEZef.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { n as getMyBan } from "./bans.functions-D1CLk_eh.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { a as TriangleAlert, d as ShieldAlert, h as ScrollText, r as UserRound } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$17 } from "./items._id-D1dQdoPK.mjs";
import { t as Route$18 } from "./listings._id-C6w8BZl_.mjs";
import { t as Route$19 } from "./listings.index--djcYRW4.mjs";
import { i as getTermsStatus, n as acceptTerms, r as checkUsername, t as Route$20 } from "./offers._id-kjuyk3lR.mjs";
import { t as Route$21 } from "./profile._username-5LEV5Vrb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BdUnzDu0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BfMKDcSC.css";
var POINTS = [
	"You must be at least 13 years old to use SWAP.",
	"By accessing, browsing, registering for, or otherwise utilizing the SWAP website, application, application programming interfaces, or any associated digital services provided by the platform (collectively referred to as the \"Service\"), you formally acknowledge that you have read, understood, and unconditionally agree to be bound by these comprehensive Terms of Service. These terms constitute a legally binding agreement between you, whether personally or on behalf of an entity, and the creators, maintainers, and operators of SWAP. Your continuous engagement with any component of our digital architecture—including but not limited to the interactive browse feeds, user inventory management systems, real-time messaging modules, meetup negotiation protocols, or administrative dashboards—constitutes your ongoing consent to abide by every clause, restriction, guideline, and stipulation outlined herein. If you do not agree with all or any part of these terms, you are strictly prohibited from utilizing the Service and must immediately cease all access, delete your account profile, and remove any locally cached data or application binaries associated with the ecosystem. Furthermore, your use of the platform indicates your ongoing warranty that you possess the full legal capacity, authority, and competence to enter into this agreement under the laws and regulations applicable within your local jurisdiction.",
	"SWAP is engineered and operated exclusively as a localized digital community venue designed to facilitate the peer-to-peer barter, exchange, and trade of personal, pre-owned items directly between individual users without the mediation of cash transactions, monetary exchanges, or commercial commerce. It is of paramount importance to explicitly understand that SWAP does not function as a traditional retail merchant, commercial broker, licensed auctioneer, professional shipping provider, or inspecting authority. We do not manufacture, store, curate, test, verify, or physically handle any of the personal belongings, objects, or assets listed within user inventories or public marketplace feeds. Consequently, SWAP completely disclaims any and all explicit or implicit warranties regarding the legal ownership, authenticity, merchantability, safety, structural integrity, functional reliability, or fitness for a particular purpose of any item listed, negotiated, or exchanged through our platform. All trades, swaps, exchanges, and concurrent interactions executed by users are conducted entirely at their own independent discretion and risk. SWAP exercises no physical control over the quality, legality, condition, or description of items posted by community members, nor do we guarantee that any offered trade will successfully reach a mutually satisfactory conclusion or that any user will genuinely complete an agreed-upon exchange.",
	"To access and utilize the core functionalities of the SWAP platform, you must complete the account registration process by providing accurate, current, and complete information, including a valid email address, a unique username, your real legal name, and a neighborhood-level geographic location within your municipal region. You represent and warrant that you are at least eighteen (18) years of age or possess legal majority status in your jurisdiction, and that you possess the full legal right and capability to enter into a binding agreement. You are entirely and exclusively responsible for maintaining the absolute confidentiality of your account credentials, password hashes, session tokens, and any single-use administrative privilege escalation codes issued to you. You agree to accept full responsibility for all activities, actions, posts, listings, offers, and communications that occur under your registered user profile, regardless of whether such activities were authorized by you. In the event of any unauthorized access, security breach, credential compromise, or suspicious activity detected on your account, you must immediately notify the platform administrators so that appropriate containment measures can be initiated. SWAP reserves the absolute right to suspend, freeze, or permanently terminate any user account that displays abnormal behavioral patterns, utilizes automated scraping or bot infrastructure, or violates our account security protocols without prior notice or liability.",
	"The platform provides a flexible inventory system allowing users to catalog personal possessions, define global and item-level visibility settings (toggling between public marketplace visibility and private status), and attach media files such as high-resolution photographs or short video clips to accurately represent item conditions. By uploading, publishing, or otherwise transmitting any images, videos, text, descriptions, or metadata to your inventory or public listings, you explicitly warrant that you are the lawful owner or authorized licensee of all such media content, and that your uploads do not infringe upon, misappropriate, or violate the copyright, trademark, privacy rights, publicity rights, or intellectual property rights of any third party. You agree that you will not upload, post, or distribute any media containing graphic violence, explicit adult content, copyrighted material belonging to others, malicious software payloads, or personally identifiable information of third parties. SWAP maintains a strict policy against misleading representations; you are legally bound to provide entirely truthful, accurate, and transparent descriptions of your items, including any notable defects, structural wear, or operational limitations. The platform reserves the unconditional right to review, flag, modify, blur, or permanently delete any media attachment or inventory item that violates these visual and descriptive standards or contravenes community safety guidelines.",
	"SWAP has been conceptualized, designed, developed, and deployed strictly as an academic student project for educational, instructional, portfolio, and non-commercial developmental purposes. By accessing, navigating, or utilizing this Service in any capacity, you explicitly acknowledge, accept, and agree that the application, its codebase, its database schemas, and its auxiliary infrastructure are provided on a strict \"as-is\" and \"as-available\" basis, completely devoid of any warranties, guarantees, or operational assurances of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. You hereby acknowledge that because this platform is maintained by students as an academic portfolio initiative, it may experience unexpected downtime, security vulnerabilities, data synchronization delays, feature deprecations, or data loss. You explicitly covenant and agree that the student developers, project authors, contributors, evaluators, and any associated educational institutions, universities, or academic entities shall bear absolutely no liability whatsoever for any direct, indirect, incidental, special, punitive, or consequential damages—including financial loss, emotional distress, physical injury, property damage, data corruption, or system failure—arising out of or in any way connected with your use of the platform, the failure of the system to process transactions, the behavior of other platform users, or any real-world encounters resulting from online negotiations. You hereby irrevocably and unconditionally waive any and all legal claims, demands, causes of action, or potential lawsuits against the student developers and their affiliated academic institutions, releasing them from any legal responsibility, liability, or financial recourse arising from your participation in the SWAP ecosystem.",
	"SWAP empowers its community with an integrated reporting mechanism enabling users to instantly flag suspicious, fraudulent, or inappropriate listings, which immediately removes the flagged content from the reporting user's personal view and routes it directly into the administrative moderation queue for professional review. Additionally, the platform features a secure administrative escalation workflow utilizing single-use, cryptographically hashed admin invitation codes redeemed through user settings to grant verified administrative privileges. Designated administrators possess the sovereign authority to review reported listings, dismiss unfounded reports, unpublish offending content, and issue administrative sanctions or account bans. You agree not to abuse the reporting system by submitting false, malicious, or retaliatory flags against innocent users or legitimate listings. Furthermore, any attempt to compromise, bypass, reverse-engineer, or brute-force the administrative code redemption mechanism will be treated as a severe security violation, resulting in immediate legal reporting, IP address blacklisting, and permanent account obliteration across all connected system databases.",
	"Moderators may remove listings or suspend accounts that break these rules.",
	"Your privacy is of fundamental importance to our operational philosophy. Our collection, storage, processing, and protection of your personal information—including your real name, email address, neighborhood-level geographic location, inventory catalogs, chat histories, and platform interaction logs—are governed by our comprehensive Privacy Policy, which is incorporated into these Terms of Service by this reference. By registering an account and using the Service, you explicitly consent to the collection and utilization of your neighborhood-level location data for the specific purpose of facilitating local, community-driven item discovery and proximity-based barter matching. While we employ robust industry-standard security protocols, including parameterized database queries, bcrypt password hashing, input sanitization libraries, and strict authorization middleware to safeguard your digital footprint against unauthorized access, you acknowledge that no electronic transmission over the internet or digital storage medium can ever be guaranteed to be 100% secure, and you accept inherent risks associated with online data exposure.",
	"Continued use of SWAP means you accept these terms and any future updates."
];
/** Forces first-time signed-in members to read the terms and confirm they are 13+. */
function TosGate({ children }) {
	const qc = useQueryClient();
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [checked, setChecked] = (0, import_react.useState)(false);
	const [guardian, setGuardian] = (0, import_react.useState)(false);
	const [age, setAge] = (0, import_react.useState)("");
	const [username, setUsername] = (0, import_react.useState)("");
	const [taken, setTaken] = (0, import_react.useState)(null);
	const [step, setStep] = (0, import_react.useState)(1);
	const [profile, setProfile] = (0, import_react.useState)({
		full_name: "",
		birthday: "",
		emirate: "",
		location: "",
		bio: ""
	});
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
		return () => sub.subscription.unsubscribe();
	}, []);
	const statusFn = useServerFn(getTermsStatus);
	const { data: status } = useQuery({
		queryKey: ["terms-status", userId],
		queryFn: () => statusFn(),
		enabled: !!userId
	});
	const checkFn = useServerFn(checkUsername);
	const uname = username.trim().toLowerCase();
	const unameValid = /^[a-z0-9_]{3,20}$/.test(uname);
	(0, import_react.useEffect)(() => {
		if (!unameValid || !userId) {
			setTaken(null);
			return;
		}
		let cancel = false;
		const t = setTimeout(() => {
			checkFn({ data: { username: uname } }).then((r) => !cancel && setTaken(!r.available)).catch(() => !cancel && setTaken(null));
		}, 350);
		return () => {
			cancel = true;
			clearTimeout(t);
		};
	}, [
		uname,
		unameValid,
		userId
	]);
	const acceptFn = useServerFn(acceptTerms);
	const mut = useMutation({
		mutationFn: () => acceptFn({ data: {
			age: Number(age),
			username: uname,
			full_name: profile.full_name.trim() || null,
			birthday: profile.birthday || null,
			emirate: profile.emirate || null,
			location: profile.location.trim() || null,
			bio: profile.bio.trim() || null
		} }),
		onSuccess: () => {
			toast.success("Welcome to SWAP", { description: `Your username is @${uname}` });
			qc.invalidateQueries({ queryKey: ["terms-status", userId] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save")
	});
	if (!userId || !status || status.accepted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	const ageNum = Number(age);
	const tooYoung = age !== "" && ageNum > 0 && ageNum < 13;
	const minor = ageNum >= 13 && ageNum < 18;
	const canSubmit = unameValid && taken === false && checked && ageNum >= 13 && ageNum <= 120 && (!minor || guardian);
	const field = "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary";
	if (step === 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-display text-2xl font-black flex items-center gap-2 sm:text-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-6 w-6 text-primary" }), " Set up your profile"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: [
						"You're @",
						uname,
						". Tell neighbours a little about you — you can change all of this later in Settings."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-muted-foreground",
							children: "Full name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							maxLength: 120,
							value: profile.full_name,
							onChange: (e) => setProfile({
								...profile,
								full_name: e.target.value
							}),
							placeholder: "e.g. Aisha Rahman",
							className: field
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-muted-foreground",
							children: "Birthday"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: profile.birthday,
							onChange: (e) => setProfile({
								...profile,
								birthday: e.target.value
							}),
							className: field
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-muted-foreground",
							children: "Emirate"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: profile.emirate,
							onChange: (e) => setProfile({
								...profile,
								emirate: e.target.value
							}),
							className: field,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Select your emirate"
							}), EMIRATES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: n }, n))]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "General location"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								maxLength: 120,
								value: profile.location,
								onChange: (e) => setProfile({
									...profile,
									location: e.target.value
								}),
								placeholder: "e.g. Al Barsha",
								className: field
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[11px] text-muted-foreground",
								children: "Used to show you swaps near you. Never share your exact address."
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-muted-foreground",
							children: "Bio"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							rows: 3,
							maxLength: 500,
							value: profile.bio,
							onChange: (e) => setProfile({
								...profile,
								bio: e.target.value
							}),
							className: "mt-1 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => mut.mutate(),
					disabled: mut.isPending,
					className: "mt-5 w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
					children: mut.isPending ? "Saving…" : "Finish & start swapping"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setStep(1),
					className: "mt-2 w-full rounded-full py-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary",
					children: "Back"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-display text-2xl font-black flex items-center gap-2 sm:text-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, { className: "h-6 w-6 text-primary" }), " Terms of Service"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Please read and accept before you start swapping."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-muted p-4 text-sm",
					children: POINTS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p })]
					}, p))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-muted-foreground",
							children: "Pick your username"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex items-center gap-2 rounded-full border-2 border-primary/20 bg-white px-4 py-2 focus-within:border-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold text-muted-foreground",
								children: "@"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: username,
								onChange: (e) => setUsername(e.target.value),
								placeholder: "yourname",
								maxLength: 20,
								className: "w-full bg-transparent text-sm outline-none"
							})]
						}),
						username !== "" && !unameValid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-destructive",
							children: "3-20 characters, letters, numbers and underscores only."
						}),
						unameValid && taken === true && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs font-semibold text-destructive",
							children: [
								"@",
								uname,
								" is already taken."
							]
						}),
						unameValid && taken === false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs font-semibold text-primary",
							children: [
								"@",
								uname,
								" is available."
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-muted-foreground",
							children: "Your age"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: 1,
							max: 120,
							value: age,
							onChange: (e) => setAge(e.target.value),
							className: "mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary",
							placeholder: "e.g. 16"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 flex gap-1.5 text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3.5 w-3.5 shrink-0 text-primary" }), "SWAP is only available to users aged 13 and above. Individuals under the age of 13 are not permitted to use this website. Providing false age information may result in permanent suspension of your account. Users between the ages of 13 and 17 must obtain parental approval before creating an account and using the platform."]
						}),
						tooYoung && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 rounded-2xl bg-destructive/10 p-3 text-xs font-semibold text-destructive",
							children: "You must be at least 13 years old to use SWAP."
						}),
						minor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 flex items-start gap-2 rounded-2xl bg-primary-soft p-3 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: guardian,
								onChange: (e) => setGuardian(e.target.checked),
								className: "mt-0.5 h-4 w-4 accent-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "By checking this box, you confirm that you have obtained permission from a parent or legal guardian to use this platform." })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 flex items-start gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked,
						onChange: (e) => setChecked(e.target.checked),
						className: "mt-0.5 h-4 w-4 accent-primary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "I have read and accept the Terms of Service." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setStep(2),
					disabled: !canSubmit,
					className: "mt-5 w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50",
					children: "Accept & continue"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => supabase.auth.signOut(),
					className: "mt-2 w-full rounded-full py-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary",
					children: "Sign out"
				})
			]
		})
	});
}
/** Blocks the whole app for a banned user and explains why. */
function BanGate({ children }) {
	const [userId, setUserId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
		return () => sub.subscription.unsubscribe();
	}, []);
	const fn = useServerFn(getMyBan);
	const { data: ban } = useQuery({
		queryKey: ["my-ban", userId],
		queryFn: () => fn(),
		enabled: !!userId,
		refetchInterval: 6e4
	});
	if (!ban) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	const permanent = !ban.expires_at;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background px-6 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl border-2 border-destructive/30 bg-card p-8 text-center shadow-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-7 w-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-2xl font-black",
					children: "Your account is suspended"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "A moderator has restricted your access to SWAP."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 rounded-2xl bg-muted p-4 text-left text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-black uppercase tracking-wider text-muted-foreground",
							children: "Reason"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-semibold",
							children: ban.reason || "No reason provided"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground",
							children: "Duration"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-semibold",
							children: permanent ? "Permanent" : `Until ${new Date(ban.expires_at).toLocaleString()}`
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: async () => {
						await supabase.auth.signOut();
						window.location.href = "/auth";
					},
					className: "mt-6 w-full rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft",
					children: "Sign out"
				})
			]
		})
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$16 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "author",
				content: "SWAP"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{ title: "Swap" },
			{
				property: "og:title",
				content: "Swap"
			},
			{
				name: "twitter:title",
				content: "Swap"
			},
			{
				name: "description",
				content: "SWAP is a web app for item trading, enabling users to barter goods directly without cash transactions."
			},
			{
				property: "og:description",
				content: "SWAP is a web app for item trading, enabling users to barter goods directly without cash transactions."
			},
			{
				name: "twitter:description",
				content: "SWAP is a web app for item trading, enabling users to barter goods directly without cash transactions."
			},
			{
				property: "og:image",
				content: "/favicon.png"
			},
			{
				name: "twitter:image",
				content: "/favicon.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$16.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BanGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TosGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-center",
			richColors: true,
			closeButton: true,
			style: { zIndex: 1e5 }
		})]
	});
}
var $$splitComponentImporter$15 = () => import("./routes-DTEZEvkE.mjs");
var Route$15 = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/listings" });
	},
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./route-Di7iQBCH.mjs");
var Route$14 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./announcements-CAqwlGNd.mjs");
var Route$13 = createFileRoute("/announcements")({
	head: () => ({ meta: [
		{ title: "Community announcements — SWAP" },
		{
			name: "description",
			content: "News, updates and safety notices from the SWAP team for the whole swapping community."
		},
		{
			property: "og:title",
			content: "Community announcements — SWAP"
		},
		{
			property: "og:description",
			content: "News and updates from the SWAP team."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./auth-C5qzY0Fe.mjs");
var Route$12 = createFileRoute("/auth")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Sign in — SWAP" },
		{
			name: "description",
			content: "Sign in or create a SWAP account to trade items with your neighbours."
		},
		{
			property: "og:title",
			content: "Sign in — SWAP"
		},
		{
			property: "og:description",
			content: "Join the SWAP barter marketplace."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./help-Dutked1l.mjs");
var Route$11 = createFileRoute("/help")({
	head: () => ({ meta: [
		{ title: "Help & support — SWAP" },
		{
			name: "description",
			content: "Ask the SWAP team anything — send us your inquiry and we'll get back to you by email."
		},
		{
			property: "og:title",
			content: "Help & support — SWAP"
		},
		{
			property: "og:description",
			content: "Contact the SWAP team with your question."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./reset-password-Cu2dVk7-.mjs");
var Route$10 = createFileRoute("/reset-password")({
	head: () => ({ meta: [
		{ title: "Reset password — SWAP" },
		{
			name: "description",
			content: "Choose a new password for your SWAP account."
		},
		{
			property: "og:title",
			content: "Reset password — SWAP"
		},
		{
			property: "og:description",
			content: "Set a new SWAP password."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./terms-B1LCHJ-R.mjs");
var Route$9 = createFileRoute("/terms")({
	head: () => ({ meta: [
		{ title: "Terms & Conditions — SWAP" },
		{
			name: "description",
			content: "SWAP terms of service, user responsibilities, prohibited items, and limitation of liability."
		},
		{
			property: "og:title",
			content: "Terms & Conditions — SWAP"
		},
		{
			property: "og:description",
			content: "The terms governing use of SWAP."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./admin-Dd7ETM3p.mjs");
var Route$8 = createFileRoute("/_authenticated/admin")({
	head: () => ({ meta: [
		{ title: "Admin — SWAP" },
		{
			name: "description",
			content: "Moderate flagged content on SWAP."
		},
		{
			property: "og:title",
			content: "Admin — SWAP"
		},
		{
			property: "og:description",
			content: "SWAP moderation dashboard."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./favourites-DFeh2kcf.mjs");
var Route$7 = createFileRoute("/_authenticated/favourites")({
	head: () => ({ meta: [
		{ title: "Saved listings — SWAP" },
		{
			name: "description",
			content: "Listings you've saved to revisit later."
		},
		{
			property: "og:title",
			content: "Saved listings — SWAP"
		},
		{
			property: "og:description",
			content: "Your saved SWAP listings."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./my-listings-BYXw_obR.mjs");
var Route$6 = createFileRoute("/_authenticated/my-listings")({
	head: () => ({ meta: [
		{ title: "My listings — SWAP" },
		{
			name: "description",
			content: "Manage the items you have posted for swapping."
		},
		{
			property: "og:title",
			content: "My listings — SWAP"
		},
		{
			property: "og:description",
			content: "Manage the items you have posted for swapping."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./new-listing-B8g5-WKC.mjs");
var searchSchema = objectType({ fromItem: stringType().uuid().optional() });
var Route$5 = createFileRoute("/_authenticated/new-listing")({
	validateSearch: (s) => searchSchema.parse(s),
	head: () => ({ meta: [
		{ title: "New listing — SWAP" },
		{
			name: "description",
			content: "Post something to trade with your neighbours."
		},
		{
			property: "og:title",
			content: "New listing — SWAP"
		},
		{
			property: "og:description",
			content: "Post an item to trade."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./notifications-CRhdg614.mjs");
var Route$4 = createFileRoute("/_authenticated/notifications")({
	head: () => ({ meta: [
		{ title: "Notifications — SWAP" },
		{
			name: "description",
			content: "Your offers, meetups, messages and moderation updates."
		},
		{
			property: "og:title",
			content: "Notifications — SWAP"
		},
		{
			property: "og:description",
			content: "SWAP activity inbox."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./settings-BjGSUeFm.mjs");
var Route$3 = createFileRoute("/_authenticated/settings")({
	head: () => ({ meta: [
		{ title: "Settings — SWAP" },
		{
			name: "description",
			content: "Update your SWAP profile, notifications and privacy."
		},
		{
			property: "og:title",
			content: "Settings — SWAP"
		},
		{
			property: "og:description",
			content: "Manage your SWAP profile, notifications and privacy."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./your-items-CMn0zHpD.mjs");
var Route$2 = createFileRoute("/_authenticated/your-items")({
	head: () => ({ meta: [
		{ title: "Your items — SWAP" },
		{
			name: "description",
			content: "Manage your inventory: add, edit, or hide items available to swap."
		},
		{
			property: "og:title",
			content: "Your items — SWAP"
		},
		{
			property: "og:description",
			content: "Manage your SWAP inventory."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./edit-listing._id-BqzmjprT.mjs");
var Route$1 = createFileRoute("/_authenticated/edit-listing/$id")({
	head: () => ({ meta: [
		{ title: "Edit listing — SWAP" },
		{
			name: "description",
			content: "Update the details and photos of your swap listing."
		},
		{
			property: "og:title",
			content: "Edit listing — SWAP"
		},
		{
			property: "og:description",
			content: "Update the details and photos of your swap listing."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./offers.index-02MRkNnK.mjs");
var Route = createFileRoute("/_authenticated/offers/")({
	head: () => ({ meta: [
		{ title: "Your offers — SWAP" },
		{
			name: "description",
			content: "Track incoming and outgoing swap offers."
		},
		{
			property: "og:title",
			content: "Offers — SWAP"
		},
		{
			property: "og:description",
			content: "Your active and past swap offers."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$15.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$16
});
var AuthenticatedRouteRoute = Route$14.update({
	id: "/_authenticated",
	getParentRoute: () => Route$16
});
var AnnouncementsRoute = Route$13.update({
	id: "/announcements",
	path: "/announcements",
	getParentRoute: () => Route$16
});
var AuthRoute = Route$12.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$16
});
var HelpRoute = Route$11.update({
	id: "/help",
	path: "/help",
	getParentRoute: () => Route$16
});
var ResetPasswordRoute = Route$10.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$16
});
var TermsRoute = Route$9.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$16
});
var AuthenticatedAdminRoute = Route$8.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedFavouritesRoute = Route$7.update({
	id: "/favourites",
	path: "/favourites",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedMyListingsRoute = Route$6.update({
	id: "/my-listings",
	path: "/my-listings",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedNewListingRoute = Route$5.update({
	id: "/new-listing",
	path: "/new-listing",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedNotificationsRoute = Route$4.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSettingsRoute = Route$3.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedYourItemsRoute = Route$2.update({
	id: "/your-items",
	path: "/your-items",
	getParentRoute: () => AuthenticatedRouteRoute
});
var ItemsIdRoute = Route$17.update({
	id: "/items/$id",
	path: "/items/$id",
	getParentRoute: () => Route$16
});
var ListingsIndexRoute = Route$19.update({
	id: "/listings/",
	path: "/listings/",
	getParentRoute: () => Route$16
});
var ListingsIdRoute = Route$18.update({
	id: "/listings/$id",
	path: "/listings/$id",
	getParentRoute: () => Route$16
});
var ProfileUsernameRoute = Route$21.update({
	id: "/profile/$username",
	path: "/profile/$username",
	getParentRoute: () => Route$16
});
var AuthenticatedEditListingIdRoute = Route$1.update({
	id: "/edit-listing/$id",
	path: "/edit-listing/$id",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOffersIndexRoute = Route.update({
	id: "/offers/",
	path: "/offers/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAdminRoute,
	AuthenticatedFavouritesRoute,
	AuthenticatedMyListingsRoute,
	AuthenticatedNewListingRoute,
	AuthenticatedNotificationsRoute,
	AuthenticatedSettingsRoute,
	AuthenticatedYourItemsRoute,
	AuthenticatedEditListingIdRoute,
	AuthenticatedOffersIdRoute: Route$20.update({
		id: "/offers/$id",
		path: "/offers/$id",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedOffersIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AnnouncementsRoute,
	AuthRoute,
	HelpRoute,
	ResetPasswordRoute,
	TermsRoute,
	ItemsIdRoute,
	ListingsIdRoute,
	ProfileUsernameRoute,
	ListingsIndexRoute
};
var routeTree = Route$16._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
