import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  listMyInventoryWithListings,
  createItem,
  updateItem,
  deleteItem,
  quickListInventoryItem,
  unlistInventoryItem,
} from "@/lib/items.functions";
import { deleteListing } from "@/lib/listings.functions";
import { autoFillItemFromPhoto } from "@/lib/ai.functions";
import { fetchBulkListingViews } from "@/lib/views.functions";
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
import { ImageCropper } from "@/components/ImageCropper";
import { LocationPickerControls } from "@/components/common/LocationPickerControls";
import {
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Camera,
  MapPin,
  Sparkles,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-listings")({
  validateSearch: (search: Record<string, unknown>): { add?: boolean } => ({
    add: search.add === true || search.add === "true" || search.add === "1" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Inventory & Listings — SWAP" },
      { name: "description", content: "Gallery of all your items. Easily manage and list your inventory on SWAP." },
      { property: "og:title", content: "My Inventory & Listings — SWAP" },
      { property: "og:description", content: "Manage and list items from your inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyInventoryPage,
});

const EMPTY_ITEM = {
  name: "",
  category: "" as unknown as ItemCategory,
  condition: "" as unknown as ItemCondition,
  image_emoji: "📦",
  description: "",
  visibility: "public" as "public" | "private",
  image_urls: [] as string[],
};

type FilterTab = "all" | "listed" | "unlisted" | "in_trade";

function MyInventoryPage() {
  const { add } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getInventory = useServerFn(listMyInventoryWithListings);
  const createItemFn = useServerFn(createItem);
  const updateItemFn = useServerFn(updateItem);
  const deleteItemFn = useServerFn(deleteItem);
  const quickListFn = useServerFn(quickListInventoryItem);
  const unlistFn = useServerFn(unlistInventoryItem);
  const deleteListingFn = useServerFn(deleteListing);
  const autoFillFn = useServerFn(autoFillItemFromPhoto);

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState<boolean>(() => Boolean(add));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [form, setForm] = useState({ ...EMPTY_ITEM });

  // Quick List Dialog state for customizing "Looking for" and location
  const [quickListModalItem, setQuickListModalItem] = useState<any | null>(null);
  const [lookingForText, setLookingForText] = useState("");
  const [quickListEmirate, setQuickListEmirate] = useState<string>("");
  const [quickListLocationChoice, setQuickListLocationChoice] = useState<string>("");
  const [quickListOtherLocation, setQuickListOtherLocation] = useState<string>("");
  const getViewsFn = useServerFn(fetchBulkListingViews);

  const { data, isLoading } = useQuery({
    queryKey: ["my-inventory-listings"],
    queryFn: () => getInventory(),
  });

  const items = data?.items ?? [];
  const standaloneListings = data?.standaloneListings ?? [];

  const allListingIds = [
    ...items.map((i) => i.listing?.id).filter(Boolean),
    ...standaloneListings.map((l: any) => l.id).filter(Boolean),
  ] as string[];

  const { data: viewsMap } = useQuery({
    queryKey: ["my-listings-views", allListingIds],
    queryFn: () => getViewsFn({ data: { listingIds: allListingIds } }),
    enabled: allListingIds.length > 0,
  });

  // Counts
  const totalItems = items.length + standaloneListings.length;
  const listedCount =
    items.filter((i) => i.is_listed && i.listing_status === "active").length +
    standaloneListings.filter((l: any) => l.status === "active").length;
  const inTradeCount =
    items.filter((i) => i.listing_status === "reserved" || i.listing_status === "completed").length +
    standaloneListings.filter((l: any) => l.status === "reserved" || l.status === "completed").length;
  const unlistedCount = items.filter((i) => !i.is_listed).length;

  // Filter items
  const q = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.condition.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (filterTab === "listed") return item.is_listed && item.listing_status === "active";
    if (filterTab === "unlisted") return !item.is_listed;
    if (filterTab === "in_trade") return item.listing_status === "reserved" || item.listing_status === "completed";
    return true;
  });

  // Standalone listings filter
  const filteredStandalone = standaloneListings.filter((l: any) => {
    const matchSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.condition.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterTab === "unlisted") return false;
    if (filterTab === "listed") return l.status === "active";
    if (filterTab === "in_trade") return l.status === "reserved" || l.status === "completed";
    return true;
  });

  // Mutations
  const saveMut = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Please enter a name for the item");
      if (["item", "new item", "none", "test", "n/a"].includes(name.toLowerCase())) {
        throw new Error("Please provide a specific item name (not just 'item')");
      }
      if (!form.category) throw new Error("Please select a category");
      if (!form.condition) throw new Error("Please select the item condition");
      if (form.image_urls.length === 0) throw new Error("Please add at least one photo");
      return editingId
        ? await updateItemFn({ data: { id: editingId, ...form } })
        : await createItemFn({ data: form });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-inventory-listings"] });
      qc.invalidateQueries({ queryKey: ["my-items"] });
      setOpenModal(false);
      setForm({ ...EMPTY_ITEM });
      toast.success(editingId ? "Item updated successfully" : "Item added to your inventory!");
      setEditingId(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save item"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteItemFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-inventory-listings"] });
      qc.invalidateQueries({ queryKey: ["my-items"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Item removed from inventory");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete item"),
  });

  const quickListMut = useMutation({
    mutationFn: (vars: { itemId: string; lookingFor?: string; emirate: string; location: string }) =>
      quickListFn({
        data: {
          itemId: vars.itemId,
          looking_for: vars.lookingFor,
          emirate: vars.emirate as any,
          location: vars.location,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-inventory-listings"] });
      qc.invalidateQueries({ queryKey: ["my-items"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      setQuickListModalItem(null);
      setLookingForText("");
      setQuickListEmirate("");
      setQuickListLocationChoice("");
      setQuickListOtherLocation("");
      toast.success("Item is now live on the marketplace!", {
        description: "Neighbours can now see and make swap offers on this item.",
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to list item"),
  });

  const unlistMut = useMutation({
    mutationFn: (itemId: string) => unlistFn({ data: { itemId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-inventory-listings"] });
      qc.invalidateQueries({ queryKey: ["my-items"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing removed from marketplace", {
        description: "The item is still saved in your inventory.",
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to unlist item"),
  });

  const deleteStandaloneMut = useMutation({
    mutationFn: (id: string) => deleteListingFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-inventory-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing deleted");
    },
  });

  function openNewModal() {
    setEditingId(null);
    setForm({ ...EMPTY_ITEM });
    setOpenModal(true);
  }

  function openEditModal(item: any) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      condition: item.condition,
      image_emoji: item.image_emoji ?? "📦",
      description: item.description ?? "",
      visibility: item.visibility ?? "public",
      image_urls: item.image_urls ?? [],
    });
    setOpenModal(true);
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

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-4 py-5 sm:px-6 sm:py-10">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </span>
              <h1 className="font-display text-2xl font-black sm:text-3xl text-foreground">
                My Inventory
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage your personal items and list them on the marketplace with a single click.
            </p>
          </div>

          <button
            onClick={openNewModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          {/* Horizontally scrollable tabs on phone */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterTab("all")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                filterTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              All ({totalItems})
            </button>
            <button
              onClick={() => setFilterTab("listed")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === "listed"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Listed ({listedCount})
            </button>
            <button
              onClick={() => setFilterTab("unlisted")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === "unlisted"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              In Inventory ({unlistedCount})
            </button>
            {inTradeCount > 0 && (
              <button
                onClick={() => setFilterTab("in_trade")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  filterTab === "in_trade"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                In Trade ({inTradeCount})
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your inventory…"
              className="w-full rounded-full border-2 border-primary/20 bg-card py-2 pl-9 pr-8 text-xs outline-none transition focus:border-primary"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="mt-12 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-semibold">Loading your inventory…</p>
          </div>
        ) : filteredItems.length === 0 && filteredStandalone.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-8 text-center sm:p-14">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 text-primary">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold">
              {search ? `No items match "${search}"` : "Your inventory is empty"}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? "Try searching for a different keyword or reset your filter tabs."
                : "Add the items you own to start building your personal trading inventory."}
            </p>
            {!search && (
              <button
                onClick={openNewModal}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
              >
                <Plus className="h-4 w-4" /> Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => {
              const isListed = item.is_listed && item.listing_status === "active";
              const isReserved = item.listing_status === "reserved";
              const isCompleted = item.listing_status === "completed";
              const isWithheld = item.listing_status === "withheld";
              const isUnlisted = !item.is_listed || item.listing_status === "not_listed";

              const cardBorder = isListed
                ? "border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : isReserved
                ? "border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30"
                : isCompleted
                ? "border-purple-500/50 shadow-purple-500/10"
                : "border-primary/20 hover:border-primary/50";

              const targetUrl = item.listing?.id ? `/listings/${item.listing.id}` : `/items/${item.id}`;

              return (
                <article
                  key={item.id}
                  onClick={() => navigate({ to: targetUrl })}
                  className={`group relative flex flex-col rounded-3xl border-2 bg-card p-3.5 sm:p-4 shadow-card transition-all hover:shadow-card-hover cursor-pointer hover:border-primary/60 ${cardBorder}`}
                >
                  {/* Photo Display */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary-soft/40">
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img
                        src={item.image_urls[0]}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <Package className="h-12 w-12 text-primary/40" />
                      </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      {isListed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          <CheckCircle2 className="h-3 w-3" /> Listed Live
                        </span>
                      )}
                      {isReserved && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          <Clock className="h-3 w-3" /> In Trade
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          <CheckCircle2 className="h-3 w-3" /> Swapped
                        </span>
                      )}
                      {isWithheld && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          Review Needed
                        </span>
                      )}
                      {isUnlisted && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-100 shadow-sm">
                          In Inventory
                        </span>
                      )}

                      {/* Photo Count badge */}
                      {item.image_urls && item.image_urls.length > 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                          <Camera className="h-2.5 w-2.5" />
                          {item.image_urls.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="mt-3 flex flex-1 flex-col">
                    <h3 className="font-display text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-foreground/80">{item.category}</span>
                      <span>•</span>
                      <span>{item.condition}</span>
                      <span>•</span>
                      <span className="capitalize">{item.visibility}</span>
                    </div>

                    {item.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}

                    {/* Listing details if active */}
                    {item.listing && (
                      <div className="mt-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate flex items-center gap-1">
                            <ArrowRightLeft className="h-3 w-3 shrink-0" />
                            Looking for: {item.listing.looking_for || "Open to offers"}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 shrink-0">
                            <Eye className="h-3 w-3" /> {(viewsMap ?? {})[item.listing.id] || 0}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {item.listing.location}, {item.listing.emirate}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-3.5" onClick={(e) => e.stopPropagation()}>
                      {/* 1-Click List or Unlist Action */}
                      {isUnlisted ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickListModalItem(item);
                            setLookingForText("");
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" /> List on Marketplace
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Unlist "${item.name}" from marketplace? It will stay in your inventory.`)) {
                              unlistMut.mutate(item.id);
                            }
                          }}
                          disabled={unlistMut.isPending}
                          className="w-full inline-flex items-center justify-center gap-1 rounded-full border-2 border-destructive/30 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition"
                        >
                          Unlist from Marketplace
                        </button>
                      )}

                      {/* Edit / Delete actions */}
                      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Options
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(item);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
                            title="Edit Item"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Permanently delete "${item.name}" from your inventory?`)) {
                                delMut.mutate(item.id);
                              }
                            }}
                            disabled={delMut.isPending}
                            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Standalone Listings */}
            {filteredStandalone.map((l: any) => (
              <article
                key={l.id}
                onClick={() => navigate({ to: `/listings/${l.id}` })}
                className="group relative flex flex-col rounded-3xl border-2 border-emerald-500/40 bg-card p-3.5 sm:p-4 shadow-card hover:shadow-card-hover cursor-pointer hover:border-emerald-500 transition"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary-soft/40">
                  {l.image_urls && l.image_urls.length > 0 ? (
                    <img src={l.image_urls[0]} alt={l.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <Package className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-md">
                    <CheckCircle2 className="h-3 w-3" /> Listed
                  </span>
                </div>
                <div className="mt-3 flex flex-1 flex-col">
                  <h3 className="font-display text-base font-bold text-foreground line-clamp-1">{l.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {l.category} · {l.location}
                  </p>
                  <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-border/60" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Options
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete listing "${l.title}"?`)) deleteStandaloneMut.mutate(l.id);
                      }}
                      className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* QUICK LIST DIALOG */}
      {quickListModalItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-card p-5 sm:p-6 shadow-card-hover border-2 border-primary/30 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <ArrowRightLeft className="h-4 w-4" />
                </span>
                <h3 className="font-display text-xl font-black">List on Marketplace</h3>
              </div>
              <button
                onClick={() => setQuickListModalItem(null)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-muted/60 p-3 flex items-center gap-3">
              {quickListModalItem.image_urls?.[0] ? (
                <img
                  src={quickListModalItem.image_urls[0]}
                  alt={quickListModalItem.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{quickListModalItem.name}</p>
                <p className="text-xs text-muted-foreground">
                  {quickListModalItem.category} · {quickListModalItem.condition}
                </p>
              </div>
            </div>

            {/* Emirate & Area Location (Mandatory) */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">Location Details *</span>
                <LocationPickerControls
                  onLocationSelected={({ emirate, location, isKnownNeighbourhood }) => {
                    setQuickListEmirate(emirate);
                    if (isKnownNeighbourhood) {
                      setQuickListLocationChoice(location);
                      setQuickListOtherLocation("");
                    } else {
                      setQuickListLocationChoice(OTHER_LOCATION);
                      setQuickListOtherLocation(location);
                    }
                  }}
                  currentEmirate={quickListEmirate || "Dubai"}
                  currentLocation={quickListLocationChoice || ""}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Emirate *
                </label>
                <select
                  value={quickListEmirate}
                  onChange={(e) => setQuickListEmirate(e.target.value)}
                  className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary font-medium"
                  required
                >
                  <option value="" disabled>
                    -- Select Emirate * --
                  </option>
                  {EMIRATES.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Area / Neighbourhood *
                </label>
                <select
                  value={quickListLocationChoice}
                  onChange={(e) => setQuickListLocationChoice(e.target.value)}
                  className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary font-medium"
                  required
                >
                  <option value="" disabled>
                    -- Select Area / Neighbourhood * --
                  </option>
                  {NEIGHBOURHOODS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value={OTHER_LOCATION}>Other (Type your own)</option>
                </select>

                {quickListLocationChoice === OTHER_LOCATION && (
                  <input
                    required
                    maxLength={100}
                    placeholder="Enter your area (e.g. Al Barsha, JVC, Corniche)"
                    value={quickListOtherLocation}
                    onChange={(e) => setQuickListOtherLocation(e.target.value)}
                    className="mt-2 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  What are you looking to swap for? (Optional)
                </label>
                <textarea
                  value={lookingForText}
                  onChange={(e) => setLookingForText(e.target.value)}
                  placeholder="e.g. Wireless headphones, board games, or open to any offers"
                  rows={2}
                  maxLength={300}
                  className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setQuickListModalItem(null)}
                className="flex-1 rounded-full border-2 border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const effectiveLoc =
                    quickListLocationChoice === OTHER_LOCATION
                      ? quickListOtherLocation.trim()
                      : quickListLocationChoice;
                  if (!quickListEmirate) {
                    toast.error("Please select an Emirate");
                    return;
                  }
                  if (!effectiveLoc) {
                    toast.error("Please select or enter your Area / Neighbourhood");
                    return;
                  }
                  quickListMut.mutate({
                    itemId: quickListModalItem.id,
                    lookingFor: lookingForText.trim() || undefined,
                    emirate: quickListEmirate,
                    location: effectiveLoc,
                  });
                }}
                disabled={
                  quickListMut.isPending ||
                  !quickListEmirate ||
                  !quickListLocationChoice ||
                  (quickListLocationChoice === OTHER_LOCATION && !quickListOtherLocation.trim())
                }
                className="flex-1 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                {quickListMut.isPending ? "Listing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT INVENTORY ITEM MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-5 sm:p-6 shadow-card-hover border-2 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-black">
                  {editingId ? "Edit Item" : "Add to Inventory"}
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Item Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={120}
                  placeholder="e.g. Sony WH-1000XM4 Headphones"
                  className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Category *</label>
                  <select
                    value={form.category || ""}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })}
                    className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary font-medium"
                    required
                  >
                    <option value="" disabled>
                      Select Category *
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Condition *</label>
                  <select
                    value={form.condition || ""}
                    onChange={(e) => setForm({ ...form, condition: e.target.value as ItemCondition })}
                    className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary font-medium"
                    required
                  >
                    <option value="" disabled>
                      Select Condition *
                    </option>
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Photos (up to 8, required)</label>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.image_urls.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-2xl border-2 border-primary/20 shadow-sm"
                    >
                      <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, image_urls: f.image_urls.filter((u) => u !== url) }))
                        }
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-black transition"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.image_urls.length < 8 && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-primary/30 text-xs font-bold text-primary hover:bg-primary/5 transition">
                      {uploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Plus className="h-5 w-5" />
                          <span className="text-[10px]">Add Photo</span>
                        </div>
                      )}
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

                {form.image_urls.length > 0 && (
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={async () => {
                      try {
                        setAiLoading(true);
                        const url = form.image_urls[0];
                        
                        // Ultra fast downsampled client thumbnail
                        let base64Data: string | undefined = undefined;
                        try {
                          base64Data = await new Promise<string | undefined>((resolve) => {
                            const img = new Image();
                            img.crossOrigin = "anonymous";
                            img.onload = () => {
                              try {
                                const maxDim = 512;
                                let w = img.width;
                                let h = img.height;
                                if (w > maxDim || h > maxDim) {
                                  if (w > h) {
                                    h = Math.round((h * maxDim) / w);
                                    w = maxDim;
                                  } else {
                                    w = Math.round((w * maxDim) / h);
                                    h = maxDim;
                                  }
                                }
                                const canvas = document.createElement("canvas");
                                canvas.width = w;
                                canvas.height = h;
                                const ctx = canvas.getContext("2d");
                                if (!ctx) return resolve(undefined);
                                ctx.drawImage(img, 0, 0, w, h);
                                const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
                                resolve(dataUrl.split(",")[1]);
                              } catch {
                                resolve(undefined);
                              }
                            };
                            img.onerror = () => resolve(undefined);
                            img.src = url;
                          });
                        } catch {}

                        const res = await autoFillFn({
                          data: {
                            imageUrl: url,
                            imageBase64: base64Data,
                            mimeType: "image/jpeg",
                          },
                        });

                        if (res) {
                          setForm((f) => ({
                            ...f,
                            name: res.name || f.name,
                            category: res.category || f.category,
                            condition: res.condition || f.condition,
                            description: res.description || f.description,
                          }));
                          toast.success("AI auto-filled item details!", {
                            description: `Detected: ${res.name} (${res.category})`,
                          });
                        }
                      } catch (err) {
                        toast.error("Could not analyze photo, please fill in details manually");
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-primary/30 bg-primary/10 py-2.5 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/20 transition shadow-sm"
                  >
                    {aiLoading ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" /> Analyzing Photo…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> ✨ AI Auto-Fill Details from Photo
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as "public" | "private" })}
                  className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="public">Public — visible in your trade profile</option>
                  <option value="private">Private — only visible to you</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details on accessories, purchase date, condition notes..."
                  rows={2}
                  maxLength={1000}
                  className="mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || !form.name.trim() || form.image_urls.length === 0 || uploading}
                  className="w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saveMut.isPending ? "Saving…" : editingId ? "Save Changes" : "Add to Inventory"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
