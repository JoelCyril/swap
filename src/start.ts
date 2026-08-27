import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuthFresh } from "@/lib/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);

    let isServerFn = false;
    try {
      isServerFn = (getRequest()?.url ?? "").includes("/_serverFn/");
    } catch {
      isServerFn = false;
    }

    // Auth failures must not render the generic HTML error page — otherwise a
    // stale session turns every RPC into a "this page didn't load" screen.
    if (message.startsWith("Unauthorized")) {
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    console.error(error);

    if (isServerFn) {
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(renderErrorPage(error), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Server functions are same-origin RPC endpoints; block cross-site invocations.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuthFresh],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
