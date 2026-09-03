import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSmartTradeMatches, type SmartMatch } from "@/lib/ai.functions";
import { Sparkles, ArrowRightLeft, MapPin, Package, ArrowRight, ArrowLeft, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/smart-matches")({
  head: () => ({
    meta: [
      { title: "AI Smart Matches — SWAP UAE" },
      { name: "description", content: "Personalized 2-way trade matches computed by Gemini AI." },
      { property: "og:title", content: "AI Smart Matches — SWAP UAE" },
      { property: "og:description", content: "Discover instant 2-way barter matches tailored to your inventory in the UAE." },
    ],
  }),
  component: SmartMatchesPage,
});

function SmartMatchesPage() {
  const navigate = useNavigate();
  const getMatches = useServerFn(getSmartTradeMatches);

  const { data: matches = [], isLoading, refetch } = useQuery({
    queryKey: ["smart-trade-matches-page"],
    queryFn: () => getMatches(),
    staleTime: 60000,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1300px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Navigation Breadcrumb / Back */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/listings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
          <Link
            to="/my-listings"
            search={{ add: true }}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add to Inventory
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                    AI Smart Trade Matches
                  </h1>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                    2-Way Fit
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                  AI analyzes what you have in your inventory and pairs you directly with UAE members who are looking for your items.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-black text-primary">
                {matches.length} Match{matches.length === 1 ? "" : "es"} Found
              </span>
            </div>
          </div>
        </div>

        {/* Matches Grid / Empty State */}
        {isLoading ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Sparkles className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="font-display font-bold text-base text-foreground">Analyzing trade compatibility across the UAE…</p>
            <p className="text-xs text-muted-foreground mt-1">Comparing categories, conditions, and looking-for requirements</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center max-w-xl mx-auto">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-black">No smart matches found yet</h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Add more items to your inventory with clear photos and descriptions. Our AI will automatically scan active UAE listings to find compatible swaps for you!
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/my-listings"
                search={{ add: true }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
              >
                <Plus className="h-4 w-4" /> Add Inventory Item
              </Link>
              <Link
                to="/listings"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary/30 bg-card px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/10 transition"
              >
                Browse All Listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m: SmartMatch, idx: number) => (
              <article
                key={idx}
                className="group relative flex flex-col justify-between rounded-3xl border-2 border-primary/20 bg-card p-4 sm:p-5 shadow-card transition-all hover:border-primary hover:shadow-card-hover"
              >
                <div>
                  {/* Score & Emirate Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-xs">
                      <Sparkles className="h-3.5 w-3.5" /> {m.match_score}% Match
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" /> {m.matched_listing.emirate}
                    </span>
                  </div>

                  {/* Side-by-Side Exchange Preview */}
                  <div className="mt-3.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                    {/* Your Item */}
                    <div className="min-w-0 rounded-2xl bg-muted/60 p-3 text-center border border-border/40">
                      <p className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">You Trade</p>
                      <div className="mt-1.5 aspect-square w-14 h-14 mx-auto overflow-hidden rounded-xl bg-primary/10 grid place-items-center">
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
                          <Package className="h-6 w-6 text-primary/60" />
                        )}
                      </div>
                      <p className="mt-1.5 text-xs font-bold truncate text-foreground" title={m.my_item.name}>
                        {m.my_item.name}
                      </p>
                    </div>

                    {/* Swap Arrow */}
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary shadow-xs">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>

                    {/* Their Item */}
                    <div className="min-w-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-center">
                      <p className="text-[9px] uppercase font-black tracking-wider text-emerald-800 dark:text-emerald-300">You Get</p>
                      <div className="mt-1.5 aspect-square w-14 h-14 mx-auto overflow-hidden rounded-xl bg-emerald-500/15 grid place-items-center">
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
                          <Package className="h-6 w-6 text-emerald-600" />
                        )}
                      </div>
                      <p className="mt-1.5 text-xs font-bold truncate text-foreground" title={m.matched_listing.title}>
                        {m.matched_listing.title}
                      </p>
                    </div>
                  </div>

                  {/* Match Reason Explanation */}
                  <div className="mt-3.5 rounded-2xl bg-background/80 p-3 border border-border/60">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary">Compatibility Analysis</p>
                    <p className="mt-1 text-xs text-foreground/85 leading-relaxed italic">
                      "{m.match_reason}"
                    </p>
                  </div>
                </div>

                {/* Propose Swap Button */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => navigate({ to: `/listings/${m.matched_listing.id}` })}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm transition hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ArrowRight className="h-4 w-4" /> Propose Swap
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}