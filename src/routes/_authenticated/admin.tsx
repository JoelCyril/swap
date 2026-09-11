import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  listFlaggedListings,
  adminRemoveListing,
  redeemAdminCode,
  getFlaggedListingDetail,
  listBannedUsers,
  listInquiries,
  replyToInquiry,
  listWithheldListings,
  reviewWithheldListing,
  getModeratorAnalytics,
  adminEmailIndividualUser,
  adminListBadges,
} from "@/lib/admin.functions";
import { liftBan } from "@/lib/bans.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { gradientForId, timeAgo } from "@/lib/db-types";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { AdminBadgesPanel } from "@/components/admin/AdminBadgesPanel";
import { AdminProfileBadgesPanel } from "@/components/admin/AdminProfileBadgesPanel";
import {
  AdminUserMessagePanel,
  type CommunicationMode,
} from "@/components/admin/AdminUserMessagePanel";
import {
  ShieldCheck,
  Trash2,
  Flag,
  Sparkles,
  X,
  ChevronRight,
  Ban,
  LifeBuoy,
  ShieldOff,
  Mail,
  EyeOff,
  Check,
  Package,
  BarChart3,
  Send,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SWAP" },
      { name: "description", content: "Moderate content and manage communications on SWAP." },
      { property: "og:title", content: "Admin — SWAP" },
      { property: "og:description", content: "SWAP admin & moderation dashboard." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const me = useServerFn(getMyProfile);
  const list = useServerFn(listFlaggedListings);
  const remove = useServerFn(adminRemoveListing);
  const redeem = useServerFn(redeemAdminCode);
  const [code, setCode] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // 4 Primary Pillars Navigation
  const [mainTab, setMainTab] = useState<"analytics" | "communications" | "moderation" | "badges">(
    "analytics",
  );

  // Sub-tabs
  const [moderationTab, setModerationTab] = useState<"flagged" | "withheld" | "banned" | "inquiries">(
    "flagged",
  );
  const [badgesTab, setBadgesTab] = useState<"profile-badges" | "listing-badges">("profile-badges");
  const [commSubTab, setCommSubTab] = useState<CommunicationMode>("direct");
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<any>(null);

  const analyticsFn = useServerFn(getModeratorAnalytics);
  const withheldFn = useServerFn(listWithheldListings);
  const reviewFn = useServerFn(reviewWithheldListing);
  const bannedFn = useServerFn(listBannedUsers);
  const inquiriesFn = useServerFn(listInquiries);
  const liftFn = useServerFn(liftBan);
  const emailSingleUserFn = useServerFn(adminEmailIndividualUser);
  const listBadgesFn = useServerFn(adminListBadges);

  const [sendingSingleUserId, setSendingSingleUserId] = useState<string | null>(null);

  const sendSingleEmailMut = useMutation({
    mutationFn: (user: any) => {
      setSendingSingleUserId(user.id);
      return emailSingleUserFn({ data: { userId: user.id } });
    },
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send email"),
    onSettled: () => setSendingSingleUserId(null),
  });

  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: () => me() });
  const isAdmin = profile?.roles?.includes("admin");

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => analyticsFn(),
    enabled: !!isAdmin,
  });

  const { data: flagged } = useQuery({
    queryKey: ["admin-flagged"],
    queryFn: () => list(),
    enabled: !!isAdmin,
  });

  const { data: banned } = useQuery({
    queryKey: ["admin-banned"],
    queryFn: () => bannedFn(),
    enabled: !!isAdmin,
  });

  const { data: inquiries } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: () => inquiriesFn(),
    enabled: !!isAdmin,
  });

  const { data: withheld } = useQuery({
    queryKey: ["admin-withheld"],
    queryFn: () => withheldFn(),
    enabled: !!isAdmin,
  });

  const { data: badges } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: () => listBadgesFn(),
    enabled: !!isAdmin,
  });

  const reviewMut = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => reviewFn({ data: v }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-withheld"] });
      toast.success(v.approve ? "Listing published" : "Listing declined");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const liftMut = useMutation({
    mutationFn: (userId: string) => liftFn({ data: { user_id: userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banned"] });
      toast.success("Ban lifted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged"] });
      setOpenId(null);
      toast.success("Listing removed");
    },
  });

  const redeemMut = useMutation({
    mutationFn: () => redeem({ data: { code } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("You are now an admin");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const totalUsers = (analytics?.users ?? []).length;
  const pendingFlaggedCount = (flagged ?? []).length;
  const pendingWithheldCount = (withheld ?? []).length;
  const totalBadgesCount = (badges ?? []).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 sm:px-6 py-8 sm:py-10">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Admin & Moderation
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage members, direct communications, flagged listings, and community safety.
              </p>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card">
            <p className="text-sm text-muted-foreground">
              You are not an admin. Enter the bootstrap code to gain access (This page is only for the moderator team).
            </p>
            <div className="mt-4 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Admin code"
                className="flex-1 rounded-full border-2 border-primary/20 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => redeemMut.mutate()}
                disabled={!code}
                className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-black uppercase text-primary-foreground disabled:opacity-50"
              >
                Redeem
              </button>
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            {/* 4-Pillar Symmetrical Primary Navigation */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                {
                  id: "analytics" as const,
                  label: "Members & Analytics",
                  sublabel: "User base & metrics",
                  icon: BarChart3,
                  badgeText: `${totalUsers} Users`,
                },
                {
                  id: "communications" as const,
                  label: "Messages & Broadcast",
                  sublabel: "Direct, broadcast & email",
                  icon: Send,
                  badgeText: "3 Channels",
                },
                {
                  id: "moderation" as const,
                  label: "Moderation Hub",
                  sublabel: "Listings, bans & safety",
                  icon: ShieldCheck,
                  isAlert: pendingFlaggedCount > 0,
                  badgeText:
                    pendingFlaggedCount > 0
                      ? `${pendingFlaggedCount} Flagged`
                      : pendingWithheldCount > 0
                        ? `${pendingWithheldCount} Review`
                        : "Clean",
                },
                {
                  id: "badges" as const,
                  label: "Badges & Studio",
                  sublabel: "Profile & item badges",
                  icon: Sparkles,
                  badgeText: `${totalBadgesCount} Badges`,
                },
              ].map((item) => {
                const isActive = mainTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMainTab(item.id)}
                    className={`group relative flex flex-col items-start justify-between rounded-2xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.98] border ${
                      isActive
                        ? "border-primary/60 bg-gradient-primary text-primary-foreground shadow-glow shadow-primary/20"
                        : "border-border/80 bg-card/70 hover:bg-card hover:border-primary/40 text-card-foreground shadow-xs"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2 mb-2.5">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary group-hover:scale-105"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-tight ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.isAlert
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`font-display text-xs sm:text-sm font-black ${
                          isActive ? "text-white" : "text-foreground"
                        }`}
                      >
                        {item.label}
                      </h3>
                      <p
                        className={`text-[11px] leading-tight line-clamp-1 mt-0.5 ${
                          isActive ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        {item.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: MEMBERS & ANALYTICS */}
            {mainTab === "analytics" && (
              <AnalyticsPanel
                data={analytics}
                isLoading={isAnalyticsLoading}
                sendingUserId={sendingSingleUserId}
                onSendUserEmail={(user) => {
                  if (confirm(`Send reminder email to @${user.username} to list their items?`)) {
                    sendSingleEmailMut.mutate(user);
                  }
                }}
                onEmailNoListings={() => {
                  setSelectedUserForMessage(null);
                  setCommSubTab("email");
                  setMainTab("communications");
                }}
                onMessageUser={(user) => {
                  setSelectedUserForMessage(user);
                  setCommSubTab("direct");
                  setMainTab("communications");
                }}
              />
            )}

            {/* TAB 2: UNIFIED NOTIFICATIONS & BROADCAST */}
            {mainTab === "communications" && (
              <AdminUserMessagePanel
                users={analytics?.users ?? []}
                initialUser={selectedUserForMessage}
                initialMode={commSubTab}
                summary={analytics?.summary}
                onModeChange={(m) => setCommSubTab(m)}
              />
            )}

            {/* TAB 3: MODERATION HUB */}
            {mainTab === "moderation" && (
              <div className="space-y-6">
                {/* Symmetrical Sub-Navigation */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 rounded-2xl border border-border/80 bg-card/60 p-1.5 shadow-xs">
                  {[
                    {
                      key: "flagged" as const,
                      label: "Flagged Listings",
                      icon: Flag,
                      count: (flagged ?? []).length,
                      isAlert: (flagged ?? []).length > 0,
                    },
                    {
                      key: "withheld" as const,
                      label: "Withheld Review",
                      icon: EyeOff,
                      count: (withheld ?? []).length,
                    },
                    {
                      key: "banned" as const,
                      label: "Banned Members",
                      icon: Ban,
                      count: (banned ?? []).length,
                    },
                    {
                      key: "inquiries" as const,
                      label: "Support Inquiries",
                      icon: LifeBuoy,
                      count: (inquiries ?? []).length,
                    },
                  ].map((sub) => {
                    const isSubActive = moderationTab === sub.key;
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => setModerationTab(sub.key)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer select-none active:scale-95 ${
                          isSubActive
                            ? "bg-gradient-primary text-primary-foreground shadow-sm font-extrabold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <SubIcon className="h-3.5 w-3.5" />
                        <span>{sub.label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                            isSubActive
                              ? "bg-white/20 text-white"
                              : sub.isAlert
                                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-view: Flagged */}
                {moderationTab === "flagged" && (
                  <div className="space-y-3">
                    {(flagged ?? []).length === 0 ? (
                      <div className="rounded-3xl border-2 border-dashed border-primary/30 p-10 text-center text-muted-foreground">
                        <p className="font-display text-base font-bold text-foreground">No flagged listings</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Community listings are compliant and safe.
                        </p>
                      </div>
                    ) : (
                      (flagged ?? []).map((l: any) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setOpenId(l.id)}
                          className="flex w-full items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-card p-4 text-left hover:border-destructive transition cursor-pointer"
                        >
                          <div
                            className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(
                              l.id,
                            )} text-primary/40`}
                          >
                            <Package className="h-8 w-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-lg font-bold truncate">{l.title}</p>
                            <p className="text-xs text-muted-foreground">
                              by @{l.owner?.username} · {l.category} · {l.status}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                              <Flag className="h-3 w-3" /> {l.flags_count} flags
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-view: Withheld */}
                {moderationTab === "withheld" && (
                  <div className="space-y-3">
                    {(withheld ?? []).length === 0 ? (
                      <div className="rounded-3xl border-2 border-dashed border-primary/30 p-10 text-center text-muted-foreground">
                        <p className="font-display text-base font-bold text-foreground">No listings awaiting review</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          All new listings have passed auto-moderation checks.
                        </p>
                      </div>
                    ) : (
                      (withheld ?? []).map((l: any) => (
                        <div key={l.id} className="rounded-2xl border-2 border-primary/20 bg-card p-4">
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-lg font-bold truncate">{l.title}</p>
                              <p className="text-xs text-muted-foreground">
                                @{l.owner?.username ?? "unknown"} · {timeAgo(l.created_at)}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                                {l.description}
                              </p>
                              <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                                {l.moderation_note ?? "Held for review"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => reviewMut.mutate({ id: l.id, approve: true })}
                                disabled={reviewMut.isPending}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" /> Accept
                              </button>
                              <button
                                onClick={() => reviewMut.mutate({ id: l.id, approve: false })}
                                disabled={reviewMut.isPending}
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-destructive/40 px-4 py-2 text-xs font-black uppercase text-destructive disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" /> Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-view: Banned */}
                {moderationTab === "banned" && (
                  <div className="space-y-3">
                    {(banned ?? []).length === 0 ? (
                      <div className="rounded-3xl border-2 border-dashed border-primary/30 p-10 text-center text-muted-foreground">
                        <p className="font-display text-base font-bold text-foreground">No banned members</p>
                        <p className="text-xs text-muted-foreground mt-1">There are no active account bans.</p>
                      </div>
                    ) : (
                      (banned ?? []).map((b: any) => (
                        <div
                          key={b.id}
                          className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-card p-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-lg font-bold truncate">
                              @{b.profile?.username ?? "unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">Reason: {b.reason || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.expires_at ? `Until ${new Date(b.expires_at).toLocaleString()}` : "Permanent"} · banned{" "}
                              {timeAgo(b.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => liftMut.mutate(b.user_id)}
                            disabled={liftMut.isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase text-primary hover:bg-primary-soft disabled:opacity-50"
                          >
                            <ShieldOff className="h-3.5 w-3.5" /> Lift ban
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-view: Support Inquiries */}
                {moderationTab === "inquiries" && (
                  <div className="space-y-3">
                    {(inquiries ?? []).length === 0 ? (
                      <div className="rounded-3xl border-2 border-dashed border-primary/30 p-10 text-center text-muted-foreground">
                        <p className="font-display text-base font-bold text-foreground">No inquiries yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Support inbox is currently clear.
                        </p>
                      </div>
                    ) : (
                      (inquiries ?? []).map((q: any) => (
                        <div key={q.id} className="rounded-2xl border-2 border-primary/20 bg-card p-4">
                          <p className="font-display text-lg font-bold">{q.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {q.name} ·{" "}
                            <a
                              href={`mailto:${q.email}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              {q.email}
                            </a>{" "}
                            · {timeAgo(q.created_at)}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{q.message}</p>
                          <InquiryReply inquiry={q} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BADGES STUDIO */}
            {mainTab === "badges" && (
              <div className="space-y-6">
                {/* Symmetrical Sub-Navigation */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 rounded-2xl border border-border/80 bg-card/60 p-1.5 shadow-xs">
                  {[
                    { key: "profile-badges" as const, label: "Profile Badges Studio", icon: Sparkles },
                    {
                      key: "listing-badges" as const,
                      label: "Listing Badges",
                      icon: Award,
                      count: totalBadgesCount,
                    },
                  ].map((sub) => {
                    const isSubActive = badgesTab === sub.key;
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => setBadgesTab(sub.key)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer select-none active:scale-95 ${
                          isSubActive
                            ? "bg-gradient-primary text-primary-foreground shadow-sm font-extrabold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <SubIcon className="h-3.5 w-3.5" />
                        <span>{sub.label}</span>
                        {sub.count !== undefined && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                              isSubActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sub.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {badgesTab === "profile-badges" && <AdminProfileBadgesPanel />}
                {badgesTab === "listing-badges" && <AdminBadgesPanel />}
              </div>
            )}
          </>
        )}

        {openId && (
          <FlaggedListingModal
            id={openId}
            onClose={() => setOpenId(null)}
            onRemove={() => removeMut.mutate(openId)}
            removing={removeMut.isPending}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function FlaggedListingModal({
  id,
  onClose,
  onRemove,
  removing,
}: {
  id: string;
  onClose: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const detail = useServerFn(getFlaggedListingDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-flagged-detail", id],
    queryFn: () => detail({ data: { id } }),
  });
  const listing = data?.listing;
  const flags = data?.flags ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card shadow-card-hover border-2 border-primary/20"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Loading details…</div>}

        {!isLoading && !listing && (
          <div className="p-8 text-center text-sm text-muted-foreground">Listing not found or already deleted.</div>
        )}

        {!isLoading && listing && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div
                className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(
                  listing.id,
                )} text-primary/40`}
              >
                <Package className="h-10 w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary mb-1">
                  {listing.category}
                </span>
                <h3 className="font-display text-2xl font-bold text-foreground">{listing.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Listed by @{listing.owner?.username ?? "unknown"} · Status: {listing.status}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">Description</h4>
              <p className="rounded-2xl bg-muted/40 p-4 text-sm text-foreground whitespace-pre-wrap">
                {listing.description || "No description provided."}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                Flags ({flags.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {flags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No flag reports found.</p>
                ) : (
                  flags.map((f: any) => (
                    <div key={f.id} className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-destructive">
                          Reason: {f.reason || "Unspecified"}
                        </span>
                        <span className="text-muted-foreground">{timeAgo(f.created_at)}</span>
                      </div>
                      {f.reporter && (
                        <p className="text-muted-foreground mt-1">
                          Reported by @{f.reporter.username}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={onClose}
                className="rounded-full border-2 border-primary/30 px-5 py-2 text-sm font-bold text-primary hover:bg-primary-soft cursor-pointer"
              >
                Close
              </button>
              {listing.status !== "removed" && (
                <button
                  onClick={() => {
                    if (confirm("Remove this listing?")) onRemove();
                  }}
                  disabled={removing}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-5 py-2 text-sm font-bold uppercase hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove listing
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InquiryReply({ inquiry }: { inquiry: any }) {
  const qc = useQueryClient();
  const replyFn = useServerFn(replyToInquiry);
  const [text, setText] = useState(inquiry.reply ?? "");
  const [editing, setEditing] = useState(!inquiry.reply);

  const mut = useMutation({
    mutationFn: () => replyFn({ data: { id: inquiry.id, reply: text.trim() } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      setEditing(false);
      toast.success("Reply sent to the member");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send reply"),
  });

  if (!editing) {
    return (
      <div className="mt-3 rounded-2xl bg-primary-soft p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary">Your reply</p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{inquiry.reply}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-bold uppercase text-primary hover:underline cursor-pointer"
        >
          Edit reply
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <textarea
        rows={3}
        maxLength={2000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply the member will see in their Inquiry updates…"
        className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={() => mut.mutate()}
        disabled={!text.trim() || mut.isPending}
        className="mt-2 rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50 cursor-pointer"
      >
        {mut.isPending ? "Sending…" : "Send reply"}
      </button>
    </div>
  );
}
