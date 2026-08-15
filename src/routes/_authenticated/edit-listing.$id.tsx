import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getMyListing, updateListing } from "@/lib/listings.functions";
import { uploadFileTo } from "@/lib/upload";
import { ImageCropper } from "@/components/ImageCropper";
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

export const Route = createFileRoute("/_authenticated/edit-listing/$id")({
  head: () => ({
    meta: [
      { title: "Edit listing — SWAP" },
      { name: "description", content: "Update the details and photos of your swap listing." },
      { property: "og:title", content: "Edit listing — SWAP" },
      { property: "og:description", content: "Update the details and photos of your swap listing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditListingPage,
});

function EditListingPage() {
  const { id } = useParams({ from: "/_authenticated/edit-listing/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getFn = useServerFn(getMyListing);
  const update = useServerFn(updateListing);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["my-listing", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Electronics" as ItemCategory,
    condition: "Good" as ItemCondition,
    image_emoji: "📦",
    looking_for: "",
    emirate: "" as string,
    image_urls: [] as string[],
  });
  const [locationChoice, setLocationChoice] = useState<string>(NEIGHBOURHOODS[0]);
  const [otherLocation, setOtherLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title,
      description: listing.description ?? "",
      category: listing.category as ItemCategory,
      condition: listing.condition as ItemCondition,
      image_emoji: listing.image_emoji,
      looking_for: listing.looking_for ?? "",
      emirate: listing.emirate ?? "",
      image_urls: listing.image_urls ?? [],
    });
    const known = (NEIGHBOURHOODS as readonly string[]).includes(listing.location);
    setLocationChoice(known ? listing.location : OTHER_LOCATION);
    if (!known) setOtherLocation(listing.location);
  }, [listing]);

  const mut = useMutation({
    mutationFn: () => {
      const location = locationChoice === OTHER_LOCATION ? otherLocation.trim() : locationChoice;
      if (!location) throw new Error("Please enter a location");
      if (form.image_urls.length === 0) throw new Error("Please keep at least one photo");
      return update({ data: { id, ...form, location } });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      if (res?.withheld) {
        toast.warning("Your edit was flagged for review", {
          description: "Please wait until a moderator approves your listing.",
          duration: 8000,
        });
      } else {
        toast.success("Listing successfully updated");
      }
      navigate({ to: "/listings/$id", params: { id } });
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
        <h1 className="font-display text-4xl font-black">Edit listing</h1>
        <p className="mt-2 text-muted-foreground">Update your listing details or photos.</p>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : !listing ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-10 text-center text-muted-foreground">
            This listing doesn't exist or isn't yours.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
            className="mt-8 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card"
          >
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
              <textarea
                rows={4}
                maxLength={2000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Photos (up to 8)</label>
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
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })}
                  className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as ItemCondition })}
                  className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
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
                {NEIGHBOURHOODS.map((n) => (
                  <option key={n}>{n}</option>
                ))}
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
              <input
                maxLength={500}
                value={form.looking_for}
                onChange={(e) => setForm({ ...form, looking_for: e.target.value })}
                className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              disabled={mut.isPending || uploading}
              className="w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {mut.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
