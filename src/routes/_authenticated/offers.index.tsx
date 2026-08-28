import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyOffers } from "@/lib/offers.functions";
import { gradientForId, timeAgo, handle } from "@/lib/db-types";
import { ArrowRight, X, Package } from "lucide-react";

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
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-700",
  completed: "bg-blue-100 text-blue-800",
};

const CLEARED_KEY = "swap.clearedOffers";

function useClearedOffers() {
  const [cleared, setCleared] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLEARED_KEY);
      if (raw) setCleared(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);
  function clear(id: string) {
    setCleared((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem(CLEARED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }
  function reset() {
    setCleared([]);
    try {
      localStorage.removeItem(CLEARED_KEY);
    } catch {
      /* ignore */
    }
  }
  return { cleared, clear, reset };
}

function OffersPage() {
  const fn = useServerFn(listMyOffers);
  const { data } = useQuery({ queryKey: ["offers"], queryFn: () => fn() });

  const { cleared, clear, reset } = useClearedOffers();
  const myId = data?.viewer_id ?? null;
  const all = data?.offers ?? [];
  const offers = all.filter((o: any) => !cleared.includes(o.id));
  const incoming = offers.filter((o: any) => o.to_user === myId);
  const outgoing = offers.filter((o: any) => o.from_user === myId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10 space-y-8 sm:space-y-10">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black sm:text-4xl">Offers</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">All incoming and outgoing swap requests.</p>
          {cleared.length > 0 && (
            <button
              onClick={reset}
              className="mt-3 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
            >
              Show {cleared.length} cleared offer{cleared.length === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <section className="min-w-0">
          <h2 className="font-display text-lg font-black mb-4 sm:text-2xl">Incoming ({incoming.length})</h2>
          <OfferList offers={incoming} incoming onClear={clear} />
        </section>

        <section className="min-w-0">
          <h2 className="font-display text-lg font-black mb-4 sm:text-2xl">Outgoing ({outgoing.length})</h2>
          <OfferList offers={outgoing} onClear={clear} />
        </section>

      </main>
      <Footer />
    </div>
  );
}

function OfferList({ offers, incoming = false, onClear }: { offers: any[]; incoming?: boolean; onClear: (id: string) => void }) {
  if (offers.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-8 text-center text-muted-foreground text-sm">
        {incoming ? "No incoming offers yet." : "You haven't made any offers yet."}
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {offers.map((o) => {
        const other = incoming ? o.from_profile : o.to_profile;
        const listing = o.listing ?? null;
        return (
          <div key={o.id} className="relative">
          <Link
            to="/offers/$id"
            params={{ id: o.id }}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-3 hover:border-primary hover:shadow-card transition sm:flex sm:gap-4 sm:p-4"
          >
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(listing?.id ?? o.id)} sm:h-16 sm:w-16`}>
              <Package className="h-7 w-7 text-primary/50" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold truncate sm:text-lg">{listing?.title ?? "Listing unavailable"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {incoming ? "From" : "To"} {handle(other)} · {timeAgo(o.created_at)}
              </p>
              {o.message && <p className="mt-1 text-sm text-foreground/70 truncate">"{o.message}"</p>}
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:hidden ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>
                {o.status}
              </span>
            </div>
            <span className={`hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-block ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>
              {o.status}
            </span>
            <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
          </Link>
          <button
            onClick={() => onClear(o.id)}
            aria-label="Clear this offer from the list"
            title="Clear from list"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-primary/20 bg-card text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          </div>

        );
      })}
    </div>
  );
}
