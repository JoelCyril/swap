import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getWantedRequest, createWantedRequest, editWantedRequest } from "@/lib/wanted.functions";
import { CATEGORIES, EMIRATES, NEIGHBOURHOODS, OTHER_LOCATION, type ItemCategory } from "@/lib/db-types";
import { supabase, getStoredSessionSync } from "@/integrations/supabase/client";
import { LocationPickerControls } from "@/components/common/LocationPickerControls";
import { ArrowLeft, Megaphone, Pencil, Sparkles, MapPin, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wanted/post")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Post or Edit Wanted Request — SWAP UAE" },
      { name: "description", content: "Tell the UAE community what item you are looking for." },
    ],
  }),
  component: WantedPostPage,
});

function WantedPostPage() {
  const { edit: editId } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getRequestFn = useServerFn(getWantedRequest);
  const createFn = useServerFn(createWantedRequest);
  const editFn = useServerFn(editWantedRequest);

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

  const isEditing = Boolean(editId);

  // Fetch request if editing
  const { data: requestData, isLoading: isRequestLoading } = useQuery({
    queryKey: ["wanted-request-detail", editId],
    queryFn: () => (editId ? getRequestFn({ data: { id: editId } }) : null),
    enabled: Boolean(editId),
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [offeringDescription, setOfferingDescription] = useState("");
  const [emirate, setEmirate] = useState<string>("");
  const [locationChoice, setLocationChoice] = useState<string>("");
  const [otherLocation, setOtherLocation] = useState("");

  // Sync state when requestData arrives
  useEffect(() => {
    if (requestData) {
      setTitle(requestData.title || "");
      setCategory(requestData.category || "");
      setOfferingDescription(requestData.offering_description || "");
      setEmirate(requestData.emirate || "");
      if (NEIGHBOURHOODS.includes(requestData.location)) {
        setLocationChoice(requestData.location);
        setOtherLocation("");
      } else if (requestData.location) {
        setLocationChoice(OTHER_LOCATION);
        setOtherLocation(requestData.location);
      }
    }
  }, [requestData]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!signedIn) {
        navigate({ to: "/auth" });
        throw new Error("Please sign in first");
      }

      const effectiveLocation = locationChoice === OTHER_LOCATION ? otherLocation.trim() : locationChoice;
      if (!title.trim()) throw new Error("Please enter what you are looking for");
      if (!category) throw new Error("Please select a category");
      if (!emirate) throw new Error("Please select an Emirate");
      if (!effectiveLocation) throw new Error("Please select or enter your Area / Neighbourhood");
      if (!offeringDescription.trim()) throw new Error("Please describe what you are willing to swap in return");

      if (isEditing && editId) {
        return await editFn({
          data: {
            id: editId,
            title: title.trim(),
            category: category as ItemCategory,
            offering_description: offeringDescription.trim(),
            emirate,
            location: effectiveLocation,
          },
        });
      } else {
        return await createFn({
          data: {
            title: title.trim(),
            category: category as ItemCategory,
            offering_description: offeringDescription.trim(),
            emirate,
            location: effectiveLocation,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Wanted request updated successfully!"
          : "Wanted request posted to the Community Board!",
        {
          description: isEditing
            ? "Your changes have been saved."
            : "Traders who have this item will be able to propose swaps with you directly.",
        },
      );
      qc.invalidateQueries({ queryKey: ["wanted-requests"] });
      qc.invalidateQueries({ queryKey: ["wanted-request-detail", editId] });
      navigate({ to: "/wanted" });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save request");
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {/* Back Link */}
        <Link
          to="/wanted"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Wanted Board
        </Link>

        {isEditing && isRequestLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-semibold">Loading request details…</p>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-primary/25 bg-card p-6 sm:p-8 shadow-card-hover">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                {isEditing ? <Pencil className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
              </span>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">
                  {isEditing ? "Edit Wanted Request" : "Post a Wanted Request (ISO)"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isEditing
                    ? "Update what you are looking for and what you offer in return"
                    : "Tell the UAE barter community what you're looking for so neighbours can propose swaps."}
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate();
              }}
              className="mt-6 space-y-5"
            >
              {/* Item Title */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What item are you looking for? *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. PlayStation 5 Console, iPad Air, or Acoustic Guitar"
                  className="mt-1.5 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-primary transition"
                />
              </div>

              {/* Category & Emirate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category *
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-primary transition"
                  >
                    <option value="" disabled>
                      -- Select Category * --
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Emirate *
                  </label>
                  <select
                    required
                    value={emirate}
                    onChange={(e) => setEmirate(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-primary transition"
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
              </div>

              {/* Neighbourhood & Location Header */}
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Area / Neighbourhood *
                  </label>
                  <LocationPickerControls
                    onLocationSelected={({ emirate: detEmirate, location: detLocation, isKnownNeighbourhood }) => {
                      setEmirate(detEmirate);
                      if (isKnownNeighbourhood) {
                        setLocationChoice(detLocation);
                        setOtherLocation("");
                      } else {
                        setLocationChoice(OTHER_LOCATION);
                        setOtherLocation(detLocation);
                      }
                    }}
                    currentEmirate={emirate || "Dubai"}
                    currentLocation={locationChoice || ""}
                  />
                </div>
                <select
                  required
                  value={locationChoice}
                  onChange={(e) => setLocationChoice(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-primary transition"
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

                {locationChoice === OTHER_LOCATION && (
                  <input
                    required
                    maxLength={100}
                    placeholder="Enter your area (e.g. Al Barsha, JVC, Corniche)"
                    value={otherLocation}
                    onChange={(e) => setOtherLocation(e.target.value)}
                    className="mt-2.5 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-primary"
                  />
                )}
              </div>

              {/* Offering Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What are you offering to swap in return? *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={offeringDescription}
                  onChange={(e) => setOfferingDescription(e.target.value)}
                  placeholder="e.g. Willing to trade my Apple Watch Ultra (Like New), Sony WH-1000XM4 Headphones, or check my inventory items for options."
                  className="mt-1.5 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary resize-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <Link
                  to="/wanted"
                  className="flex-1 text-center rounded-full border-2 border-border py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={
                    saveMut.isPending ||
                    !title.trim() ||
                    !category ||
                    !emirate ||
                    !locationChoice ||
                    (locationChoice === OTHER_LOCATION && !otherLocation.trim()) ||
                    !offeringDescription.trim()
                  }
                  className="flex-[2] inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98]"
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
        )}
      </main>

      <Footer />
    </div>
  );
}
