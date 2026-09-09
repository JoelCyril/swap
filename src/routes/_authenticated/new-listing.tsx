import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ImageCropper } from "@/components/ImageCropper";
import { createListing } from "@/lib/listings.functions";
import { uploadFileTo } from "@/lib/upload";
import { CATEGORIES, CONDITIONS, EMIRATES, NEIGHBOURHOODS, OTHER_LOCATION, type ItemCategory, type ItemCondition } from "@/lib/db-types";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const searchSchema = z.object({ fromItem: z.string().uuid().optional() });
const inputClass = "mt-1 w-full rounded-full border-2 border-primary/20 dark:border-border/80 bg-white dark:bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition";
const labelClass = "text-xs font-bold uppercase text-muted-foreground";

export const Route = createFileRoute("/_authenticated/new-listing")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "List an Item — SWAP" }, { name: "description", content: "Post something to trade with your neighbours." }] }),
  component: NewListingPage,
});

function NewListingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useServerFn(createListing);
  const [form, setForm] = useState({ title: "", description: "", category: "" as ItemCategory | "", condition: "" as ItemCondition | "", looking_for: "", emirate: "", image_urls: [] as string[], image_emoji: "📦" });
  const [locationChoice, setLocationChoice] = useState("");
  const [otherLocation, setOtherLocation] = useState("");
  const [queue, setQueue] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      const location = locationChoice === OTHER_LOCATION ? otherLocation.trim() : locationChoice;
      if (!form.title.trim()) throw new Error("Please enter a title");
      if (!form.category || !form.condition) throw new Error("Please select a category and condition");
      if (!form.emirate || !location) throw new Error("Please select your emirate and neighbourhood");
      if (!form.image_urls.length) throw new Error("Please add at least one photo");
      return create({ data: { ...form, title: form.title.trim(), location, emirate: form.emirate as any, category: form.category as ItemCategory, condition: form.condition as ItemCondition } });
    },
    onSuccess: (listing: any) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-inventory-listings"] });
      if (listing.withheld) {
        toast.warning("Your listing was sent for review", { description: "Please wait for moderator approval." });
        navigate({ to: "/my-listings" });
      } else {
        toast.success("Your item is now live on the marketplace!");
        navigate({ to: "/listings/$id", params: { id: listing.id } });
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create listing"),
  });

  function pickFiles(files: FileList | null) {
    if (!files) return;
    const room = 8 - form.image_urls.length;
    const valid = Array.from(files).slice(0, Math.max(room, 0)).filter((file) => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10 MB`); return false; }
      return true;
    });
    setQueue((current) => [...current, ...valid]);
  }

  async function uploadCropped(file: File) {
    setUploading(true);
    try {
      const url = await uploadFileTo("listing-images", file);
      setForm((current) => ({ ...current, image_urls: [...current.image_urls, url] }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed");
    } finally { setUploading(false); }
  }

  return <div className="flex min-h-screen flex-col bg-background">
    {queue.length > 0 && <ImageCropper key={`${queue[0].name}-${queue.length}`} file={queue[0]} aspect={4 / 3} title="Crop listing photo" onCancel={() => setQueue((current) => current.slice(1))} onDone={async (file) => { setQueue((current) => current.slice(1)); await uploadCropped(file); }} />}
    <Navbar />
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black sm:text-4xl">List an item directly</h1>
      <p className="mt-2 text-sm text-muted-foreground">This will appear in the marketplace without being saved to your inventory.</p>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="mt-7 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6">
        <Field label="Title *"><input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sony WH-1000XM4 headphones" className={inputClass} /></Field>
        <Field label="Description"><textarea rows={4} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Include useful details and any wear." className={`${inputClass} resize-none`} /></Field>
        <div><span className={labelClass}>Photos * (up to 8)</span><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {form.image_urls.map((url, index) => <div key={url} className="relative aspect-square overflow-hidden rounded-xl border-2 border-primary/20"><img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => setForm((current) => ({ ...current, image_urls: current.image_urls.filter((item) => item !== url) }))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white" aria-label="Remove photo"><X className="h-3 w-3" /></button></div>)}
          {form.image_urls.length < 8 && <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/40 text-xs font-bold text-primary hover:bg-primary/5"><Plus className="h-5 w-5" /><span>{uploading ? "Uploading…" : "Add photo"}</span><input type="file" accept="image/*" multiple hidden onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} /></label>}
        </div></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Category *"><select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })} className={inputClass}><option value="" disabled>Select category</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Condition *"><select required value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as ItemCondition })} className={inputClass}><option value="" disabled>Select condition</option>{CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}</select></Field></div>
        <div><div className="mb-1.5"><span className={labelClass}>Location *</span></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Emirate *"><select required value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })} className={inputClass}><option value="" disabled>Select emirate</option>{EMIRATES.map((emirate) => <option key={emirate}>{emirate}</option>)}</select></Field><Field label="Neighbourhood *"><select required value={locationChoice} onChange={(e) => setLocationChoice(e.target.value)} className={inputClass}><option value="" disabled>Select neighbourhood</option>{NEIGHBOURHOODS.map((neighbourhood) => <option key={neighbourhood}>{neighbourhood}</option>)}<option value={OTHER_LOCATION}>Other (type your own)</option></select>{locationChoice === OTHER_LOCATION && <input required maxLength={120} value={otherLocation} onChange={(e) => setOtherLocation(e.target.value)} placeholder="Enter your neighbourhood" className={`${inputClass} mt-2`} />}</Field></div></div>
        <Field label="Looking for (optional)"><input maxLength={500} value={form.looking_for} onChange={(e) => setForm({ ...form, looking_for: e.target.value })} placeholder="e.g. iPad mini, a mechanical keyboard, or open to offers" className={inputClass} /></Field>
        <button disabled={mutation.isPending || uploading || queue.length > 0} className="w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50">{mutation.isPending ? "Publishing…" : "Publish listing"}</button>
      </form>
    </main>
    <Footer />
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>;
}
