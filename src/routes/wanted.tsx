import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listWantedRequests, deleteWantedRequest } from "@/lib/wanted.functions";
import { WantedCard } from "@/components/wanted/WantedCard";
import { FulfillWantedModal } from "@/components/wanted/FulfillWantedModal";
import { type WantedRequestItem } from "@/lib/wanted.server";
import { supabase, getStoredSessionSync } from "@/integrations/supabase/client";
import { CATEGORIES, EMIRATES, type ItemCategory } from "@/lib/db-types";
import { Megaphone, Plus, Search, Filter, Sparkles, MapPin, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wanted")({
  head: () => ({
    meta: [
      { title: "Wanted Board (ISO) — SWAP UAE" },
      {
        name: "description",
        content: "Discover what UAE neighbours are looking to trade. See wanted requests and propose swaps directly.",
      },
      { property: "og:title", content: "Wanted Board (ISO) — SWAP UAE" },
      { property: "og:description", content: "In Search Of (ISO) barter requests across Dubai, Abu Dhabi, and the UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WantedBoardPage,
});

function WantedBoardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listWantedRequests);
  const deleteFn = useServerFn(deleteWantedRequest);

  const [userId, setUserId] = useState<string | null>(() => getStoredSessionSync()?.user?.id ?? null);
  const [signedIn, setSignedIn] = useState<boolean>(() => Boolean(getStoredSessionSync()?.user?.id));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setSignedIn(Boolean(data.session?.user?.id));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setSignedIn(Boolean(session?.user?.id));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const [selectedEmirate, setSelectedEmirate] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const [activeFulfillRequest, setActiveFulfillRequest] = useState<WantedRequestItem | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["wanted-requests", selectedEmirate, selectedCategory, search],
    queryFn: () =>
      listFn({
        data: {
          emirate: selectedEmirate === "All" ? undefined : selectedEmirate,
          category: selectedCategory === "All" ? undefined : selectedCategory,
          search: search.trim() || undefined,
        },
      }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return await deleteFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Wanted request removed");
      qc.invalidateQueries({ queryKey: ["wanted-requests"] });
    },
    onError: () => toast.error("Could not remove request"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {/* Top Header Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Megaphone className="h-5 w-5" />
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                Wanted Board (ISO)
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              See what UAE barter members are in search of and trade items directly from your inventory.
            </p>
          </div>

          <Link
            to="/wanted/post"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4" /> Post Wanted Request
          </Link>
        </div>

        {/* Filters & Search Row */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Emirate filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedEmirate("All")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                selectedEmirate === "All"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              All Emirates
            </button>
            {EMIRATES.map((em) => (
              <button
                key={em}
                onClick={() => setSelectedEmirate(em)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedEmirate === em
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Search Box & Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-full border-2 border-primary/20 bg-card px-3 py-1.5 text-xs font-bold outline-none focus:border-primary shrink-0"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wanted items…"
                className="w-full rounded-full border-2 border-primary/20 bg-card py-1.5 pl-8 pr-7 text-xs outline-none focus:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        {isLoading ? (
          <div className="mt-12 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-semibold">Loading wanted requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-8 text-center sm:p-14">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 text-primary">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold">
              {search ? `No wanted requests match "${search}"` : "No requests found in this filter"}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
              Be the first to post what you're looking for and let other UAE traders find you!
            </p>
            <Link
              to="/wanted/post"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
            >
              <Plus className="h-4 w-4" /> Post a Request
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((r) => (
              <WantedCard
                key={r.id}
                request={r}
                myId={userId}
                onFulfill={(req) => {
                  if (!signedIn) {
                    navigate({ to: "/auth" });
                    return;
                  }
                  setActiveFulfillRequest(req);
                }}
                onDelete={(id) => deleteMut.mutate(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <FulfillWantedModal
        request={activeFulfillRequest}
        onClose={() => setActiveFulfillRequest(null)}
        signedIn={signedIn}
      />

      <Footer />
    </div>
  );
}
