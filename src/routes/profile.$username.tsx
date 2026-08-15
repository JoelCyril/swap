import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { BanUserPanel } from "@/components/admin/BanUserPanel";
import { listListingsByUsername } from "@/lib/listings.functions";
import { getPublicProfile, getMyProfile } from "@/lib/profile.functions";
import { MapPin, ShieldCheck } from "lucide-react";
import { handle } from "@/lib/db-types";
import { useBlockedIds } from "@/lib/use-blocks";


export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — SWAP` },
      { name: "description", content: `View @${params.username}'s public inventory and active listings on SWAP.` },
      { property: "og:title", content: `@${params.username} on SWAP` },
      { property: "og:description", content: `Public inventory and listings for @${params.username}.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const fn = useServerFn(listListingsByUsername);
  const { data, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fn({ data: { username } }),
  });
  const pubFn = useServerFn(getPublicProfile);
  const { data: pub } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: () => pubFn({ data: { username } }),
  });

  const [showAllItems, setShowAllItems] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setViewerId(data.session?.user.id ?? null));
  }, []);
  const meFn = useServerFn(getMyProfile);
  const { data: me } = useQuery({
    queryKey: ["me", viewerId],
    queryFn: () => meFn(),
    enabled: !!viewerId,
  });
  const viewerIsAdmin = !!me?.roles?.includes("admin");
  const blockedIds = useBlockedIds();



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!data?.profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black">User not found</h1>
        </div>
      </div>
    );
  }

  const owner = data.profile;
  const listings = data.listings;

  if (blockedIds.has(owner.id)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black">Profile unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can't view this member because one of you has blocked the other.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="relative overflow-hidden">
        {owner.banner_url ? (
          <>
            <img src={owner.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/45 to-foreground/25" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-primary opacity-90" />
            <div className="absolute inset-0 bg-gradient-hero" />
          </>
        )}
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-[auto_minmax(0,1fr)] items-center gap-6 px-6 py-12 text-primary-foreground">
          <div
            className="grid h-24 w-24 sm:h-32 sm:w-32 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-white/90 text-3xl font-black text-white shadow-glow"
            style={{ backgroundColor: owner.avatar_url ? "transparent" : owner.avatar_color }}
          >
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              owner.display_name?.split(" ").map((s) => s[0]).join("").slice(0, 2)
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-5xl font-black truncate">{handle(owner)}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {owner.location ?? "UAE"}</span>
            </div>
            {pub?.isAdmin && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" /> Moderator
              </span>
            )}
            {owner.bio && <p className="mt-3 max-w-2xl text-sm text-white/90">{owner.bio}</p>}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        {viewerIsAdmin && !pub?.isAdmin && viewerId !== owner.id && (
          <BanUserPanel userId={owner.id} displayName={owner.display_name} />
        )}

        {(pub?.items ?? []).length > 0 && (
          <section className="mb-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-black">Public inventory</h2>
              {(pub?.items ?? []).length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllItems((v) => !v)}
                  className="rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft"
                >
                  {showAllItems ? "Show less" : `View all ${(pub?.items ?? []).length} items`}
                </button>
              )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(showAllItems ? (pub?.items ?? []) : (pub?.items ?? []).slice(0, 4)).map((it) => (
                <Link
                  key={it.id}
                  to="/items/$id"
                  params={{ id: it.id }}
                  className="rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card transition hover:border-primary hover:shadow-card-hover"
                >
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-primary-soft text-5xl">
                    {it.image_urls && it.image_urls.length > 0 ? (
                      <img src={it.image_urls[0]} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden>{it.image_emoji}</span>
                    )}
                  </div>
                  <p className="mt-3 truncate text-sm font-bold">{it.name}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{it.category} · {it.condition}</p>
                </Link>
              ))}

            </div>
          </section>
        )}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-black">Active listings</h2>
          {listings.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllListings((v) => !v)}
              className="rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft"
            >
              {showAllListings ? "Show less" : `View all ${listings.length} listings`}
            </button>
          )}
        </div>
        {listings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">
            No public listings yet.
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(showAllListings ? listings : listings.slice(0, 3)).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
