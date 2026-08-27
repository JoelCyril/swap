import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlockedIds } from "@/lib/use-blocks";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryBar } from "@/components/layout/CategoryBar";
import { Footer } from "@/components/layout/Footer";
import { InterestPicker } from "@/components/InterestPicker";
import { FilterSidebar, MobileFilters, type SortKey } from "@/components/listings/FilterSidebar";
import { ListingCard } from "@/components/listings/ListingCard";
import { listListings } from "@/lib/listings.functions";
import { listMyFavouriteIds } from "@/lib/favourites.functions";
import { listMyFlaggedListingIds } from "@/lib/flags.functions";
import { searchProfiles, getMyProfile } from "@/lib/profile.functions";
import { CATEGORIES, emirateOf, type ItemCategory, type ItemCondition } from "@/lib/db-types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/listings/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q.slice(0, 80) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "SWAP │ Trade Items Easily" },
      {
        name: "description",
        content: "Browse items UAE neighbours want to trade. Filter by category, emirate and area.",
      },
      { property: "og:title", content: "Browse listings — SWAP" },
      { property: "og:description", content: "Find items to swap in your emirate and area." },
    ],
  }),
  component: ListingsPage,
});

function ListingsPage() {
  const { q } = Route.useSearch();
  const qc = useQueryClient();
  const [active, setActive] = useState<ItemCategory | "All">("All");
  const [userId, setUserId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [conditions, setConditions] = useState<ItemCondition[]>([]);
  const [emirate, setEmirate] = useState("");
  const [sort, setSort] = useState<SortKey>("shuffle");
  const [interestPromptDismissed, setInterestPromptDismissed] = useState(false);
  const [interestPromptSkipped, setInterestPromptSkipped] = useState(false);
  const [localInterests, setLocalInterests] = useState<ItemCategory[]>([]);
  // Stable per-visit shuffle seed so cards don't jump around while browsing.
  const [seed] = useState(() => Math.random());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signedIn = !!userId;

  useEffect(() => {
    if (!userId) {
      setInterestPromptSkipped(false);
      setInterestPromptDismissed(false);
      return;
    }
    setInterestPromptSkipped(localStorage.getItem(`swap_interests_prompt_${userId}`) === "skipped");
    try {
      const saved = JSON.parse(localStorage.getItem("swap_interests") ?? "[]");
      setLocalInterests(
        Array.isArray(saved)
          ? saved.filter((cat): cat is ItemCategory => CATEGORIES.includes(cat as ItemCategory))
          : [],
      );
    } catch {
      setLocalInterests([]);
    }
    setInterestPromptDismissed(false);
  }, [userId]);

  const fn = useServerFn(listListings);
  const savedFn = useServerFn(listMyFavouriteIds);
  const flaggedFn = useServerFn(listMyFlaggedListingIds);
  const peopleFn = useServerFn(searchProfiles);
  const meFn = useServerFn(getMyProfile);

  const { data, isLoading } = useQuery({
    queryKey: ["listings", active],
    queryFn: () => fn({ data: { category: active === "All" ? null : active } }),
  });
  const { data: savedIds } = useQuery({
    queryKey: ["my-fav-ids", userId],
    queryFn: () => savedFn(),
    enabled: signedIn,
  });
  const { data: flaggedIds } = useQuery({
    queryKey: ["flagged-ids", userId],
    queryFn: () => flaggedFn(),
    enabled: signedIn,
  });
  const { data: me } = useQuery({
    queryKey: ["me", userId],
    queryFn: () => meFn(),
    enabled: signedIn,
  });
  const { data: people } = useQuery({
    queryKey: ["people", q],
    queryFn: () => peopleFn({ data: { q: q! } }),
    enabled: !!q,
  });

  const blockedIds = useBlockedIds();

  const myArea = me?.profile?.location ?? null;
  const myInterests = ((me?.profile?.interests ?? []) as string[]).filter((cat): cat is ItemCategory =>
    CATEGORIES.includes(cat as ItemCategory),
  );
  const effectiveInterests = myInterests.length > 0 ? myInterests : localInterests;
  const interestPromptKey = userId ? `swap_interests_prompt_${userId}` : null;
  const shouldAskInterests =
    signedIn &&
    !!me?.profile &&
    effectiveInterests.length === 0 &&
    !interestPromptDismissed &&
    !interestPromptSkipped;

  const myLocation = myArea;
  const term = (q ?? "").toLowerCase().trim();
  const excluded = new Set([...(flaggedIds ?? []), ...hidden]);
  const listings = (data ?? [])
    .filter((l) => l.owner_id !== userId)
    .filter((l) => !blockedIds.has(l.owner_id))
    .filter((l) => !excluded.has(l.id))

    .filter((l) => conditions.length === 0 || conditions.includes(l.condition))
    .filter((l) => !emirate || l.emirate === emirate || (!l.emirate && emirateOf(l.location) === emirate))
    .filter((l) =>
      !term
        ? true
        : [l.title, l.description, l.looking_for, l.category, l.location, l.owner?.username, l.owner?.display_name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term)),
    )
    .sort((a, b) => {
      if (active === "All" && effectiveInterests.length > 0) {
        const diff = Number(effectiveInterests.includes(b.category)) - Number(effectiveInterests.includes(a.category));
        if (diff !== 0) return diff;
      }
      if (sort === "shuffle") {
        const hash = (id: string) => Math.abs(Math.sin([...id].reduce((s, c) => s + c.charCodeAt(0), 0) * (seed + 1)));
        return hash(a.id) - hash(b.id);
      }
      if (sort === "nearest" && myLocation) {
        const rank = (l: typeof a) => (l.location === myLocation ? 0 : 1);
        const diff = rank(a) - rank(b);
        if (diff !== 0) return diff;
      }
      const at = new Date(a.created_at).getTime();
      const bt = new Date(b.created_at).getTime();
      return sort === "oldest" ? at - bt : bt - at;
    });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {shouldAskInterests && (
        <InterestPicker
          storageKey={interestPromptKey ?? undefined}
          onDone={(interests) => {
            setLocalInterests(interests);
            setInterestPromptDismissed(true);
            qc.invalidateQueries({ queryKey: ["me", userId] });
          }}
        />
      )}
      <Navbar />
      <CategoryBar active={active} onChange={setActive} />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 py-8 sm:px-6">
        <FilterSidebar
          conditions={conditions}
          onToggleCondition={(c) =>
            setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
          }
          emirate={emirate}
          onEmirate={setEmirate}
          signedIn={signedIn}
          sort={sort}
          onSort={setSort}
          onReset={() => {
            setConditions([]);
            setEmirate("");
            setSort("shuffle");
          }}
        />

        <main className="flex-1 min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-black sm:text-3xl">
                {q ? `Results for “${q}”` : active === "All" ? "All listings" : active}
              </h1>
            </div>
            <Link
              to={signedIn ? "/new-listing" : "/auth"}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 sm:px-6 sm:text-sm"
            >
              <Plus className="h-4 w-4" /> List an item
            </Link>
          </div>

          <div className="mb-5">
            <MobileFilters
              conditions={conditions}
              onToggleCondition={(c) =>
                setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
              }
              emirate={emirate}
              onEmirate={setEmirate}
              signedIn={signedIn}
              sort={sort}
              onSort={setSort}
              onReset={() => {
                setConditions([]);
                setEmirate("");
                setSort("shuffle");
              }}
            />
          </div>

          {q && (people ?? []).length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">People</h2>
              <div className="flex flex-wrap gap-2">
                {(people ?? []).map((p) => (
                  <Link
                    key={p.id}
                    to="/profile/$username"
                    params={{ username: p.username }}
                    className="flex items-center gap-2 rounded-full border-2 border-primary/20 bg-card px-3 py-2 text-sm transition hover:border-primary"
                  >
                    <span
                      className="grid h-7 w-7 place-items-center overflow-hidden rounded-full text-[10px] font-black text-white"
                      style={{ backgroundColor: p.avatar_url ? "transparent" : p.avatar_color }}
                    >
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        p.username?.[0]?.toUpperCase()
                      )}
                    </span>
                    <span className="font-semibold">@{p.username}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {isLoading ? (
            <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">
              Loading listings…
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center">
              <p className="text-muted-foreground">
                {q ? "No listings match your search." : "Nothing here yet — be the first to list something."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  initiallyFavourited={(savedIds ?? []).includes(l.id)}
                  onReported={(id) => setHidden((h) => [...h, id])}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

