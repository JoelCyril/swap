import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createListing } from "@/lib/listings.functions";
import { createItem, listMyItems, listMyListedItemIds } from "@/lib/items.functions";
import { uploadFileTo } from "@/lib/upload";
import {
  CATEGORIES,
  CONDITIONS,
  EMIRATES,
  NEIGHBOURHOODS,
  OTHER_LOCATION,
  type ItemCategory,
  type ItemCondition,
} from "@/lib/db-types";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";
import { ImageCropper } from "@/components/ImageCropper";



const searchSchema = z.object({ fromItem: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/new-listing")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "New listing — SWAP" },
      { name: "description", content: "Post something to trade with your neighbours." },
      { property: "og:title", content: "New listing — SWAP" },
      { property: "og:description", content: "Post an item to trade." },
    ],
  }),
  component: NewListingPage,
});

function NewListingPage() {
  const navigate = useNavigate();
  const { fromItem } = useSearch({ from: "/_authenticated/new-listing" });
  const create = useServerFn(createListing);
  const createInventoryItem = useServerFn(createItem);
  const myItemsFn = useServerFn(listMyItems);
  const { data: myItems } = useQuery({ queryKey: ["my-items"], queryFn: () => myItemsFn() });
  const listedFn = useServerFn(listMyListedItemIds);
  const { data: listedIds } = useQuery({ queryKey: ["my-listed-item-ids"], queryFn: () => listedFn() });
  const listedSet = new Set(listedIds ?? []);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Electronics" as ItemCategory,
    condition: "Good" as ItemCondition,
    image_emoji: "📦",
    location: NEIGHBOURHOODS[0],
    emirate: "" as string,
    looking_for: "",
    item_id: null as string | null,
    image_urls: [] as string[],
  });
  const [locationChoice, setLocationChoice] = useState<string>(NEIGHBOURHOODS[0]);
  const [otherLocation, setOtherLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [saveAsItem, setSaveAsItem] = useState(false);

  // Pre-fill from inventory item if requested
  useEffect(() => {
    if (!fromItem || !myItems) return;
    const it = myItems.find((i) => i.id === fromItem);
    if (!it) return;
    setForm((f) => ({
      ...f,
      title: it.name,
      description: it.description ?? "",
      category: it.category,
      condition: it.condition,
      image_emoji: it.image_emoji,
      item_id: it.id,
      image_urls: it.image_urls ?? [],
    }));
  }, [fromItem, myItems]);

  const mut = useMutation({
    mutationFn: async () => {
      const location = locationChoice === OTHER_LOCATION ? otherLocation.trim() : locationChoice;
      if (!location) throw new Error("Please enter a location");
      if (!form.emirate) throw new Error("Please select an emirate");
      if (form.image_urls.length === 0) throw new Error("Please add at least one photo");
      const item = form.item_id
        ? null
        : saveAsItem
          ? await createInventoryItem({
              data: {
                name: form.title,
                category: form.category,
                condition: form.condition,
                image_emoji: form.image_emoji,
                description: form.description,
                visibility: "public",
                image_urls: form.image_urls,
              },
            })
          : null;
      return create({ data: { ...form, item_id: form.item_id ?? item?.id ?? null, location } });
    },

    onSuccess: (row: any) => {
      if (row.withheld) {
        const reason = String(row.moderation_note ?? "prohibited content").replace(/\s+Matched:.*$/, "");
        toast.warning(`Your listing was flagged for: ${reason}`, {
          description: "Please wait until a moderator approves your listing.",
          duration: 8000,
        });
      } else {
        toast.success("Listing successfully created", {
          description: "It is live on the browse page now.",
        });
      }
      navigate({ to: "/listings/$id", params: { id: row.id } });
    },

    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = 8 - form.image_urls.length;
    const picked = Array.from(files)
      .slice(0, Math.max(room, 0))
      .filter((f) => {
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name} is over 10 MB`);
          return false;
        }
        return true;
      });
    setQueue((q) => [...q, ...picked]);
  }

  async function uploadCropped(file: File) {
    setUploading(true);
    try {
      const url = await uploadFileTo("listing-images", file);
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, url] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {queue.length > 0 && (
        <ImageCropper
          key={queue[0].name + queue.length}
          file={queue[0]}
          aspect={4 / 3}
          title="Crop listing photo"
          onCancel={() => setQueue((q) => q.slice(1))}
          onDone={async (f) => {
            setQueue((q) => q.slice(1));
            await uploadCropped(f);
          }}
        />
      )}
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="font-display text-4xl font-black">New listing</h1>
        <p className="mt-2 text-muted-foreground">Post an item you're willing to swap.</p>

        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="mt-8 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card">
          {(myItems ?? []).length > 0 && (
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/40 p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">Start from your inventory</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {(myItems ?? []).filter((it) => !listedSet.has(it.id)).map((it) => {
                  const picked = form.item_id === it.id;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() =>
                        picked
                          ? setForm((f) => ({ ...f, item_id: null }))
                          : setForm((f) => ({
                              ...f,
                              title: it.name,
                              description: it.description ?? "",
                              category: it.category,
                              condition: it.condition,
                              image_emoji: it.image_emoji,
                              item_id: it.id,
                              image_urls: it.image_urls ?? [],
                            }))
                      }
                      className={`w-24 shrink-0 rounded-2xl border-2 bg-card p-2 text-left transition ${
                        picked ? "border-primary shadow-glow" : "border-primary/20 hover:border-primary"
                      }`}
                    >
                      <span className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-primary-soft text-2xl">
                        {it.image_urls?.[0] ? (
                          <img src={it.image_urls[0]} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden>{it.image_emoji}</span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-[11px] font-bold">{it.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
            <input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
            <textarea rows={4} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Photos (required, up to 8)</label>

            <div className="mt-2 grid grid-cols-4 gap-2">
              {form.image_urls.map((url, i) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl border-2 border-primary/20">
                  <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_urls: f.image_urls.filter((u) => u !== url) }))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {form.image_urls.length < 8 && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary-soft">
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />
                  <div className="flex flex-col items-center gap-1 text-xs font-bold uppercase">
                    <Upload className="h-4 w-4" />
                    {uploading ? "…" : "Add"}
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })} className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Condition</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as ItemCondition })} className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm">
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Emirate</label>
              <select
                required
                value={form.emirate}
                onChange={(e) => setForm({ ...form, emirate: e.target.value })}
                className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
              >
                <option value="">Select emirate</option>
                {EMIRATES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Neighbourhood</label>
            <select
              value={locationChoice}
              onChange={(e) => setLocationChoice(e.target.value)}
              className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
            >
              {NEIGHBOURHOODS.map((n) => <option key={n}>{n}</option>)}
              <option value={OTHER_LOCATION}>Other (type your own)</option>
            </select>
            {locationChoice === OTHER_LOCATION && (
              <input
                required
                placeholder="Enter your neighbourhood"
                maxLength={120}
                value={otherLocation}
                onChange={(e) => setOtherLocation(e.target.value)}
                className="mt-2 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
              />
            )}
            </div>
          </div>

          <div>

            <label className="text-xs font-bold uppercase text-muted-foreground">Looking for (optional)</label>
            <input maxLength={500} value={form.looking_for} onChange={(e) => setForm({ ...form, looking_for: e.target.value })} placeholder="e.g. Wireless headphones, board games…" className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>
          {!form.item_id && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-primary/20 bg-primary-soft/30 p-4">
              <input
                type="checkbox"
                checked={saveAsItem}
                onChange={(e) => setSaveAsItem(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-bold">Save this as one of my items</span>
                <span className="mt-1 block text-xs text-muted-foreground">You can offer it in future swaps.</span>
              </span>
            </label>
          )}
          <button disabled={mut.isPending || uploading || form.image_urls.length === 0} className="w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50">
            {mut.isPending ? "Publishing…" : "Publish listing"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
