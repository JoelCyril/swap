import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyOffers, cleanOfferMessage } from "@/lib/offers.functions";
import { useClearedOffers } from "@/lib/use-cleared-offers";
import { gradientForId, timeAgo, handle } from "@/lib/db-types";
import { ArrowRight, X, Package, Archive, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/offers/")({
  head: () => ({
    meta: [
      { title: "Your offers — SWAP" },
      { name: "description", content: "Track incoming and outgoing swap offers." },
      { property: "og:title", content: "Offers — SWAP" },
      { property: "og:description", content: "Your active and past swap offers." },
    ],
  }),
  component: OffersPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border border-amber-300",
  accepted: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  declined: "bg-rose-100 text-rose-800 border border-rose-300",
  withdrawn: "bg-zinc-100 text-zinc-700 border border-zinc-300",
  completed: "bg-blue-100 text-blue-800 border border-blue-300",
};

function OffersPage() {
  const fn = useServerFn(listMyOffers);
  const { data, isLoading } = useQuery({ queryKey: ["offers"], queryFn: () => fn() });

  const { cleared, clear } = useClearedOffers();
  const myId = data?.viewer_id ?? null;
  const all = data?.offers ?? [];

  // An active offer is in progress (pending or accepted) and not completed/removed
  const isOfferActive = (o: any) =>
    (o.status === "pending" || o.status === "accepted") &&
    o.listing?.status !== "completed" &&
    o.listing?.status !== "removed";

  const incoming = all.filter((o: any) => isOfferActive(o) && o.to_user === myId && !cleared.includes(o.id));
  const outgoing = all.filter((o: any) => isOfferActive(o) && o.from_user === myId && !cleared.includes(o.id));
  const completedSwaps = all.filter(
    (o: any) => (o.status === "completed" || o.listing?.status === "completed") && !cleared.includes(o.id)
  );

  const totalArchivedCount = all.filter(
    (o: any) =>
      cleared.includes(o.id) ||
      o.status === "declined" ||
      o.status === "withdrawn" ||
      ((o.status === "completed" || o.listing?.status === "completed") && cleared.includes(o.id))
  ).length;

  const handleArchive = (id: string) => {
    clear(id);
    toast.info("Offer moved to archive", {
      description: "You can view and restore it anytime from Archived Offers.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10 space-y-8 sm:space-y-10 min-w-0 overflow-x-hidden">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-black sm:text-4xl">Offers</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              All active incoming and outgoing swap requests.
            </p>
          </div>

          {/* Link to Dedicated Archive Page */}
          <Link
            to="/offers/archive"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition shadow-sm shrink-0"
          >
            <Archive className="h-4 w-4 text-primary" />
            <span>Archived Offers</span>
            {totalArchivedCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-black text-primary">
                {totalArchivedCount}
              </span>
            )}
          </Link>
        </div>

        {/* Incoming Offers */}
        <section className="min-w-0 w-full">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display text-lg font-black sm:text-2xl">Incoming</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
              {incoming.length}
            </span>
          </div>
          <OfferList offers={incoming} incoming myId={myId} onClear={handleArchive} isLoading={isLoading} />
        </section>

        {/* Outgoing Offers */}
        <section className="min-w-0 w-full">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display text-lg font-black sm:text-2xl">Outgoing</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
              {outgoing.length}
            </span>
          </div>
          <OfferList offers={outgoing} myId={myId} onClear={handleArchive} isLoading={isLoading} />
        </section>

        {/* Completed Swaps */}
        {completedSwaps.length > 0 && (
          <section className="min-w-0 w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="font-display text-lg font-black sm:text-2xl">Completed Trades</h2>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-black">
                {completedSwaps.length}
              </span>
            </div>
            <OfferList offers={completedSwaps} isCompleted myId={myId} onClear={handleArchive} isLoading={isLoading} />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function OfferList({
  offers,
  incoming = false,
  isCompleted = false,
  onClear,
  isLoading = false,
  myId = null,
}: {
  offers: any[];
  incoming?: boolean;
  isCompleted?: boolean;
  onClear: (id: string) => void;
  isLoading?: boolean;
  myId?: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent mr-2" />
        <span className="text-sm">Loading offers…</span>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-8 text-center text-muted-foreground text-sm">
        {isCompleted
          ? "No completed trades yet."
          : incoming
            ? "No active incoming offers."
            : "You have no active outgoing offers."}
      </div>
    );
  }

  return (
    <div className="grid gap-3 w-full min-w-0">
      {offers.map((o) => {
        const other =
          myId && o.to_user === myId
            ? o.from_profile
            : myId && o.from_user === myId
              ? o.to_profile
              : incoming
                ? o.from_profile
                : o.to_profile;
        const listing = o.listing ?? null;
        const cleanMsg = cleanOfferMessage(o.message);

        return (
          <div key={o.id} className="relative group w-full min-w-0">
            <Link
              to="/offers/$id"
              params={{ id: o.id }}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-3 hover:border-primary hover:shadow-card transition sm:flex sm:gap-4 sm:p-4 w-full min-w-0 overflow-hidden"
            >
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

              <div className="min-w-0 flex-1 pr-8 sm:pr-2 overflow-hidden">
                <p className="font-display text-base font-bold truncate sm:text-lg text-foreground">
                  {listing?.title ?? "Listing unavailable"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isCompleted ? "Completed trade with " : incoming ? "From " : "To "}
                  <span className="font-semibold text-foreground">{handle(other)}</span> · {timeAgo(o.created_at)}
                </p>
                {cleanMsg && <p className="mt-1 text-xs text-foreground/75 truncate italic">"{cleanMsg}"</p>}
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:hidden ${
                    STATUS_COLORS[o.status] ?? "bg-muted"
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <span
                className={`hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-block ${
                  STATUS_COLORS[o.status] ?? "bg-muted"
                }`}
              >
                {o.status}
              </span>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block group-hover:translate-x-0.5 transition" />
            </Link>

            {/* Archive / Dismiss button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear(o.id);
              }}
              aria-label={isCompleted ? "Archive this completed trade" : "Archive this offer"}
              title={isCompleted ? "Archive completed trade" : "Archive offer"}
              className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
