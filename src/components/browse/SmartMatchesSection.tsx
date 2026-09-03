import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSmartTradeMatches, type SmartMatch } from "@/lib/ai.functions";
import { supabase, getStoredSessionSync } from "@/integrations/supabase/client";
import { Sparkles, ArrowRightLeft, MapPin, ChevronRight, Package, ArrowRight } from "lucide-react";

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

  if (!userId) return null;

  return (
    <section className="mb-6 sm:mb-8 overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col gap-2.5 border-b border-border/60 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base font-black tracking-tight text-foreground sm:text-xl">
                AI Smart Trade Matches
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
              Suggested trades matching your items with active UAE listings
            </p>
          </div>
        </div>

        <Link
          to="/my-listings"
          className="self-start sm:self-auto text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
        >
          My Inventory <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="mt-4 flex items-center justify-center py-6 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-spin text-primary mr-2" />
          Analyzing trade compatibility across UAE…
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-primary/5 p-4 sm:p-5 text-center border border-primary/20">
          <p className="text-xs sm:text-sm font-bold text-foreground">
            Add items to your inventory to discover instant 2-way trade matches!
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground max-w-md mx-auto">
            Once you add items you want to trade, Gemini automatically pairs you with UAE members looking for what you have.
          </p>
          <Link
            to="/my-listings"
            search={{ add: true }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm transition hover:scale-105"
          >
            + Add Item to Inventory
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m: SmartMatch, idx: number) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl border-2 border-primary/20 bg-card p-3 sm:p-3.5 shadow-sm transition hover:border-primary hover:shadow-card-hover"
            >
              <div>
                {/* Score & Location */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    <Sparkles className="h-3 w-3" /> {m.match_score}% Match
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                    <MapPin className="h-3 w-3 shrink-0" /> {m.matched_listing.emirate}
                  </span>
                </div>

                {/* Side-by-Side Exchange Preview */}
                <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  {/* Your Item */}
                  <div className="min-w-0 rounded-xl bg-muted/60 p-2 text-center">
                    <p className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">You Trade</p>
                    <div className="mt-1 aspect-square w-11 h-11 mx-auto overflow-hidden rounded-lg bg-primary/10 grid place-items-center">
                      {m.my_item.image_url ? (
                        <img
                          src={m.my_item.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Package className="h-5 w-5 text-primary/60" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-bold truncate text-foreground" title={m.my_item.name}>
                      {m.my_item.name}
                    </p>
                  </div>

                  {/* Swap Arrow */}
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </div>

                  {/* Their Item */}
                  <div className="min-w-0 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-2 text-center">
                    <p className="text-[9px] uppercase font-black tracking-wider text-emerald-800 dark:text-emerald-300">You Get</p>
                    <div className="mt-1 aspect-square w-11 h-11 mx-auto overflow-hidden rounded-lg bg-emerald-500/15 grid place-items-center">
                      {m.matched_listing.image_url ? (
                        <img
                          src={m.matched_listing.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Package className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-bold truncate text-foreground" title={m.matched_listing.title}>
                      {m.matched_listing.title}
                    </p>
                  </div>
                </div>

                {/* Match reason */}
                <p className="mt-2 text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1 italic px-0.5">
                  "{m.match_reason}"
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => navigate({ to: `/listings/${m.matched_listing.id}` })}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowRight className="h-3.5 w-3.5" /> Propose Swap
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
