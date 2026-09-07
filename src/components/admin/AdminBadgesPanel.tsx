import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListBadges,
  adminCreateBadge,
  adminDeleteBadge,
  adminAwardListingBadge,
  adminRemoveListingBadge,
  adminSearchListingsForBadge,
} from "@/lib/admin.functions";
import { PRESET_GLOW_COLORS, getListingGlowStyle, type ListingCustomBadge } from "@/lib/badges";
import { uploadFileTo } from "@/lib/upload";
import {
  Sparkles,
  Award,
  Upload,
  Trash2,
  Check,
  Search,
  ExternalLink,
  Plus,
  Flame,
  Palette,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

const SAMPLE_ICONS = [
  { name: "Verified Star", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=80" },
  { name: "Gold Trophy", url: "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=100&auto=format&fit=crop&q=80" },
  { name: "Cyber Gem", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80" },
  { name: "Fire Flare", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100&auto=format&fit=crop&q=80" },
];

export function AdminBadgesPanel() {
  const qc = useQueryClient();

  const listBadgesFn = useServerFn(adminListBadges);
  const createBadgeFn = useServerFn(adminCreateBadge);
  const deleteBadgeFn = useServerFn(adminDeleteBadge);
  const awardBadgeFn = useServerFn(adminAwardListingBadge);
  const removeBadgeFn = useServerFn(adminRemoveListingBadge);
  const searchListingsFn = useServerFn(adminSearchListingsForBadge);

  // Form State
  const [badgeName, setBadgeName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hasGlow, setHasGlow] = useState(true);
  const [glowColor, setGlowColor] = useState("#a855f7");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Award state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadgeToAward, setSelectedBadgeToAward] = useState<ListingCustomBadge | null>(null);

  // Queries
  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: () => listBadgesFn(),
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["admin-badge-listings", searchQuery],
    queryFn: () => searchListingsFn({ data: { query: searchQuery } }),
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: () =>
      createBadgeFn({
        data: {
          name: badgeName,
          imageUrl,
          glowColor: hasGlow ? glowColor : null,
        },
      }),
    onSuccess: (newBadge) => {
      toast.success(`Badge "${newBadge.name}" created!`);
      qc.invalidateQueries({ queryKey: ["admin-badges"] });
      setBadgeName("");
      setImageUrl("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create badge");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBadgeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Badge removed from library");
      qc.invalidateQueries({ queryKey: ["admin-badges"] });
      if (selectedBadgeToAward?.id && !badges.find((b) => b.id === selectedBadgeToAward.id)) {
        setSelectedBadgeToAward(null);
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete badge");
    },
  });

  const awardMut = useMutation({
    mutationFn: ({ listingId, badge }: { listingId: string; badge: ListingCustomBadge }) =>
      awardBadgeFn({
        data: {
          listingId,
          badge: {
            id: badge.id,
            name: badge.name,
            imageUrl: badge.imageUrl,
            glowColor: badge.glowColor,
          },
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-badge-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to award badge");
    },
  });

  const removeAwardMut = useMutation({
    mutationFn: (listingId: string) => removeBadgeFn({ data: { listingId } }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-badge-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove badge");
    },
  });

  // Handle Photo Upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileTo("listing-images", file);
      setImageUrl(url);
      toast.success("Badge photo uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const effectiveGlow = hasGlow ? glowColor : null;
  const glowStyle = getListingGlowStyle(effectiveGlow);

  return (
    <div className="space-y-10">
      {/* SECTION 1: BADGE CREATOR */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Create Custom Listing Badge</h2>
            <p className="text-xs text-muted-foreground">
              Create badges that appear on the top right of user listings with an optional custom neon glow.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          {/* Form Fields */}
          <div className="space-y-5 lg:col-span-7">
            {/* Badge Name */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Badge Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="e.g. Staff Pick, Rare Vintage, Verified Collector"
                className="mt-1.5 w-full rounded-2xl border-2 border-primary/20 bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary"
              />
            </div>

            {/* Badge Image / Photo */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Badge Photo / Icon <span className="text-destructive">*</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL or upload below..."
                  className="flex-1 rounded-2xl border-2 border-primary/20 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-2 text-xs font-black uppercase tracking-wider text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Quick Icons */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_ICONS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => {
                        setImageUrl(sample.url);
                        if (!badgeName) setBadgeName(sample.name);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-muted/40 px-2.5 py-1 text-[11px] font-semibold hover:border-primary hover:bg-primary-soft transition"
                    >
                      <img src={sample.url} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow Option */}
            <div className="rounded-2xl border-2 border-primary/15 bg-muted/20 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasGlow}
                    onChange={(e) => setHasGlow(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                  <span>Give User's Listing a Custom Glow</span>
                </label>
                {hasGlow && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border shadow-sm"
                      style={{ backgroundColor: glowColor }}
                    />
                    <span className="font-mono text-xs font-bold uppercase">{glowColor}</span>
                  </div>
                )}
              </div>

              {hasGlow && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_GLOW_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setGlowColor(preset.hex)}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
                          glowColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "border-foreground bg-foreground text-background shadow-md scale-105"
                            : "border-border bg-card text-foreground hover:scale-105"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: preset.hex }}
                        />
                        {preset.label}
                      </button>
                    ))}

                    {/* Custom Native Color Picker */}
                    <label className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-primary/40 bg-card px-3 py-1 text-xs font-bold cursor-pointer hover:border-primary transition">
                      <Palette className="h-3.5 w-3.5 text-primary" />
                      Custom Color
                      <input
                        type="color"
                        value={glowColor}
                        onChange={(e) => setGlowColor(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!badgeName.trim() || !imageUrl.trim() || createMut.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create & Save Badge to Library
            </button>
          </div>

          {/* Live Card Preview */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> Live Listing Preview
              </span>
            </div>

            {/* Preview Card */}
            <div
              className="relative mx-auto w-full max-w-[320px] rounded-2xl border-2 bg-card p-3.5 transition-all duration-300"
              style={glowStyle}
            >
              {/* Card Image Area */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 via-primary/20 to-purple-500/20">
                <img
                  src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"
                  alt="Preview item"
                  className="h-full w-full object-cover"
                />

                {/* Top Left dummy bookmark */}
                <div className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-primary/70 shadow-sm text-xs">
                  ★
                </div>

                {/* Top Right: Custom Badge */}
                <div
                  className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-black tracking-wide text-white border border-white/20 shadow-lg"
                  style={hasGlow ? { boxShadow: `0 0 16px ${glowColor}cc` } : undefined}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={badgeName}
                      className="h-4 w-4 rounded-full object-cover border border-white/30"
                    />
                  ) : (
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                  )}
                  <span>{badgeName || "Badge Name"}</span>
                </div>

                <div className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary">
                  Like New
                </div>
              </div>

              {/* Card Details */}
              <div className="mt-3">
                <p className="text-xs font-bold text-muted-foreground">Dubai Marina · Electronics</p>
                <h3 className="font-display font-black text-sm mt-0.5">Fujifilm X-T30 Mirrorless</h3>
                <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-xs">
                  <span className="text-muted-foreground">Looking for: Drone or Lens</span>
                  <span className="font-bold text-primary">SWAP</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {hasGlow
                ? `Glowing with ${glowColor} accent and ambient aura.`
                : "Standard card border without custom neon glow."}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: BADGE LIBRARY */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Badge Library ({badges.length})</h2>
              <p className="text-xs text-muted-foreground">
                All badges created by moderators available to award to listings.
              </p>
            </div>
          </div>
        </div>

        {badgesLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="mt-2 text-xs">Loading badge library...</p>
          </div>
        ) : badges.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-2 font-display text-base font-bold">No badges created yet</p>
            <p className="text-xs text-muted-foreground">
              Create your first badge in the creator above to start awarding them to listings.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => {
              const isSelected = selectedBadgeToAward?.name === b.name;
              return (
                <div
                  key={b.id || b.name}
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 transition ${
                    isSelected
                      ? "border-primary bg-primary-soft shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={b.imageUrl}
                      alt={b.name}
                      className="h-12 w-12 rounded-2xl border object-cover shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-black text-sm truncate">{b.name}</h4>
                      <div className="mt-1 flex items-center gap-2">
                        {b.glowColor ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: b.glowColor }}
                          >
                            <Flame className="h-2.5 w-2.5" />
                            Glow {b.glowColor}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No glow</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedBadgeToAward(isSelected ? null : b)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "border border-primary/30 text-primary hover:bg-primary-soft"
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                      {isSelected ? "Selected for Award" : "Select to Award"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${b.name}" badge from library?`)) {
                          if (b.id) deleteMut.mutate(b.id);
                        }
                      }}
                      title="Delete Badge"
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: ASSIGN BADGES TO LISTINGS */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Award Badges to Listings</h2>
              <p className="text-xs text-muted-foreground">
                Search listings and grant them badges to highlight quality items on the feed.
              </p>
            </div>
          </div>

          {selectedBadgeToAward && (
            <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">
              <Award className="h-3.5 w-3.5" />
              <span>Selected Badge: <strong>{selectedBadgeToAward.name}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedBadgeToAward(null)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Search listings input */}
        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings by title..."
              className="w-full rounded-2xl border-2 border-primary/20 bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Listings List */}
        <div className="mt-6 space-y-3">
          {listingsLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-2 text-xs">Searching listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No listings found matching query.</p>
          ) : (
            listings.map((l: any) => {
              const currentBadge = l.customBadge as ListingCustomBadge | null;
              const hasBadge = !!currentBadge;

              return (
                <div
                  key={l.id}
                  className="flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between transition hover:border-primary/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {l.image_urls && l.image_urls.length > 0 ? (
                      <img
                        src={l.image_urls[0]}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover shrink-0 border"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-muted grid place-items-center shrink-0">
                        📦
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/listings/${l.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-display font-bold text-sm hover:text-primary hover:underline truncate inline-flex items-center gap-1"
                        >
                          {l.title}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Owner: @{l.owner?.username || "user"} · Status: {l.status}
                      </p>

                      {/* Current badge status */}
                      {hasBadge ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-muted-foreground">Current Badge:</span>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20"
                            style={currentBadge.glowColor ? { boxShadow: `0 0 10px ${currentBadge.glowColor}` } : undefined}
                          >
                            <img
                              src={currentBadge.imageUrl}
                              alt=""
                              className="h-3.5 w-3.5 rounded-full object-cover"
                            />
                            {currentBadge.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-1 inline-block">
                          No custom badge
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {hasBadge && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove custom badge from "${l.title}"?`)) {
                            removeAwardMut.mutate(l.id);
                          }
                        }}
                        disabled={removeAwardMut.isPending}
                        className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition"
                      >
                        Remove Badge
                      </button>
                    )}

                    {selectedBadgeToAward ? (
                      <button
                        type="button"
                        onClick={() =>
                          awardMut.mutate({ listingId: l.id, badge: selectedBadgeToAward })
                        }
                        disabled={awardMut.isPending}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:opacity-90"
                      >
                        <Award className="h-3.5 w-3.5" />
                        Award "{selectedBadgeToAward.name}"
                      </button>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const badge = badges.find((b) => b.name === e.target.value);
                          if (badge) {
                            awardMut.mutate({ listingId: l.id, badge });
                            e.target.value = "";
                          }
                        }}
                        className="rounded-full border-2 border-primary/20 bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                      >
                        <option value="" disabled>
                          + Award Badge...
                        </option>
                        {badges.map((b) => (
                          <option key={b.id || b.name} value={b.name}>
                            {b.name} {b.glowColor ? `(Glow: ${b.glowColor})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
