import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useBlockedIds } from "@/lib/use-blocks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getListing, deleteListing } from "@/lib/listings.functions";
import { listMyItems } from "@/lib/items.functions";
import { createOffer } from "@/lib/offers.functions";
import { useSavedIds, useToggleSaved } from "@/lib/use-saved";
import { flagListing } from "@/lib/flags.functions";
import { getPublicProfile, getMyProfile } from "@/lib/profile.functions";
import { adminToggleCollectorBadge } from "@/lib/admin.functions";
import { trackListingView } from "@/lib/views.functions";
import { supabase } from "@/integrations/supabase/client";
import { gradientForId, timeAgo, handle } from "@/lib/db-types";
import { ArrowRightLeft, MapPin, Star, Flag, Trash2, Pencil, ChevronLeft, ChevronRight, ShieldCheck, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/listings/$id")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Listing on SWAP` },
      { name: "description", content: `View a listing and make an offer on SWAP.` },
      { property: "og:title", content: "SWAP listing" },
      { property: "og:description", content: `Listing ${params.id} on SWAP.` },
    ],
  }),
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const get = useServerFn(getListing);
  const myItems = useServerFn(listMyItems);
  const flag = useServerFn(flagListing);
  const offer = useServerFn(createOffer);
  const removeListing = useServerFn(deleteListing);
  const trackViewFn = useServerFn(trackListingView);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const offerPanelRef = useRef<HTMLDivElement>(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => get({ data: { id } }),
  });

  // Track listing view on mount
  useEffect(() => {
    if (!id) return;
    const sessionKey = localStorage.getItem("swap_visitor_id") || (() => {
      const k = `vis_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem("swap_visitor_id", k);
      return k;
    })();

    trackViewFn({ data: { listingId: id, visitorKey: sessionKey } })
      .then((res) => {
        if (res && typeof res.viewsCount === "number") {
          setViewCount(res.viewsCount);
        }
      })
      .catch(() => {});
  }, [id, trackViewFn]);

  const publicProfileFn = useServerFn(getPublicProfile);
  const ownerUsername = listing?.owner?.username;
  const { data: ownerPublic } = useQuery({
    queryKey: ["public-profile", ownerUsername],
    queryFn: () => publicProfileFn({ data: { username: ownerUsername! } }),
    enabled: !!ownerUsername,
  });

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setMyUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSignedIn(!!s);
      setMyUserId(s?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (location.hash !== "offer") return;
    offerPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const { data: items } = useQuery({
    queryKey: ["my-items"],
    queryFn: () => myItems(),
    enabled: !!signedIn,
  });
  const { savedIds } = useSavedIds();
  const toggleSaved = useToggleSaved();

  const createOfferMut = useMutation({
    mutationFn: async () => {
      if (selected.size === 0) throw new Error("Pick at least one item to offer");
      await offer({ data: { listing_id: id, offered_item_ids: [...selected], message } });
    },
    onSuccess: () => {
      toast.success("Offer sent!");
      setSelected(new Set());
      setMessage("");
      navigate({ to: "/offers" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const blockedIds = useBlockedIds();
  const meFn = useServerFn(getMyProfile);
  const { data: myProfile } = useQuery({
    queryKey: ["me-profile-role"],
    queryFn: () => meFn(),
    enabled: !!signedIn,
  });
  const isAdmin = Boolean(myProfile?.roles?.includes("admin"));

  const toggleCollectorFn = useServerFn(adminToggleCollectorBadge);
  const toggleCollectorMut = useMutation({
    mutationFn: () => toggleCollectorFn({ data: { id } }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["listing", id] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to toggle badge"),
  });

  const deleteMut = useMutation({
    mutationFn: () => removeListing({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["listings"] });
      navigate({ to: "/listings" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete listing"),
  });


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl p-8 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (listing && blockedIds.has(listing.owner_id)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl p-8 text-center">
          <h1 className="text-2xl font-black">Listing unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can't view this listing because one of you has blocked the other.
          </p>
          <Link to="/listings" className="mt-4 inline-block text-primary hover:underline">Browse other listings</Link>
        </div>
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl p-8 text-center">
          <h1 className="text-2xl font-black">Listing not found</h1>
          <Link to="/listings" className="mt-4 inline-block text-primary hover:underline">Browse other listings</Link>
        </div>
      </div>
    );
  }

  const isFav = savedIds.includes(id);
  const isOwner = !!myUserId && myUserId === listing.owner_id;
  const owner = listing.owner;
  const photos: string[] = listing.image_urls ?? [];


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
          <div className="min-w-0">
            <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br ${gradientForId(listing.id)}`}>
              {photos.length > 0 ? (
                <img src={photos[Math.min(activePhoto, photos.length - 1)]} alt={listing.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <Package className="h-24 w-24 text-primary/40 sm:h-32 sm:w-32" />
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => setActivePhoto((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow transition hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setActivePhoto((i) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow transition hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                    {Math.min(activePhoto, photos.length - 1) + 1} / {photos.length}
                  </div>
                </>
              )}
              <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow">
                {listing.condition}
              </div>
            </div>
            {photos.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {photos.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    aria-label={`Show photo ${i + 1}`}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      i === activePhoto ? "border-primary" : "border-transparent hover:border-primary/40"
                    }`}
                  >
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}


            <div className="mt-6 min-w-0">
              {listing.moderation_note?.includes("COLLECTOR") && (
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/25 to-amber-600/20 border border-amber-500/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 shadow-2xs">
                  <span>🏆</span> Verified Collector's Item
                </div>
              )}

              <h1 className="font-display text-2xl font-black break-words sm:text-3xl lg:text-4xl">{listing.title}</h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {listing.location}</span>
                <span>· {listing.category}</span>
                <span>· {timeAgo(listing.created_at)}</span>
              </div>

              {/* Moderator Controls Box */}
              {isAdmin && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        Moderator Controls
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Status: <strong className="text-foreground">{listing.moderation_note?.includes("COLLECTOR") ? "🏆 Collector's Item Awarded" : "Standard Listing"}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollectorMut.mutate()}
                    disabled={toggleCollectorMut.isPending}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition active:scale-95 cursor-pointer ${
                      listing.moderation_note?.includes("COLLECTOR")
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-amber-600 hover:bg-amber-700 shadow-glow"
                    }`}
                  >
                    🏆 {listing.moderation_note?.includes("COLLECTOR") ? "Remove Collector's Badge" : "Award Collector's Badge"}
                  </button>
                </div>
              )}

              {listing.description && (
                <p className="mt-4 text-foreground/80 whitespace-pre-wrap">{listing.description}</p>
              )}
              {listing.looking_for && (
                <div className="mt-4 rounded-2xl border-2 border-primary/20 bg-primary-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Looking for</p>
                  <p className="mt-1">{listing.looking_for}</p>
                </div>
              )}
            </div>

            {owner && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-primary/20 bg-card p-4">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white text-lg font-black text-white shadow"
                  style={{ backgroundColor: owner.avatar_url ? "transparent" : owner.avatar_color }}
                >
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt={owner.display_name} className="h-full w-full object-cover" />
                  ) : (
                    owner.display_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/profile/$username"
                      params={{ username: owner.username }}
                      className="font-display text-lg font-bold hover:text-primary"
                    >
                      {handle(owner)}
                    </Link>
                    {ownerPublic?.isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Listed by {handle(owner)} · {owner.location ?? "UAE"}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {isOwner && (
              <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card">
                <h2 className="font-display text-xl font-black">Your listing</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Edit the details anytime, or delete it for everyone.
                </p>
                <Link
                  to="/edit-listing/$id"
                  params={{ id: listing.id }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow"
                >
                  <Pencil className="h-4 w-4" /> Edit listing
                </Link>
                <button
                  type="button"
                  disabled={deleteMut.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this listing? This can't be undone.")) deleteMut.mutate();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-destructive px-5 py-2 text-xs font-black uppercase tracking-wider text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> {deleteMut.isPending ? "Deleting…" : "Delete listing"}
                </button>
              </div>
            )}

            {!isOwner && (
            <div id="offer" ref={offerPanelRef} className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card">
              <h2 className="font-display text-xl font-black flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" /> Make an offer
              </h2>

              {!signedIn ? (
                <>
                  <p className="mt-3 text-sm text-muted-foreground">Sign in to offer one of your items.</p>
                  <Link
                    to="/auth"
                    className="mt-4 flex items-center justify-center rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase tracking-wider text-primary-foreground"
                  >
                    Sign in
                  </Link>
                </>
              ) : listing.status !== "active" ? (
                <p className="mt-3 text-sm text-muted-foreground">This listing is {listing.status}.</p>
              ) : (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">Pick items from your inventory to offer:</p>
                  {items && items.length > 0 ? (
                    <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                      {items.map((it) => {
                        const on = selected.has(it.id);
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => {
                              const next = new Set(selected);
                              on ? next.delete(it.id) : next.add(it.id);
                              setSelected(next);
                            }}
                            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition ${
                              on ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                              <Package className="h-5 w-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{it.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{it.condition}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border-2 border-dashed border-primary/30 p-4 text-center">
                      <p className="text-xs text-muted-foreground">You don't have any items yet.</p>
                      <Link to="/new-listing" className="mt-2 inline-block text-xs font-bold text-primary hover:underline">
                        Create an item →
                      </Link>
                    </div>
                  )}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Optional message…"
                    maxLength={1000}
                    rows={3}
                    className="mt-3 w-full rounded-2xl border-2 border-primary/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => createOfferMut.mutate()}
                    disabled={createOfferMut.isPending || selected.size === 0}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
                  >
                    {createOfferMut.isPending ? "Sending…" : `Send offer (${selected.size})`}
                  </button>
                </>
              )}
            </div>
            )}

            <div className="rounded-3xl border-2 border-primary/20 bg-card p-4 flex gap-2">
              {!isOwner && (
              <button
                onClick={() => (signedIn ? toggleSaved.mutate(id) : navigate({ to: "/auth" }))}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/30 py-2 text-xs font-bold uppercase text-primary hover:bg-primary-soft transition"
              >
                <Star className={`h-4 w-4 ${isFav ? "fill-primary" : ""}`} /> {isFav ? "Saved" : "Save"}
              </button>
              )}
              <button
                onClick={async () => {
                  if (!signedIn) return navigate({ to: "/auth" });
                  const reason = window.prompt("Why are you reporting this?");
                  if (!reason) return;
                  try {
                    await flag({ data: { listing_id: id, reason } });
                    toast.success("Report submitted");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-destructive/30 px-4 py-2 text-xs font-bold uppercase text-destructive hover:bg-destructive/10 transition"
              >
                <Flag className="h-4 w-4" /> Report
              </button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
