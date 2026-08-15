import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyListings, deleteListing } from "@/lib/listings.functions";
import { gradientForId, timeAgo } from "@/lib/db-types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({
    meta: [
      { title: "My listings — SWAP" },
      { name: "description", content: "Manage the items you have posted for swapping." },
      { property: "og:title", content: "My listings — SWAP" },
      { property: "og:description", content: "Manage the items you have posted for swapping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyListingsPage,
});

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  removed: "bg-gray-100 text-gray-700",
};

function MyListingsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listMyListings);
  const del = useServerFn(deleteListing);
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["favourites"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete listing"),
  });
  const { data: listings, isLoading } = useQuery({ queryKey: ["my-listings"], queryFn: () => fn() });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-black sm:text-4xl">My listings</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              All your listings which are up and running.
            </p>
          </div>
          <Link
            to="/new-listing"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow sm:px-5 sm:text-xs"
          >
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : !listings || listings.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-6 text-center sm:p-10">
            <p className="text-muted-foreground">You haven't posted anything yet.</p>
            <Link to="/new-listing" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
              Create your first listing →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {listings.map((l: any) => (
              <div
                key={l.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border-2 border-primary/20 bg-card p-3 transition hover:border-primary hover:shadow-card sm:flex sm:items-center sm:gap-4 sm:p-4"
              >
                <Link
                  to="/listings/$id"
                  params={{ id: l.id }}
                  className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradientForId(l.id)} text-2xl sm:h-16 sm:w-16 sm:text-3xl`}
                >
                  {l.image_urls?.[0] ? (
                    <img src={l.image_urls[0]} alt={l.title} className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{l.image_emoji}</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/listings/$id"
                    params={{ id: l.id }}
                    className="block truncate font-display text-base font-bold hover:text-primary sm:text-lg"
                  >
                    {l.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.category} · {l.location} · {timeAgo(l.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[l.status] ?? "bg-muted"}`}
                    >
                      {l.status}
                    </span>
                    <Link
                      to="/edit-listing/$id"
                      params={{ id: l.id }}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-primary/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${l.title}"? This can't be undone.`)) delMut.mutate(l.id);
                      }}
                      disabled={delMut.isPending}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
                <span
                  className={`hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-block ${STATUS_COLORS[l.status] ?? "bg-muted"}`}
                >
                  {l.status}
                </span>
                <Link
                  to="/edit-listing/$id"
                  params={{ id: l.id }}
                  className="hidden shrink-0 items-center gap-1 rounded-full border-2 border-primary/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft sm:inline-flex"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${l.title}"? This can't be undone.`)) delMut.mutate(l.id);
                  }}
                  disabled={delMut.isPending}
                  className="hidden shrink-0 items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:opacity-50 sm:inline-flex"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
