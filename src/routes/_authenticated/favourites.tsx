import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { listFavourites } from "@/lib/favourites.functions";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/favourites")({
  head: () => ({
    meta: [
      { title: "Saved listings — SWAP" },
      { name: "description", content: "Listings you've saved to revisit later." },
      { property: "og:title", content: "Saved listings — SWAP" },
      { property: "og:description", content: "Your saved SWAP listings." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const fn = useServerFn(listFavourites);
  const { data } = useQuery({ queryKey: ["favourites"], queryFn: () => fn() });
  const saved = data ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Bookmark className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-black">Saved</h1>
            <p className="text-muted-foreground text-sm">Listings you've saved for later.</p>
          </div>
        </div>

        {saved.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">
            Nothing saved yet — tap the bookmark on any listing.
            <Link to="/listings" className="mt-3 block text-sm font-bold text-primary hover:underline">
              Browse listings →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((l: any) => <ListingCard key={l.id} listing={l} initiallyFavourited />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
