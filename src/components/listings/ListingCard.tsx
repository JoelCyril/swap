import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, Flag, ArrowRightLeft, Package } from "lucide-react";
import { gradientForId, timeAgo, handle, type ListingWithOwner } from "@/lib/db-types";
import { useServerFn } from "@tanstack/react-start";
import { useSavedIds, useToggleSaved } from "@/lib/use-saved";
import { flagListing } from "@/lib/flags.functions";
import { OfferDialog } from "@/components/listings/OfferDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  listing: ListingWithOwner;
  initiallyFavourited?: boolean;
  initiallyReported?: boolean;
  isFollowed?: boolean;
  onReported?: (listingId: string) => void;
}

export function ListingCard({
  listing,
  initiallyFavourited = false,
  initiallyReported = false,
  isFollowed = false,
  onReported,
}: Props) {
  const { savedIds, isLoading: savedLoading, userId } = useSavedIds();
  const toggleSaved = useToggleSaved();
  const saved = savedLoading ? initiallyFavourited : savedIds.includes(listing.id);
  const isOwner = !!userId && userId === listing.owner_id;

  const [reported, setReported] = useState(initiallyReported);
  const [offerOpen, setOfferOpen] = useState(false);
  const navigate = useNavigate();
  const flag = useServerFn(flagListing);

  const owner = listing.owner;
  const initials =
    owner?.display_name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  async function ensureAuth() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate({ to: "/auth" });
      return false;
    }
    return true;
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!(await ensureAuth())) return;
    const wasSaved = saved;
    toggleSaved.mutate(listing.id, {
      onSuccess: () => toast.success(wasSaved ? "Removed from Saved" : "Saved"),
    });
  }

  async function handleFlag(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (reported) return;
    if (!(await ensureAuth())) return;
    const reason = window.prompt("Why are you reporting this listing?");
    if (!reason) return;
    setReported(true);
    try {
      await flag({ data: { listing_id: listing.id, reason } });
      toast.success("Report submitted — this listing is now hidden from your feed");
      onReported?.(listing.id);
    } catch (err) {
      setReported(false);
      toast.error(err instanceof Error ? err.message : "Could not report");
    }
  }

  async function handleOffer(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!(await ensureAuth())) return;
    setOfferOpen(true);
  }

  function openListing() {
    navigate({ to: "/listings/$id", params: { id: listing.id } });
  }

  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    openListing();
  }

  const isCollector = Boolean(listing.moderation_note?.includes("COLLECTOR"));

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openListing}
      onKeyDown={handleCardKeyDown}
      className={`group relative flex min-w-0 flex-col rounded-md border-2 bg-card p-3 transition-all duration-300 hover:-translate-y-1.5 ${
        isCollector
          ? "border-amber-400/90 bg-gradient-to-b from-amber-400/[0.08] via-card to-card shadow-[0_0_24px_rgba(245,158,11,0.42),0_0_50px_rgba(251,191,36,0.22)] ring-1 ring-amber-400/60 hover:border-amber-300 hover:ring-2 hover:ring-amber-300/80 hover:shadow-[0_0_35px_rgba(245,158,11,0.7),0_0_65px_rgba(251,191,36,0.38)]"
          : "border-primary/25 shadow-card hover:border-primary hover:shadow-card-hover"
      }`}
    >
      <div className={`relative aspect-[4/3] overflow-hidden rounded-sm bg-gradient-to-br ${gradientForId(listing.id)} ${isCollector ? "ring-1 ring-amber-400/60" : ""}`}>
        {!isOwner && (
        <button
          type="button"
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save listing"}
          title={saved ? "Saved" : "Save"}
          className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-110 z-10"
        >
          <Bookmark className={`h-4 w-4 transition ${saved ? "fill-primary text-primary" : "text-primary/70"}`} />
        </button>
        )}
        <button
          type="button"
          onClick={handleFlag}
          aria-pressed={reported}
          aria-label={reported ? "Already reported" : "Report listing"}
          title={reported ? "You reported this listing" : "Report listing"}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-110 z-10"
        >
          <Flag className={`h-4 w-4 transition ${reported ? "fill-destructive text-destructive" : "text-primary/70"}`} />
        </button>

        {isCollector && (
          <div
            title="Verified Collector's Item awarded by SWAP moderators"
            className={`absolute top-2 ${!isOwner ? "left-12" : "left-2"} z-10 flex items-center rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.9)] border border-yellow-100/90 select-none`}
          >
            Collector's
          </div>
        )}
        {listing.image_urls && listing.image_urls.length > 0 ? (
          <img
            src={listing.image_urls[0]}
            alt={listing.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Package className="h-14 w-14 text-primary/40 transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}
        {owner && (
          <Link
            to="/profile/$username"
            params={{ username: owner.username }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${owner.display_name}'s profile`}
            className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition hover:scale-110 z-10 overflow-hidden"
            style={{ backgroundColor: owner.avatar_url ? "transparent" : owner.avatar_color }}
          >
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </Link>
        )}
        <div className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow">
          {listing.condition}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 px-1">
        <h3 className="truncate font-display text-sm font-black uppercase tracking-wide text-foreground">
          {listing.title}
        </h3>
        {listing.looking_for && (
          <div className="rounded-full bg-primary-soft px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-primary">
            Looking for: <span className="normal-case font-medium text-foreground/80">{listing.looking_for}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
          {owner && (
            <div className="min-w-0">
              <Link
                to="/profile/$username"
                params={{ username: owner.username }}
                onClick={(e) => e.stopPropagation()}
                className="block truncate font-medium hover:text-primary hover:underline"
              >
                {handle(owner)}
              </Link>
              {isFollowed && <span className="block text-[10px] font-semibold text-primary">You follow this person</span>}
            </div>
          )}

          <span className="shrink-0">{timeAgo(listing.created_at)}</span>
        </div>
        {isOwner ? (
          <div className="mt-1 rounded-full border-2 border-primary/30 py-2 text-center text-[11px] font-black uppercase tracking-wider text-primary">
            Your listing
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOffer}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow hover:scale-[1.02] active:scale-95"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Make an Offer
          </button>
        )}
      </div>

      {offerOpen && (
        <OfferDialog listingId={listing.id} listingTitle={listing.title} onClose={() => setOfferOpen(false)} />
      )}
    </article>
  );
}
