import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyOffers } from "@/lib/offers.functions";
import { useClearedOffers } from "@/lib/use-cleared-offers";
import { gradientForId, timeAgo, handle } from "@/lib/db-types";
import { ArrowLeft, ArrowRight, RotateCcw, Package, Archive, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/offers/archive")({
  head: () => ({
    meta: [
      { title: "Archived Offers — SWAP UAE" },
      { name: "description", content: "View past, declined, and archived swap offers." },
      { property: "og:title", content: "Archived Offers — SWAP UAE" },
      { property: "og:description", content: "Your archived and past swap offers." },
    ],
  }),
  component: OffersArchivePage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  declined: "bg-rose-100 text-rose-800 border-rose-300",
  withdrawn: "bg-zinc-100 text-zinc-700 border-zinc-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
};

function OffersArchivePage() {
  const qc = useQueryClient();
  const fn = useServerFn(listMyOffers);
  const { data, isLoading } = useQuery({ queryKey: ["offers"], queryFn: () => fn() });
  const { cleared, restore, restoreAll, isLoaded } = useClearedOffers();

  const myId = data?.viewer_id ?? null;
  const allOffers = data?.offers ?? [];
  const archivedOffers = allOffers.filter((o: any) => cleared.includes(o.id));

  const handleRestoreOne = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    restore(id);
    toast.success("Offer restored to your active list");
    qc.invalidateQueries({ queryKey: ["offers"] });
  };

  const handleRestoreAll = () => {
    if (confirm("Restore all archived offers to your active list?")) {
      restoreAll();
      toast.success("All offers restored to your active list");
      qc.invalidateQueries({ queryKey: ["offers"] });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/offers"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Active Offers
        </Link>

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Archive className="h-5 w-5" />
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                Archived Offers ({archivedOffers.length})
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Past, closed, and dismissed swap offers. You can view their details or restore any offer to your active list anytime.
            </p>
          </div>

          {archivedOffers.length > 0 && (
            <button
              onClick={handleRestoreAll}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-card px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition active:scale-95 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restore All to Active
            </button>
          )}
        </div>

        {/* Offers List */}
        {isLoading || !isLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-semibold">Loading archived offers…</p>
          </div>
        ) : archivedOffers.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/25 bg-card p-10 sm:p-14 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Archive className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold">No Archived Offers</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              When you dismiss or close completed swap offers from your active list, they will be neatly stored here for your reference.
            </p>
            <Link
              to="/offers"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
            >
              View Active Offers
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {archivedOffers.map((o: any) => {
              const incoming = o.to_user === myId;
              const other = incoming ? o.from_profile : o.to_profile;
              const listing = o.listing ?? null;
              const statusClass = STATUS_COLORS[o.status] ?? "bg-muted text-muted-foreground border-border";

              return (
                <div key={o.id} className="relative group">
                  <Link
                    to="/offers/$id"
                    params={{ id: o.id }}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 border-border/80 bg-card/80 p-3.5 hover:border-primary hover:shadow-card hover:bg-card transition sm:flex sm:gap-4 sm:p-4"
                  >
                    {/* Item Image or Gradient */}
                    {listing?.image_urls?.[0] ? (
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        className="h-14 w-14 rounded-2xl object-cover shrink-0 sm:h-16 sm:w-16 border border-border"
                      />
                    ) : (
                      <div
                        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(
                          listing?.id ?? o.id,
                        )} sm:h-16 sm:w-16`}
                      >
                        <Package className="h-7 w-7 text-primary/50" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="min-w-0 flex-1 pr-14 sm:pr-24">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display text-base font-bold truncate sm:text-lg text-foreground">
                          {listing?.title ?? "Listing unavailable"}
                        </p>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {incoming ? "Incoming from" : "Sent to"} <span className="font-semibold text-foreground">@{handle(other)}</span> · {timeAgo(o.created_at)}
                      </p>
                      {o.message && (
                        <p className="mt-1 text-xs text-foreground/75 italic line-clamp-1">
                          "{o.message}"
                        </p>
                      )}
                    </div>

                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block group-hover:translate-x-0.5 transition" />
                  </Link>

                  {/* Restore Button */}
                  <button
                    type="button"
                    onClick={(e) => handleRestoreOne(o.id, e)}
                    aria-label="Restore offer to active list"
                    title="Restore to active list"
                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-bold text-primary shadow-sm hover:bg-primary/10 hover:border-primary transition cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Restore</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
