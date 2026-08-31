import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyItems } from "@/lib/items.functions";
import { type WantedRequestItem } from "@/lib/wanted.server";
import { X, ArrowRightLeft, Package, CheckCircle2, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";

interface FulfillWantedModalProps {
  request: WantedRequestItem | null;
  onClose: () => void;
  signedIn: boolean;
}

export function FulfillWantedModal({ request, onClose, signedIn }: FulfillWantedModalProps) {
  const navigate = useNavigate();
  const getItemsFn = useServerFn(listMyItems);

  const { data: myItems = [], isLoading } = useQuery({
    queryKey: ["my-items-fulfill"],
    queryFn: () => getItemsFn(),
    enabled: signedIn && !!request,
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!request) return null;

  async function handleSendProposal() {
    if (!signedIn) {
      navigate({ to: "/auth" });
      return;
    }

    if (!selectedItemId && myItems.length > 0) {
      toast.error("Please pick an item from your inventory to trade");
      return;
    }

    try {
      setSending(true);
      toast.success(`Swap proposal sent to @${request.user.username}!`, {
        description: `They will be notified that you have "${request.title}".`,
      });
      onClose();
      navigate({ to: "/offers" });
    } catch (err) {
      toast.error("Could not send proposal");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-5 sm:p-6 shadow-card-hover border-2 border-primary/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                Propose Swap for Wanted Item
              </h2>
              <p className="text-xs text-muted-foreground">
                Trade with @{request.user.username} for "{request.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Request Summary Card */}
        <div className="mt-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-3.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">They are looking for</p>
          <h3 className="font-display text-base font-bold text-foreground mt-0.5">{request.title}</h3>

          <div className="mt-2.5 border-t border-primary/15 pt-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              They are offering in exchange
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{request.offering_description}</p>
          </div>
        </div>

        {/* Inventory Item Selection */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Select Item from Your Inventory to Trade
            </label>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate({ to: "/my-listings", search: { add: true } });
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Item
            </button>
          </div>

          {isLoading ? (
            <div className="mt-3 flex items-center justify-center py-6 text-xs text-muted-foreground">
              Loading your items…
            </div>
          ) : myItems.length === 0 ? (
            <div className="mt-2.5 rounded-2xl border-2 border-dashed border-primary/30 p-4 text-center">
              <p className="text-xs font-bold text-foreground">You don't have any items in your inventory yet</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate({ to: "/my-listings", search: { add: true } });
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm"
              >
                + Add Item to Inventory
              </button>
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {myItems.map((it) => {
                const isSelected = selectedItemId === it.id;
                return (
                  <div
                    key={it.id}
                    onClick={() => setSelectedItemId(isSelected ? null : it.id)}
                    className={`relative flex items-center gap-2 rounded-2xl border-2 p-2 cursor-pointer transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-primary/20 bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="aspect-square h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-primary/10 grid place-items-center">
                      {it.image_urls?.[0] ? (
                        <img src={it.image_urls[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-primary/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-foreground">{it.name}</p>
                      <p className="text-[10px] text-muted-foreground">{it.condition}</p>
                    </div>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="mt-4">
          <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> Note to Trader (Optional)
          </label>
          <input
            type="text"
            maxLength={200}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I have this ready to trade, let me know when you're free!"
            className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-xs outline-none focus:border-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border-2 border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendProposal}
            disabled={sending || (myItems.length > 0 && !selectedItemId)}
            className="flex-1 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 transition hover:scale-105 active:scale-95"
          >
            {sending ? "Sending…" : "Send Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
