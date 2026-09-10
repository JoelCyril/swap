import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWantedRequests } from "@/lib/wanted.functions";
import { type WantedRequestItem } from "@/lib/wanted.server";
import { X, ArrowRightLeft, MapPin } from "lucide-react";

const STORAGE_KEY = "swap_wanted_popup_last_shown";
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

const CASUAL_PHRASES = [
  (title: string) => `Yo, do you have a ${title}?`,
  (title: string) => `Hey! Got a ${title} lying around?`,
  (title: string) => `Psst… anyone here got a ${title}?`,
  (title: string) => `Someone nearby is looking for a ${title} 👀`,
  (title: string) => `Quick question: do you have a ${title}?`,
  (title: string) => `Got a ${title}? Someone's ready to swap!`,
  (title: string) => `Yo! Anyone holding onto a ${title}?`,
];

export function WantedPopupToast() {
  const location = useLocation();
  const listFn = useServerFn(listWantedRequests);
  const [activeItem, setActiveItem] = useState<{
    request: WantedRequestItem;
    phrase: string;
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check frequency limit: once per 24 hours per user
  const shouldSkipToday = () => {
    if (typeof window === "undefined") return true;
    try {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      if (lastShown) {
        const diff = Date.now() - Number(lastShown);
        if (diff < ONE_DAY_MS) {
          return true;
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return false;
  };

  // Skip showing on auth, admin, or wanted pages
  const isExcludedRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/admin") ||
    location.pathname === "/wanted" ||
    location.pathname.startsWith("/wanted/");

  const { data: requests = [] } = useQuery({
    queryKey: ["wanted-popup-items"],
    queryFn: () => listFn({ data: {} }),
    // Only fetch if eligible to show today and not on excluded route
    enabled: typeof window !== "undefined" && !shouldSkipToday() && !isExcludedRoute && !dismissed,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (dismissed || isExcludedRoute || shouldSkipToday() || requests.length === 0) {
      return;
    }

    // Delay popup by 5 seconds so it doesn't jar the user immediately on page load
    const showTimer = setTimeout(() => {
      // Pick random request
      const randomRequest = requests[Math.floor(Math.random() * requests.length)];
      if (!randomRequest) return;

      // Pick random casual prompt template
      const randomPhraseFn = CASUAL_PHRASES[Math.floor(Math.random() * CASUAL_PHRASES.length)];
      const phrase = randomPhraseFn(randomRequest.title);

      setActiveItem({ request: randomRequest, phrase });
      setVisible(true);

      // Record popup timestamp so it strictly fires at most once a day
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch {
        // Ignore storage write errors
      }
    }, 5000);

    return () => clearTimeout(showTimer);
  }, [requests, isExcludedRoute, dismissed]);

  // Auto-hide after 18 seconds if user doesn't interact
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 18000);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || !activeItem) {
    return null;
  }

  const { request, phrase } = activeItem;

  return (
    <aside
      aria-label="Wanted request notification"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-92 animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-card/95 backdrop-blur-md p-4 shadow-2xl transition hover:border-primary">
        {/* Subtle glow background accent */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />

        {/* Top bar: Badge & Close button */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
              Wanted in UAE
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {request.category}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Casual headline */}
        <div className="mt-2.5">
          <p className="font-display text-sm font-black text-foreground leading-snug">
            {phrase}
          </p>
        </div>

        {/* What they offer in exchange */}
        {request.offering_description && (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-800 dark:text-emerald-300">
            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-tight">
              <strong className="font-bold">Offers:</strong> {request.offering_description}
            </p>
          </div>
        )}

        {/* Requester Profile & Action */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full text-white font-black text-[11px] shadow-sm"
              style={{
                backgroundColor: request.user.avatar_url
                  ? "transparent"
                  : request.user.avatar_color || "#ea580c",
              }}
            >
              {request.user.avatar_url ? (
                <img
                  src={request.user.avatar_url}
                  alt={request.user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                request.user.username[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                @{request.user.username}
              </p>
              <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate">
                <MapPin className="h-2.5 w-2.5 text-primary/70 shrink-0" />
                {request.emirate || "UAE"}
              </p>
            </div>
          </div>

          <Link
            to="/wanted"
            onClick={handleDismiss}
            className="shrink-0 rounded-full bg-gradient-primary px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
          >
            Check it out
          </Link>
        </div>
      </div>
    </aside>
  );
}
