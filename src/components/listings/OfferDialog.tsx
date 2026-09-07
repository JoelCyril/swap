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
      await offer({
        data: {
          listing_id: listingId,
          offered_item_ids: [...selected],
          message: message.trim(),
        },
      });
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
      <div className="w-full max-w-md rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card-hover max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="font-display text-xl font-black flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="h-5 w-5 text-primary" /> Make an offer
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">For: {listingTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted-foreground hover:bg-primary-soft hover:text-foreground transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-0.5">
          {/* Items from inventory */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trade Items {items && items.length > 0 ? `(${selected.size} selected)` : ""}
              </p>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Clear items
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading your inventory…</p>
            ) : items && items.length > 0 ? (
              <div className="max-h-52 space-y-2 overflow-y-auto">
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
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition cursor-pointer ${
                        on ? "border-primary bg-primary-soft shadow-xs" : "border-border hover:border-primary/50"
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
                        <p className="truncate text-sm font-bold text-foreground">{it.name}</p>
                        <p className="text-[10px] uppercase text-muted-foreground">{it.condition}</p>
                      </div>
                      <span className={`h-4 w-4 rounded-full border grid place-items-center text-[10px] ${on ? "border-primary bg-primary text-white" : "border-muted-foreground/40"}`}>
                        {on ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-3.5 text-center">
                <p className="text-xs text-muted-foreground">
                  No inventory items. You can still make a cash offer above!
                </p>
                <Link
                  to="/new-listing"
                  className="mt-1.5 inline-block text-xs font-bold text-primary hover:underline"
                >
                  + Add an item to your inventory
                </Link>
              </div>
            )}
          </div>

          {/* Optional Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message…"
            maxLength={1000}
            rows={2}
            className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* Submit Button */}
        <div className="border-t border-border/80 pt-3">
          <button
            type="button"
            onClick={() => send.mutate()}
            disabled={send.isPending || selected.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {send.isPending
              ? "Sending…"
              : selected.size > 0
                ? `Send Swap Offer (${selected.size} Item${selected.size > 1 ? "s" : ""})`
                : "Pick items to offer"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
