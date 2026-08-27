import { r as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as useServerFn } from "./db-types-Dz-qEZef.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { A as LifeBuoy, D as Mail } from "../_libs/lucide-react.mjs";
import { n as Navbar, t as Footer } from "./Footer-BAgeypoZ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as submitInquiry, r as submitMyInquiry } from "./support.functions-BAa5Ojl2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-Dutked1l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMPTY = {
	name: "",
	email: "",
	subject: "",
	message: ""
};
function HelpPage() {
	const send = useServerFn(submitInquiry);
	const sendAsMe = useServerFn(submitMyInquiry);
	const [form, setForm] = (0, import_react.useState)({ ...EMPTY });
	const [signedIn, setSignedIn] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
	}, []);
	const mut = useMutation({
		mutationFn: () => signedIn ? sendAsMe({ data: form }) : send({ data: form }),
		onSuccess: () => {
			setForm({ ...EMPTY });
			toast.success("Inquiry sent successfully", { description: signedIn ? "Watch for the moderator reply in “Inquiry updates”." : "Our team will review it shortly." });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send your inquiry")
	});
	const field = "mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "font-display text-3xl font-black sm:text-4xl flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-7 w-7 text-primary" }), " Help & support"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "Fill in the form and our moderator team will reply — signed-in members see replies in the “Inquiry updates” panel."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (e) => {
							e.preventDefault();
							mut.mutate();
						},
						className: "mt-6 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-muted-foreground",
									children: "Your name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									required: true,
									maxLength: 80,
									value: form.name,
									onChange: (e) => setForm({
										...form,
										name: e.target.value
									}),
									className: field
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-muted-foreground",
									children: "Your email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									required: true,
									type: "email",
									maxLength: 255,
									value: form.email,
									onChange: (e) => setForm({
										...form,
										email: e.target.value
									}),
									className: field
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Subject"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								maxLength: 140,
								value: form.subject,
								onChange: (e) => setForm({
									...form,
									subject: e.target.value
								}),
								className: field
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "How can we help?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								required: true,
								rows: 6,
								maxLength: 2e3,
								value: form.message,
								onChange: (e) => setForm({
									...form,
									message: e.target.value
								}),
								className: `${field} resize-none`
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: mut.isPending,
								className: "w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60",
								children: mut.isPending ? "Sending…" : "Send inquiry"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3.5 w-3.5" }), " Goes straight to the SWAP moderator team"]
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
export { HelpPage as component };
