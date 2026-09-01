import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createWantedRequest, editWantedRequest } from "@/lib/wanted.functions";
import { type WantedRequestItem } from "@/lib/wanted.server";
import { CATEGORIES, EMIRATES, NEIGHBOURHOODS, OTHER_LOCATION, type ItemCategory } from "@/lib/db-types";
import { X, Sparkles, Megaphone, ArrowRightLeft, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";

interface CreateWantedModalProps {
  open: boolean;
  onClose: () => void;
  editingRequest?: WantedRequestItem | null;
}

export function CreateWantedModal({ open, onClose, editingRequest }: CreateWantedModalProps) {
  const qc = useQueryClient();
  const createFn = useServerFn(createWantedRequest);
  const editFn = useServerFn(editWantedRequest);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Electronics");
  const [offeringDescription, setOfferingDescription] = useState("");
  const [emirate, setEmirate] = useState("Dubai");
  const [locationChoice, setLocationChoice] = useState<string>(NEIGHBOURHOODS[0]);
  const [otherLocation, setOtherLocation] = useState("");

  const isEditing = Boolean(editingRequest);

  useEffect(() => {
    if (editingRequest) {
      setTitle(editingRequest.title);
      setCategory(editingRequest.category);
      setOfferingDescription(editingRequest.offering_description);
      setEmirate(editingRequest.emirate || "Dubai");
      if (NEIGHBOURHOODS.includes(editingRequest.location)) {
        setLocationChoice(editingRequest.location);
        setOtherLocation("");
      } else {
        setLocationChoice(OTHER_LOCATION);
        setOtherLocation(editingRequest.location || "");
      }
    } else {
      setTitle("");
      setCategory("Electronics");
      setOfferingDescription("");
      setEmirate("Dubai");
      setLocationChoice(NEIGHBOURHOODS[0]);
      setOtherLocation("");
    }
  }, [editingRequest, open]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const location = locationChoice === OTHER_LOCATION ? otherLocation.trim() : locationChoice;
      if (!title.trim()) throw new Error("Please enter what you are looking for");
      if (!offeringDescription.trim()) throw new Error("Please describe what you are willing to swap in return");
      if (!location) throw new Error("Please enter a location");

      if (isEditing && editingRequest) {
        return await editFn({
          data: {
            id: editingRequest.id,
            title: title.trim(),
            category,
            offering_description: offeringDescription.trim(),
            emirate,
            location,
          },
        });
      } else {
        return await createFn({
          data: {
            title: title.trim(),
            category,
            offering_description: offeringDescription.trim(),
            emirate,
            location,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Wanted request updated!"
          : "Wanted request posted to the Community Board!",
        {
          description: isEditing
            ? "Your changes have been saved."
            : "Traders who have this item will be able to propose swaps with you directly.",
        },
      );
      qc.invalidateQueries({ queryKey: ["wanted-requests"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save request");
    },
  });

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-5 sm:p-6 shadow-card-hover border-2 border-primary/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              {isEditing ? <Pencil className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                {isEditing ? "Edit Wanted Request" : "Post a Wanted Request"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Update what you are looking for and offering"
                  : "Tell the UAE barter community what you're looking for (ISO)"}
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

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
          className="mt-4 space-y-4"
        >
          {/* What are you looking for */}
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              What are you looking for? *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. PlayStation 5 Console, iPad Air, or Acoustic Guitar"
              className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary font-medium"
            />
          </div>

          {/* Category & Emirate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Emirate</label>
              <select
                value={emirate}
                onChange={(e) => setEmirate(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              >
                {EMIRATES.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Neighbourhood */}
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Area / Neighbourhood</label>
            <select
              value={locationChoice}
              onChange={(e) => setLocationChoice(e.target.value)}
              className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {NEIGHBOURHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={OTHER_LOCATION}>Other (Type your own)</option>
            </select>

            {locationChoice === OTHER_LOCATION && (
              <input
                required
                maxLength={100}
                placeholder="Enter your area (e.g. Al Barsha, JVC, Corniche)"
                value={otherLocation}
                onChange={(e) => setOtherLocation(e.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
              />
            )}
          </div>

          {/* What are you offering in return */}
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              What are you offering in return? *
            </label>
            <textarea
              required
              rows={3}
              maxLength={1000}
              value={offeringDescription}
              onChange={(e) => setOfferingDescription(e.target.value)}
              placeholder="e.g. Willing to trade my Apple Watch Ultra (Like New), Sony WH-1000XM4 Headphones, or check my inventory for options."
              className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saveMut.isPending || !title.trim() || !offeringDescription.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {saveMut.isPending ? (
                "Saving…"
              ) : isEditing ? (
                <>
                  <Pencil className="h-4 w-4" /> Save Changes
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4" /> Post to Wanted Board
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
