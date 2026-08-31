import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSmartTradeMatches, type SmartMatch } from "@/lib/ai.functions";
import { supabase, getStoredSessionSync } from "@/integrations/supabase/client";
import { Sparkles, ArrowRightLeft, MapPin, ChevronRight, Package } from "lucide-react";

export function SmartMatchesSection() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(() => getStoredSessionSync()?.user?.id ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  const getMatches = useServerFn(getSmartTradeMatches);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["smart-trade-matches", userId],
    queryFn: () => getMatches(),
    enabled: !!userId,
    staleTime: 60000,
  });

  if (!userId || (!isLoading && matches.length === 0)) return null;

  return (
    <section className="mb-8 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-black tracking-tight text-foreground sm:text-xl">
                AI Smart Trade Matches
              </h2>
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                2-Way Fit
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Marketplace items that match what you're looking for in exchange for your inventory items
            </p>
          </div>
        </div>

        <Link
          to="/my-listings"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Manage Inventory <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center justify-center py-6 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-spin text-primary mr-2" />
          Finding matching traders across UAE…
        </div>
      ) : (
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m: SmartMatch, idx: number) => (
            <div
              key={idx}
              className="group relative flex flex-col rounded-2xl border-2 border-primary/20 bg-card p-3.5 shadow-sm transition hover:border-primary hover:shadow-card-hover"
            >
              {/* Score header */}
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" /> {m.match_score}% Match
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {m.matched_listing.emirate}
                </span>
              </div>

              {/* Items exchange preview */}
              <div className="mt-3 flex items-center gap-2.5">
                {/* Your item */}
                <div className="flex-1 min-w-0 rounded-xl bg-muted/60 p-2 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">You Trade</p>
                  <div className="mt-1 aspect-square w-full max-w-[50px] mx-auto overflow-hidden rounded-lg bg-primary/10 grid place-items-center">
                    {m.my_item.image_url ? (
                      <img src={m.my_item.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-primary/60" />
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold truncate text-foreground">{m.my_item.name}</p>
                </div>

                {/* Arrow */}
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </div>

                {/* Their item */}
                <div className="flex-1 min-w-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">You Get</p>
                  <div className="mt-1 aspect-square w-full max-w-[50px] mx-auto overflow-hidden rounded-lg bg-emerald-500/15 grid place-items-center">
                    {m.matched_listing.image_url ? (
                      <img src={m.matched_listing.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold truncate text-foreground">{m.matched_listing.title}</p>
                </div>
              </div>

              {/* Match reason */}
              <p className="mt-2.5 text-[11px] text-muted-foreground line-clamp-1 italic">
                "{m.match_reason}"
              </p>

              {/* Action */}
              <button
                type="button"
                onClick={() => navigate({ to: `/listings/${m.matched_listing.id}` })}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Propose Swap
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
