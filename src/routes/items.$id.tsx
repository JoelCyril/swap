import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPublicItem, getMyItem } from "@/lib/items.functions";
import { ChevronLeft, ChevronRight, Info, ArrowRightLeft } from "lucide-react";
import { handle } from "@/lib/db-types";

export const Route = createFileRoute("/items/$id")({
  head: () => ({
    meta: [
      { title: "Inventory item — SWAP" },
      { name: "description", content: "Details of an item in a SWAP member's inventory." },
      { property: "og:title", content: "Inventory item — SWAP" },
      { property: "og:description", content: "Details of an item in a SWAP member's inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ItemPage,
});

function ItemPage() {
  const { id } = Route.useParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const pubFn = useServerFn(getPublicItem);
  const mineFn = useServerFn(getMyItem);

  const { data: pub, isLoading } = useQuery({
    queryKey: ["item-public", id],
    queryFn: () => pubFn({ data: { id } }),
  });
  const { data: mine } = useQuery({
    queryKey: ["item-mine", id, userId],
    queryFn: () => mineFn({ data: { id } }),
    enabled: !!userId,
  });

  const item: any = mine ?? pub;
  const isOwner = !!item && !!userId && item.owner_id === userId;

  if (isLoading && !item) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex-1 p-10 text-center text-muted-foreground">Loading…</div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex-1 p-10 text-center">
          <h1 className="font-display text-2xl font-black">Item not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may be private or has been removed.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const photos: string[] = item.image_urls ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl border-2 border-primary/20 bg-primary-soft text-8xl shadow-card">
              {photos.length > 0 ? (
                <img src={photos[photo]} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{item.image_emoji}</span>
              )}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhoto((p) => (p - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPhoto((p) => (p + 1) % photos.length)}
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {photos.map((u, i) => (
                  <button
                    key={u}
                    onClick={() => setPhoto(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === photo ? "border-primary" : "border-primary/20"}`}
                  >
                    <img src={u} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <h1 className="mt-6 font-display text-3xl font-black">{item.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.category} · {item.condition}
            </p>
            {item.description && <p className="mt-4 whitespace-pre-wrap text-sm">{item.description}</p>}
          </div>

          <aside className="space-y-4">
            {item.owner && (
              <Link
                to="/profile/$username"
                params={{ username: item.owner.username }}
                className="flex items-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-4 transition hover:border-primary"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white"
                  style={{ backgroundColor: item.owner.avatar_url ? "transparent" : item.owner.avatar_color }}
                >
                  {item.owner.avatar_url ? (
                    <img src={item.owner.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    item.owner.display_name?.[0]?.toUpperCase()
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{handle(item.owner)}</span>
                </span>
              </Link>
            )}

            <div className="flex items-start gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-card p-4 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>Inventory items aren't tradeable here. Swaps happen on listings in Browse.</p>
            </div>

            {isOwner && (
              <div className="space-y-2">
                <Link
                  to="/new-listing"
                  search={{ fromItem: item.id }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> List this to swap
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
