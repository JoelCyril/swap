import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase, getStoredSessionSync } from "@/integrations/supabase/client";
import { listMyPendingIncomingOffers } from "@/lib/offers.functions";
import { handle } from "@/lib/db-types";
import { ArrowRightLeft, ChevronRight, Package, X, Sparkles } from "lucide-react";

export function PendingOfferPopup() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(() => getStoredSessionSync()?.user?.id ?? null);
  const [minimized, setMinimized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPendingOffers = useServerFn(listMyPendingIncomingOffers);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) setUserId(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: pendingOffers = [] } = useQuery({
    queryKey: ["pending-incoming-offers", userId],
    queryFn: () => getPendingOffers(),
    enabled: !!userId,
    refetchInterval: 15000,
  });

  // Realtime subscription for instant updates on incoming offers
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`pending-offers-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
          filter: `to_user=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-incoming-offers"] });
          queryClient.invalidateQueries({ queryKey: ["my-offers"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  if (!userId || pendingOffers.length === 0) return null;

  const currentOffer = pendingOffers[Math.min(currentIndex, pendingOffers.length - 1)];
  if (!currentOffer) return null;

  // Don't obscure the offer page if the user is already on this exact offer
  if (pathname === `/offers/${currentOffer.id}`) return null;

  const fromUser = currentOffer.from_profile;
  const listing = currentOffer.listing;
  const avatarUrl = fromUser?.avatar_url;

  if (minimized) {
    return (
      <div className="fixed bottom-5 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span>
            {pendingOffers.length === 1 ? "1 Offer Awaiting Reply" : `${pendingOffers.length} Offers Awaiting Reply`}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      role="region"
      aria-label="Pending Swap Offer Notification"
      className="fixed top-20 right-3 sm:top-24 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[380px] max-w-sm animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-card/95 p-4 shadow-card-hover backdrop-blur-md transition-all hover:border-primary">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3 inline" /> New Swap Offer
            </span>
            {pendingOffers.length > 1 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {currentIndex + 1} of {pendingOffers.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(true);
            }}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Minimize notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card Body — Tap Target to open offer */}
        <button
          type="button"
          onClick={() => navigate({ to: `/offers/${currentOffer.id}` })}
          className="mt-3 block w-full text-left group"
        >
          {/* Sender & Item Summary */}
          <div className="flex items-start gap-3">
            {/* Sender Avatar */}
            <div
              className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-white font-black text-sm shadow-md border-2 border-primary/20"
              style={{ backgroundColor: avatarUrl ? "transparent" : fromUser?.avatar_color ?? "#ff8845" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                fromUser?.display_name?.[0]?.toUpperCase() ?? "U"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                {handle(fromUser)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                sent an offer on <span className="font-semibold text-foreground">"{listing?.title ?? "your item"}"</span>
              </p>
              {currentOffer.message ? (
                <p className="mt-1.5 rounded-xl bg-primary-soft/60 px-2.5 py-1.5 text-xs text-foreground/80 line-clamp-2 italic">
                  "{currentOffer.message}"
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Tap below to review items and reply.
                </p>
              )}
            </div>

            {/* Item Thumbnail */}
            {listing?.image_urls?.[0] ? (
              <img
                src={listing.image_urls[0]}
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Action Callout Button */}
          <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-gradient-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition group-hover:scale-[1.02] active:scale-[0.98]">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" /> View & Reply
            </span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>

        {/* Carousel indicator if multiple */}
        {pendingOffers.length > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 border-t border-border/40 pt-2">
            {pendingOffers.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`View offer ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
