import { n as getRequest, t as createMiddleware } from "./createMiddleware-DZKjvFNc.mjs";
import { t as supabase } from "./client-DLMi9Pqt.mjs";
import { t as createCsrfMiddleware } from "./createCsrfMiddleware-B9lOBhNG.mjs";
import { t as renderErrorPage } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/start-DPgAUviL.js
function dedupeSerializationAdapters(deduped, serializationAdapters) {
	for (let i = 0, len = serializationAdapters.length; i < len; i++) {
		const current = serializationAdapters[i];
		if (!deduped.has(current)) {
			deduped.add(current);
			if (current.extends) dedupeSerializationAdapters(deduped, current.extends);
		}
	}
}
var createStart = (getOptions) => {
	return {
		getOptions: async () => {
			const options = await getOptions();
			if (options.serializationAdapters) {
				const deduped = /* @__PURE__ */ new Set();
				dedupeSerializationAdapters(deduped, options.serializationAdapters);
				options.serializationAdapters = Array.from(deduped);
			}
			return options;
		},
		createMiddleware
	};
};
/**
* Project-specific replacement for the generated `attachSupabaseAuth`.
* It additionally refreshes an expired/near-expired access token before
* attaching it, so users with a stale session don't get a wall of failed
* server-function calls (which previously surfaced as "This page didn't load").
*/
var attachSupabaseAuthFresh = createMiddleware({ type: "function" }).client(async ({ next }) => {
	let token;
	try {
		const { data } = await supabase.auth.getSession();
		const session = data.session;
		token = session?.access_token;
		const expiresAt = session?.expires_at ? session.expires_at * 1e3 : 0;
		if (session && expiresAt && expiresAt < Date.now() + 6e4) {
			const { data: refreshed } = await supabase.auth.refreshSession();
			token = refreshed.session?.access_token ?? token;
		}
	} catch {}
	return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
var errorMiddleware = createMiddleware().server(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		if (error != null && typeof error === "object" && "statusCode" in error) throw error;
		const message = error instanceof Error ? error.message : String(error);
		let isServerFn = false;
		try {
			isServerFn = (getRequest()?.url ?? "").includes("/_serverFn/");
		} catch {
			isServerFn = false;
		}
		if (message.startsWith("Unauthorized")) return new Response(JSON.stringify({ error: message }), {
			status: 401,
			headers: { "content-type": "application/json" }
		});
		console.error(error);
		if (isServerFn) return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
});
var csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var startInstance = createStart(() => ({
	functionMiddleware: [attachSupabaseAuthFresh],
	requestMiddleware: [errorMiddleware, csrfMiddleware]
}));
//#endregion
export { startInstance };
