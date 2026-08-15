import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyItems, createItem, deleteItem, updateItem, listMyListedItemIds, listMySwappedItemIds } from "@/lib/items.functions";
import { CATEGORIES, CONDITIONS, type ItemCategory, type ItemCondition } from "@/lib/db-types";
import { uploadFileTo } from "@/lib/upload";
import { ImageCropper } from "@/components/ImageCropper";
import { Plus, Eye, EyeOff, Trash2, X, ArrowRightLeft, Pencil, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/your-items")({
  head: () => ({
    meta: [
      { title: "Your items — SWAP" },
      { name: "description", content: "Manage your inventory: add, edit, or hide items available to swap." },
      { property: "og:title", content: "Your items — SWAP" },
      { property: "og:description", content: "Manage your SWAP inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: YourItemsPage,
});

const EMPTY = {
  name: "",
  category: "Electronics" as ItemCategory,
  condition: "Good" as ItemCondition,
  image_emoji: "📦",
  description: "",
  visibility: "public" as "public" | "private",
  image_urls: [] as string[],
};

function YourItemsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listMyItems);
  const create = useServerFn(createItem);
  const del = useServerFn(deleteItem);
  const upd = useServerFn(updateItem);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [search, setSearch] = useState("");

  const { data: items } = useQuery({ queryKey: ["my-items"], queryFn: () => fn() });
  const listedFn = useServerFn(listMyListedItemIds);
  const { data: listedIds } = useQuery({ queryKey: ["my-listed-item-ids"], queryFn: () => listedFn() });
  const listed = new Set(listedIds ?? []);
  const swappedFn = useServerFn(listMySwappedItemIds);
  const { data: swappedIds } = useQuery({ queryKey: ["my-swapped-item-ids"], queryFn: () => swappedFn() });
  const swapped = new Set(swappedIds ?? []);

  const q = search.trim().toLowerCase();
  const visibleItems = (items ?? []).filter(
    (i) =>
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.condition.toLowerCase().includes(q) ||
      (i.description ?? "").toLowerCase().includes(q),
  );

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setOpen(true);
  }

  function openEdit(item: any) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      condition: item.condition,
      image_emoji: item.image_emoji,
      description: item.description ?? "",
      visibility: item.visibility,
      image_urls: item.image_urls ?? [],
    });
    setOpen(true);
  }

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

  const saveMut = useMutation<unknown>({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Please add a name");
      if (form.image_urls.length === 0) throw new Error("Please add at least one photo");
      return editingId ? await upd({ data: { id: editingId, ...form } }) : await create({ data: form });
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-items"] });
      setOpen(false);
      setForm({ ...EMPTY });
      toast.success(editingId ? "Item updated" : "Item added");
      setEditingId(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-items"] }),
  });

  const toggleVis = useMutation({
    mutationFn: (i: { id: string; visibility: "public" | "private" }) =>
      upd({ data: { id: i.id, visibility: i.visibility } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-items"] }),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {queue.length > 0 && (
        <ImageCropper
          key={queue[0].name + queue.length}
          file={queue[0]}
          aspect={1}
          title="Crop item photo"
          onCancel={() => setQueue((q) => q.slice(1))}
          onDone={async (f) => {
            setQueue((q) => q.slice(1));
            await uploadCropped(f);
          }}
        />
      )}
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-black">Your inventory</h1>
            <p className="mt-2 text-muted-foreground">Items you own — list any of them directly to the browse page.</p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your items…"
            aria-label="Search your items"
            className="w-full rounded-full border-2 border-primary/25 bg-card py-3 pl-11 pr-10 text-sm outline-none transition focus:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-card"
            >
              <Link
                to="/items/$id"
                params={{ id: item.id }}
                className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft to-white text-7xl"
              >
                {item.image_urls && item.image_urls.length > 0 ? (
                  <img
                    src={item.image_urls[0]}
                    alt={item.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden>{item.image_emoji}</span>
                )}
              </Link>
              <div className="mt-4 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to="/items/$id"
                    params={{ id: item.id }}
                    className="font-display text-lg font-bold truncate hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() =>
                      toggleVis.mutate({ id: item.id, visibility: item.visibility === "public" ? "private" : "public" })
                    }
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.visibility === "public" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.visibility === "public" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {item.visibility}
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>{item.condition}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {swapped.has(item.id) ? (
                  <span className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-soft py-2 text-xs font-black uppercase text-primary">
                    Item swapped
                  </span>
                ) : listed.has(item.id) ? (
                  <span className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-muted py-2 text-xs font-black uppercase text-muted-foreground">
                    Already listed
                  </span>
                ) : (
                  <Link
                    to="/new-listing"
                    search={{ fromItem: item.id }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2 text-xs font-black uppercase text-primary-foreground shadow-md hover:shadow-glow transition"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> List this
                  </Link>
                )}

                <button
                  onClick={() => openEdit(item)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-primary/30 px-3 py-2 text-xs font-bold uppercase text-primary hover:bg-primary-soft transition"
                  aria-label="Edit item"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this item?")) delMut.mutate(item.id);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-destructive/30 px-3 py-2 text-xs font-bold uppercase text-destructive hover:bg-destructive/10 transition"
                  aria-label="Delete item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
          {items && items.length > 0 && visibleItems.length === 0 && (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">
              No items match “{search}”.
            </div>
          )}
          {items?.length === 0 && (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">
              No items yet — add your first!
            </div>
          )}
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-card-hover border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black">{editingId ? "Edit item" : "New item"}</h2>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-primary-soft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={120}
                  className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                />
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
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Photos (required, up to 8)</label>
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {form.image_urls.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-xl border-2 border-primary/20"
                    >
                      <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image_urls: f.image_urls.filter((u) => u !== url) }))}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.image_urls.length < 8 && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/30 text-xs font-bold text-primary hover:bg-primary-soft">
                      {uploading ? "…" : <Plus className="h-5 w-5" />}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          onPickFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as "public" | "private" })}
                  className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
                >
                  <option value="public">Public — visible on your profile</option>
                  <option value="private">Private — only you</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  maxLength={1000}
                  className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary resize-none"
                />
              </div>
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending || !form.name || form.image_urls.length === 0 || uploading}
                className="w-full rounded-full bg-gradient-primary py-2.5 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {editingId ? "Save changes" : "Add item"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
