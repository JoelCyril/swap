import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyItems } from "@/lib/items.functions";
import { createOffer } from "@/lib/offers.functions";
import { ArrowRightLeft, X, Package } from "lucide-react";
import { toast } from "sonner";

interface Props {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}

export function OfferDialog({ listingId, listingTitle, onClose }: Props) {
  const navigate = useNavigate();
  const myItems = useServerFn(listMyItems);
  const offer = useServerFn(createOffer);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  const { data: items, isLoading } = useQuery({ queryKey: ["my-items"], queryFn: () => myItems() });

  const send = useMutation({
    mutationFn: async () => {
      if (selected.size === 0) throw new Error("Pick at least one item to offer");
      await offer({ data: { listing_id: listingId, offered_item_ids: [...selected], message } });
    },
    onSuccess: () => {
      toast.success("Offer sent!");
      onClose();
      navigate({ to: "/offers" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send offer"),
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Make an offer on ${listingTitle}`}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card-hover">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-black flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" /> Make an offer
            </h2>
            <p className="mt-1 text-xs text-muted-foreground truncate">For: {listingTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-primary-soft">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading your inventory…</p>
        ) : items && items.length > 0 ? (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pick items to offer
            </p>
            <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
              {items.map((it) => {
                const on = selected.has(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      const next = new Set(selected);
                      if (on) next.delete(it.id);
                      else next.add(it.id);
                      setSelected(next);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition ${
                      on ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
                      {it.image_urls && it.image_urls.length > 0 ? (
                        <img src={it.image_urls[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{it.name}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">{it.condition}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message…"
              maxLength={1000}
              rows={3}
              className="mt-3 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => send.mutate()}
              disabled={send.isPending || selected.size === 0}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {send.isPending ? "Sending…" : `Send offer (${selected.size})`}
            </button>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              You need at least one item in your inventory to make an offer.
            </p>
            <Link
              to="/new-listing"
              className="mt-3 inline-block rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground"
            >
              Create an item
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
