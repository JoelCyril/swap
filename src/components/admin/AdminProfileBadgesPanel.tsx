import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListBadges,
  adminCreateBadge,
  adminDeleteBadge,
  adminSearchUsersForBadge,
  adminAwardProfileBadge,
  adminRemoveProfileBadge,
} from "@/lib/admin.functions";
import { PRESET_GLOW_COLORS, type ProfileCustomBadge } from "@/lib/badges";
import { uploadFileTo } from "@/lib/upload";
import {
  Sparkles,
  Award,
  Upload,
  Trash2,
  Check,
  Search,
  Plus,
  Palette,
  Eye,
  Loader2,
  X,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { handle } from "@/lib/db-types";

const SAMPLE_ICONS = [
  { name: "Verified Star", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=80" },
  { name: "Gold Trophy", url: "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=100&auto=format&fit=crop&q=80" },
  { name: "Cyber Gem", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80" },
  { name: "Flame Spark", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100&auto=format&fit=crop&q=80" },
];

export function AdminProfileBadgesPanel() {
  const qc = useQueryClient();

  const listBadgesFn = useServerFn(adminListBadges);
  const createBadgeFn = useServerFn(adminCreateBadge);
  const deleteBadgeFn = useServerFn(adminDeleteBadge);
  const searchUsersFn = useServerFn(adminSearchUsersForBadge);
  const awardBadgeFn = useServerFn(adminAwardProfileBadge);
  const removeBadgeFn = useServerFn(adminRemoveProfileBadge);

  // Form State
  const [badgeName, setBadgeName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hasGlow, setHasGlow] = useState(true);
  const [glowColor, setGlowColor] = useState("#a855f7");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Award state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadgeToAward, setSelectedBadgeToAward] = useState<ProfileCustomBadge | null>(null);

  // Queries
  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: () => listBadgesFn(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-profile-badge-users", searchQuery],
    queryFn: () => searchUsersFn({ data: { query: searchQuery } }),
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
      toast.success(`Profile badge "${newBadge.name}" created!`);
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
    mutationFn: ({ userId, badge }: { userId: string; badge: ProfileCustomBadge }) =>
      awardBadgeFn({ data: { userId, badge } }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-profile-badge-users"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to award badge");
    },
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => removeBadgeFn({ data: { userId } }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-profile-badge-users"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove badge");
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadFileTo("avatars", file);
      setImageUrl(publicUrl);
      toast.success("Badge icon uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary-soft/40 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Profile Badges
            </div>
            <h2 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
              Member Profile Badge Studio
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Design exclusive profile badges with custom artwork and glowing neon borders. Award them to verified members, community champions, or top traders to showcase on their public profile and throughout the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Badge Creator Studio */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card space-y-5">
            <h3 className="font-display text-lg font-black flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Create New Profile Badge
            </h3>

            {/* Badge Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Badge Title / Name
              </label>
              <input
                type="text"
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="e.g. Verified Swapper, Founding Member, Elite Collector"
                className="w-full rounded-2xl border-2 border-primary/20 bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary transition"
                maxLength={40}
              />
            </div>

            {/* Badge Image / Icon */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Badge Icon / Photo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or upload below"
                  className="flex-1 rounded-2xl border-2 border-primary/20 bg-background px-4 py-2 text-sm outline-none focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-primary/25 bg-muted px-4 py-2 text-xs font-bold transition hover:bg-primary-soft active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Presets */}
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Or choose a preset artwork:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_ICONS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => {
                        setImageUrl(sample.url);
                        if (!badgeName) setBadgeName(sample.name);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition cursor-pointer ${
                        imageUrl === sample.url
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <img src={sample.url} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow Color Configuration */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Neon Glow Effect
                </label>
                <button
                  type="button"
                  onClick={() => setHasGlow((v) => !v)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase transition cursor-pointer ${
                    hasGlow ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {hasGlow ? "Enabled" : "Disabled"}
                </button>
              </div>

              {hasGlow && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_GLOW_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setGlowColor(preset.hex)}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition cursor-pointer ${
                          glowColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "border-foreground bg-foreground/5 shadow-xs font-bold"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Custom Color:</span>
                    <input
                      type="color"
                      value={glowColor}
                      onChange={(e) => setGlowColor(e.target.value)}
                      className="h-7 w-7 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={glowColor}
                      onChange={(e) => setGlowColor(e.target.value)}
                      className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* LIVE PREVIEW CARD */}
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-muted/30 p-4 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> Live Profile Header Preview
              </p>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-lg font-black text-white shadow">
                    JD
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-black text-base truncate">@joelcyril</span>
                      {badgeName ? (
                        <div
                          className="inline-flex items-center gap-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md transition"
                          style={
                            hasGlow && glowColor
                              ? {
                                  borderColor: glowColor,
                                  boxShadow: `0 0 16px ${glowColor}99, 0 0 32px ${glowColor}40`,
                                }
                              : undefined
                          }
                        >
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover border border-white/40 shrink-0"
                            />
                          )}
                          <span>{badgeName}</span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-white/50">(Badge preview will appear here)</span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 mt-0.5">Dubai · Member since 2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Badge Button */}
            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!badgeName.trim() || !imageUrl.trim() || createMut.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer shadow-glow"
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Badge to Library
            </button>
          </div>

          {/* BADGE LIBRARY */}
          <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-black flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Profile Badge Library ({badges.length})
              </h3>
              {selectedBadgeToAward && (
                <button
                  type="button"
                  onClick={() => setSelectedBadgeToAward(null)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear selection
                </button>
              )}
            </div>

            {badgesLoading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Loading library…</p>
            ) : badges.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No custom badges created yet. Build your first one above!
              </p>
            ) : (
              <div className="grid gap-2.5">
                {badges.map((b) => {
                  const isSelected = selectedBadgeToAward?.id === b.id || selectedBadgeToAward?.name === b.name;
                  return (
                    <div
                      key={b.id || b.name}
                      onClick={() => setSelectedBadgeToAward(b)}
                      className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-3 transition cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary-soft/60 shadow-sm ring-2 ring-primary/40"
                          : "border-border bg-background/50 hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/60 shadow-sm"
                          style={
                            b.glowColor
                              ? {
                                  borderColor: b.glowColor,
                                  boxShadow: `0 0 12px ${b.glowColor}99`,
                                }
                              : undefined
                          }
                        >
                          <img src={b.imageUrl} alt={b.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{b.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {b.glowColor ? (
                              <span className="inline-flex items-center gap-1">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: b.glowColor }}
                                />
                                {b.glowColor}
                              </span>
                            ) : (
                              "No glow"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                        {b.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete badge "${b.name}" from library?`)) {
                                deleteMut.mutate(b.id!);
                              }
                            }}
                            className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                            title="Delete badge"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Member Search & Award Panel */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card space-y-6">
            <div>
              <h3 className="font-display text-xl font-black flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Award Badge to Members
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select a badge from the library on the left, search for a member, and click "Award Badge". The member will receive an instant notification and their profile will glow with the new badge.
              </p>
            </div>

            {/* Selected Badge Banner */}
            {selectedBadgeToAward ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border-2 border-primary/30 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2"
                    style={
                      selectedBadgeToAward.glowColor
                        ? {
                            borderColor: selectedBadgeToAward.glowColor,
                            boxShadow: `0 0 16px ${selectedBadgeToAward.glowColor}aa`,
                          }
                        : undefined
                    }
                  >
                    <img
                      src={selectedBadgeToAward.imageUrl}
                      alt={selectedBadgeToAward.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      Ready to award
                    </span>
                    <p className="font-display text-base font-black truncate">{selectedBadgeToAward.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBadgeToAward(null)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted transition cursor-pointer"
                  title="Unselect"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/10 p-4 text-xs font-semibold text-amber-900 dark:text-amber-300">
                👉 Select a badge from the library on the left to start awarding to members.
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by username or display name…"
                className="w-full rounded-2xl border-2 border-primary/20 bg-background py-2.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary transition"
              />
            </div>

            {/* Users List */}
            {usersLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                Loading members…
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No members found matching "{searchQuery}".
              </div>
            ) : (
              <div className="grid gap-3">
                {users.map((u: any) => {
                  const currentBadge = u.customBadge as ProfileCustomBadge | null;
                  const isAwardingThis =
                    awardMut.isPending && (awardMut.variables as any)?.userId === u.id;
                  const isRemovingThis =
                    removeMut.isPending && (removeMut.variables as any) === u.id;

                  return (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-white font-bold text-sm shadow"
                          style={{ backgroundColor: u.avatar_url ? "transparent" : u.avatar_color || "#3b82f6" }}
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (u.display_name || u.username)?.[0]?.toUpperCase() || <User className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-black text-sm">{handle(u)}</span>
                            {u.location && (
                              <span className="text-[11px] text-muted-foreground">· {u.location}</span>
                            )}
                          </div>

                          {/* Currently Awarded Badge */}
                          <div className="mt-1 flex items-center gap-2">
                            {currentBadge ? (
                              <div
                                className="inline-flex items-center gap-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-xs"
                                style={
                                  currentBadge.glowColor
                                    ? {
                                        borderColor: currentBadge.glowColor,
                                        boxShadow: `0 0 10px ${currentBadge.glowColor}99`,
                                      }
                                    : undefined
                                }
                              >
                                {currentBadge.imageUrl && (
                                  <img
                                    src={currentBadge.imageUrl}
                                    alt=""
                                    className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                                  />
                                )}
                                <span>{currentBadge.name}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">No badge assigned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {currentBadge && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove badge from @${u.username}?`)) {
                                removeMut.mutate(u.id);
                              }
                            }}
                            disabled={isRemovingThis}
                            className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition cursor-pointer disabled:opacity-50"
                          >
                            {isRemovingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedBadgeToAward) {
                              toast.info("Please select a badge from the library on the left first.");
                              return;
                            }
                            awardMut.mutate({
                              userId: u.id,
                              badge: selectedBadgeToAward,
                            });
                          }}
                          disabled={!selectedBadgeToAward || isAwardingThis}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
                        >
                          {isAwardingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          {currentBadge ? "Replace Badge" : "Award Badge"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
