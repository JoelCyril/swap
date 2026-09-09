import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import appCss from "../styles.css?url";
import { TosGate } from "@/components/TosGate";
import { BanGate } from "@/components/BanGate";
import { Toaster } from "@/components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const message = error instanceof Error ? error.message : String(error ?? "");

  // Route files are emitted with content hashes. A tab that was open during a
  // deployment can still try to import the previous hash, which no longer
  // exists. Reload to fetch the current document and route manifest.
  useEffect(() => {
    const isStaleRouteChunk =
      /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror/i.test(message);
    if (!isStaleRouteChunk) return;

    const lastReload = Number(sessionStorage.getItem("swap:last-chunk-reload") || 0);
    if (Date.now() - lastReload > 10000) {
      sessionStorage.setItem("swap:last-chunk-reload", String(Date.now()));
      window.location.reload();
    }
  }, [message]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl font-display">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A new version was recently deployed. Please try refreshing to get the latest update.
        </p>
        {message && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-xl p-3 font-mono break-words border border-destructive/20 text-left">
            {message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("swap:last-chunk-reload");
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary/30 bg-card px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "SWAP" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Swap" },
      { property: "og:title", content: "Swap" },
      { name: "twitter:title", content: "Swap" },
      { name: "description", content: "SWAP is a web app for item trading, enabling users to barter goods directly without cash transactions." },
      { property: "og:description", content: "SWAP is a web app for item trading, enabling users to barter goods directly without cash transactions." },
      { name: "twitter:description", content: "SWAP is a web app for item trading, enabling users to barter goods directly without cash transactions." },
      { property: "og:image", content: "/favicon.png" },
      { name: "twitter:image", content: "/favicon.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('swap_theme');
                  if (t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}

                // Automatically recover from stale deployment chunks
                window.addEventListener('vite:preloadError', function() {
                  try {
                    var last = Number(sessionStorage.getItem('swap:preload-reload') || 0);
                    if (Date.now() - last > 10000) {
                      sessionStorage.setItem('swap:preload-reload', String(Date.now()));
                      window.location.reload();
                    }
                  } catch (e) {
                    window.location.reload();
                  }
                });

                // Automatically recover if stylesheet failed to load during deployment transition
                window.addEventListener('error', function(e) {
                  try {
                    if (e.target && e.target.tagName === 'LINK' && e.target.rel === 'stylesheet') {
                      var lastCss = Number(sessionStorage.getItem('swap:css-reload') || 0);
                      if (Date.now() - lastCss > 10000) {
                        sessionStorage.setItem('swap:css-reload', String(Date.now()));
                        setTimeout(function() { window.location.reload(); }, 1500);
                      }
                    }
                  } catch (err) {}
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <BanGate>
        <TosGate>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </TosGate>
      </BanGate>
      {/* Outside the gates so confirmation toasts always render. */}
      <Toaster position="top-center" richColors closeButton style={{ zIndex: 100000 }} />
    </QueryClientProvider>
  );
}
