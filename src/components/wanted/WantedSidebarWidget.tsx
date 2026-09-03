import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWantedRequests } from "@/lib/wanted.functions";
import { timeAgo } from "@/lib/db-types";
import { Megaphone, ArrowRightLeft, MapPin, ExternalLink, Plus } from "lucide-react";

export function WantedSidebarWidget({ signedIn }: { signedIn?: boolean }) {
  const listFn = useServerFn(listWantedRequests);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["wanted-requests-sidebar"],
    queryFn: () => listFn({ data: {} }),
    refetchInterval: 30_000,
  });

  // Smooth continuous auto-scroll effect
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || requests.length === 0) return;

    let animId: number;
    let lastTime = performance.now();

    const scrollStep = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (!isPaused && el) {
        // Slow gentle scroll: ~18 pixels per second
        el.scrollTop += delta * 0.018;

        // Seamless loop when reaching half of the duplicated list
        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = 0;
        }
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [requests.length, isPaused]);

  if (isLoading && requests.length === 0) {
    return (
      <div className="mt-4 rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 border-b border-border pb-2.5">
          <Megaphone className="h-4 w-4 text-primary animate-pulse" />
          <h3 className="font-display text-sm font-bold">Wanted (ISO)</h3>
        </div>
        <div className="py-6 text-center text-xs text-muted-foreground">Loading wanted posts…</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  // Duplicate items for infinite seamless scroll
  const displayItems = requests.length > 2 ? [...requests, ...requests] : requests;

  return (
    <div className="mt-4 rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <Link
          to="/wanted"
          className="group inline-flex items-center gap-2 font-display text-sm font-black text-foreground hover:text-primary transition"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
            <Megaphone className="h-3.5 w-3.5" />
          </span>
          Wanted (ISO)
        </Link>
        <Link
          to="/wanted"
          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline"
        >
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">
        Live requests from UAE members
      </p>

      {/* Auto-scrolling viewport */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="mt-3 max-h-[300px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin select-none"
        style={{ scrollBehavior: "auto" }}
      >
        {displayItems.map((req, idx) => (
          <Link
            key={`${req.id}-${idx}`}
            to="/wanted"
            className="group block rounded-2xl border border-primary/15 bg-background/70 p-3 hover:border-primary hover:bg-background hover:shadow-sm transition"
          >
            {/* Top tag & time */}
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary truncate max-w-[110px]">
                {req.category}
              </span>
              <span className="text-muted-foreground font-medium shrink-0">
                {timeAgo(req.created_at)}
              </span>
            </div>

            {/* Title */}
            <h4 className="mt-1.5 font-display text-xs font-black text-foreground group-hover:text-primary transition line-clamp-1">
              {req.title}
            </h4>

            {/* Offering summary */}
            <div className="mt-1.5 flex items-start gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded-xl px-2 py-1">
              <ArrowRightLeft className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-tight">
                <strong className="font-bold">Offers:</strong> {req.offering_description}
              </span>
            </div>

            {/* Requester & Location */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-1.5">
              <span className="font-semibold text-foreground/80 truncate">
                @{req.user?.username || "member"}
              </span>
              <span className="flex items-center gap-0.5 shrink-0">
                <MapPin className="h-2.5 w-2.5 text-primary/70" /> {req.emirate || "UAE"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Post a Request Action */}
      <div className="mt-3 pt-2.5 border-t border-border/60 text-center">
        <Link
          to={signedIn ? "/wanted/post" : "/auth"}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1.5 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/20 transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Post Wanted Request
        </Link>
      </div>
    </div>
  );
}
