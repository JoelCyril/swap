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
  adminSendNotification,
  adminEmailUsersWithoutListings,
} from "@/lib/admin.functions";
import { liftBan } from "@/lib/bans.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { gradientForId, timeAgo } from "@/lib/db-types";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import {
  ShieldCheck,
  Trash2,
  Flag,
  X,
  MapPin,
  ChevronRight,
  Ban,
  LifeBuoy,
  ShieldOff,
  Mail,
  EyeOff,
  Check,
  Package,
  BarChart3,
  Bell,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SWAP" },
      { name: "description", content: "Moderate flagged content on SWAP." },
      { property: "og:title", content: "Admin — SWAP" },
      { property: "og:description", content: "SWAP moderation dashboard." },
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
  const [tab, setTab] = useState<"analytics" | "flagged" | "withheld" | "banned" | "inquiries" | "broadcast">("analytics");
  const analyticsFn = useServerFn(getModeratorAnalytics);
  const withheldFn = useServerFn(listWithheldListings);
  const reviewFn = useServerFn(reviewWithheldListing);
  const bannedFn = useServerFn(listBannedUsers);
  const inquiriesFn = useServerFn(listInquiries);
  const liftFn = useServerFn(liftBan);
  const sendNotifFn = useServerFn(adminSendNotification);
  const emailCampaignFn = useServerFn(adminEmailUsersWithoutListings);

  const [channelMode, setChannelMode] = useState<"notification" | "email">("notification");
  const [notifTarget, setNotifTarget] = useState<"all" | "no_listings" | "user">("all");
  const [notifUsername, setNotifUsername] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifLink, setNotifLink] = useState("");

  // Email Campaign States (for users without listings)
  const [emailSubject, setEmailSubject] = useState("List your first item on SWAP — Trade easily across UAE 📦");
  const [emailHeading, setEmailHeading] = useState("Turn your unused items into something you love");
  const [emailMessage, setEmailMessage] = useState(
    "You joined SWAP, but haven't listed any items yet!\n\nListing takes less than 30 seconds with our instant camera auto-fill. Start swapping electronics, accessories, books, and more with UAE neighbours without spending money.",
  );
  const [emailButtonText, setEmailButtonText] = useState("List an Item Now");
  const [emailButtonLink, setEmailButtonLink] = useState("/my-listings?add=true");

  const sendNotifMut = useMutation({
    mutationFn: () =>
      sendNotifFn({
        data: {
          target: notifTarget,
          username: notifTarget === "user" ? notifUsername : undefined,
          title: notifTitle,
          body: notifBody,
          link: notifLink || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      setNotifTitle("");
      setNotifBody("");
      setNotifLink("");
      setNotifUsername("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send notification"),
  });

  const sendEmailMut = useMutation({
    mutationFn: () =>
      emailCampaignFn({
        data: {
          subject: emailSubject.trim(),
          heading: emailHeading.trim(),
          message: emailMessage.trim(),
          buttonText: emailButtonText.trim(),
          buttonLink: emailButtonLink.trim(),
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message, {
        description: res.failed > 0 ? `Delivered: ${res.count}, Failed: ${res.failed}` : undefined,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send email campaign"),
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-black">Admin</h1>
            <p className="text-muted-foreground text-sm">Moderate reports, bans and inquiries.</p>
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
                className="flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
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
            <div className="mb-6 flex flex-wrap gap-2">
              {(
                [
                  ["analytics", "Analytics & Members", (analytics?.users ?? []).length, BarChart3],
                  ["broadcast", "Send Notification", "New", Bell],
                  ["flagged", "Flagged listings", (flagged ?? []).length, Flag],
                  ["withheld", "Withheld listings", (withheld ?? []).length, EyeOff],
                  ["banned", "Banned users", (banned ?? []).length, Ban],
                  ["inquiries", "Inquiries", (inquiries ?? []).length, LifeBuoy],
                ] as const
              ).map(([key, label, count, Icon]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                    tab === key
                      ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                      : "border-primary/25 text-primary hover:bg-primary-soft"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label} ({count})
                </button>
              ))}
            </div>

            {tab === "analytics" && (
              <AnalyticsPanel
                data={analytics}
                isLoading={isAnalyticsLoading}
                onEmailNoListings={() => {
                  setTab("broadcast");
                  setChannelMode("email");
                }}
              />
            )}

            {tab === "broadcast" && (
              <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-card space-y-6">
                {/* Header with Mode Switcher */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                      {channelMode === "email" ? <Mail className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold">
                        {channelMode === "email" ? "Email Campaign: Users Without Listings" : "Send In-App Notification"}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {channelMode === "email"
                          ? "Send branded direct emails encouraging registered users who have 0 listings to list their items."
                          : "Deliver official announcements directly to users' notification bells."}
                      </p>
                    </div>
                  </div>

                  {/* Channel Switcher */}
                  <div className="flex rounded-full border-2 border-primary/20 bg-muted/30 p-1">
                    <button
                      type="button"
                      onClick={() => setChannelMode("notification")}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                        channelMode === "notification"
                          ? "bg-gradient-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" /> In-App Bell
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelMode("email")}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                        channelMode === "email"
                          ? "bg-gradient-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" /> Direct Email
                    </button>
                  </div>
                </div>

                {/* 1. IN-APP NOTIFICATION MODE */}
                {channelMode === "notification" && (
                  <div className="space-y-4">
                    {/* Recipient Mode */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Target Audience
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setNotifTarget("all")}
                          className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition ${
                            notifTarget === "all"
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "border-primary/20 bg-muted/40 text-foreground hover:bg-muted"
                          }`}
                        >
                          📢 All Users (Broadcast)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifTarget("no_listings")}
                          className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition ${
                            notifTarget === "no_listings"
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "border-primary/20 bg-muted/40 text-foreground hover:bg-muted"
                          }`}
                        >
                          📦 Users Without Listings ({analytics?.summary?.users_without_listings ?? 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifTarget("user")}
                          className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition ${
                            notifTarget === "user"
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "border-primary/20 bg-muted/40 text-foreground hover:bg-muted"
                          }`}
                        >
                          👤 Specific User (@username)
                        </button>
                      </div>
                    </div>

                    {/* Username field if specific user */}
                    {notifTarget === "user" && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Recipient Username
                        </label>
                        <div className="flex items-center rounded-2xl border-2 border-primary/20 bg-white px-3 py-2 max-w-sm">
                          <span className="text-muted-foreground text-sm mr-1">@</span>
                          <input
                            type="text"
                            value={notifUsername}
                            onChange={(e) => setNotifUsername(e.target.value)}
                            placeholder="e.g. aqeel, joelcyril"
                            className="w-full bg-transparent text-sm text-foreground outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Notification Title
                      </label>
                      <input
                        type="text"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g. Notice from SWAP Moderation Team"
                        maxLength={120}
                        className="w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Message Content
                      </label>
                      <textarea
                        rows={4}
                        value={notifBody}
                        onChange={(e) => setNotifBody(e.target.value)}
                        placeholder="Type the message you want the user(s) to see in their notifications…"
                        maxLength={2000}
                        className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    {/* Optional Link */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Action Link (Optional)
                      </label>
                      <input
                        type="text"
                        value={notifLink}
                        onChange={(e) => setNotifLink(e.target.value)}
                        placeholder="e.g. /announcements or /my-listings?add=true"
                        className="w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => sendNotifMut.mutate()}
                        disabled={
                          sendNotifMut.isPending ||
                          !notifTitle.trim() ||
                          !notifBody.trim() ||
                          (notifTarget === "user" && !notifUsername.trim())
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-90 transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        <Send className="h-4 w-4" />
                        {sendNotifMut.isPending
                          ? "Sending Notification…"
                          : notifTarget === "all"
                            ? "Broadcast to All Users"
                            : notifTarget === "no_listings"
                              ? `Send to ${analytics?.summary?.users_without_listings ?? 0} Users Without Listings`
                              : `Send to @${notifUsername.replace(/^@/, "").trim() || "user"}`}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. DIRECT EMAIL CAMPAIGN MODE */}
                {channelMode === "email" && (
                  <div className="space-y-5">
                    {/* Audience info banner */}
                    <div className="flex items-center justify-between rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                            Target: Users without active listings
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Emails will be sent via Resend to the {analytics?.summary?.users_without_listings ?? 0} registered members with 0 items.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-100">
                        {analytics?.summary?.users_without_listings ?? 0} Recipients
                      </span>
                    </div>

                    {/* Email Subject */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Email Subject Line *
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="e.g. List your first item on SWAP — Trade easily across UAE 📦"
                        maxLength={120}
                        className="w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    {/* Heading inside email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Email Header Title *
                      </label>
                      <input
                        type="text"
                        value={emailHeading}
                        onChange={(e) => setEmailHeading(e.target.value)}
                        placeholder="e.g. Turn your unused items into something you love"
                        maxLength={120}
                        className="w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    {/* Email Message */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Email Body Text *
                      </label>
                      <textarea
                        rows={5}
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Write your email body..."
                        maxLength={3000}
                        className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={emailButtonText}
                          onChange={(e) => setEmailButtonText(e.target.value)}
                          placeholder="e.g. List an Item Now"
                          className="w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Button Target URL
                        </label>
                        <input
                          type="text"
                          value={emailButtonLink}
                          onChange={(e) => setEmailButtonLink(e.target.value)}
                          placeholder="e.g. /my-listings?add=true"
                          className="w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-primary">Live Email Preview</p>
                      <div className="rounded-2xl border border-border bg-white p-5 text-left text-neutral-900 shadow-sm max-w-md mx-auto">
                        <div className="text-center mb-3">
                          <span className="text-2xl">📦</span>
                          <h3 className="font-display text-lg font-black text-foreground mt-1">
                            {emailHeading || "Email Heading"}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Hi <strong>@username</strong>,</p>
                        <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80 mb-4">
                          {emailMessage}
                        </p>
                        <div className="text-center">
                          <span className="inline-block rounded-full bg-[#ff8845] px-6 py-2.5 text-xs font-bold text-white shadow-md uppercase tracking-wider">
                            {emailButtonText || "List an Item Now"} →
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Send this email campaign to ${analytics?.summary?.users_without_listings ?? 0} members without listings?`,
                            )
                          ) {
                            sendEmailMut.mutate();
                          }
                        }}
                        disabled={
                          sendEmailMut.isPending ||
                          !emailSubject.trim() ||
                          !emailHeading.trim() ||
                          !emailMessage.trim() ||
                          (analytics?.summary?.users_without_listings ?? 0) === 0
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-90 transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        <Mail className="h-4 w-4" />
                        {sendEmailMut.isPending
                          ? "Sending Email Campaign…"
                          : `Send Email to ${analytics?.summary?.users_without_listings ?? 0} Members`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "flagged" && (
              <div className="space-y-3">
                {(flagged ?? []).length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground">
                    Nothing flagged.
                  </div>
                ) : (
                  (flagged ?? []).map((l: any) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setOpenId(l.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-card p-4 text-left hover:border-destructive transition"
                    >
                      <div
                        className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradientForId(l.id)} text-primary/40`}
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

            {tab === "withheld" && (
              <div className="space-y-3">
                {(withheld ?? []).length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground">
                    No listings awaiting review.
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
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{l.description}</p>
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

            {tab === "banned" && (
              <div className="space-y-3">
                {(banned ?? []).length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground">
                    No banned members.
                  </div>
                ) : (
                  (banned ?? []).map((b: any) => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-destructive/30 bg-card p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-lg font-bold truncate">@{b.profile?.username ?? "unknown"}</p>
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

            {tab === "inquiries" && (
              <div className="space-y-3">
                {(inquiries ?? []).length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-primary/30 p-8 text-center text-muted-foreground">
                    No inquiries yet.
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
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted-foreground/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading || !listing ? (
          <div className="p-10 text-center text-muted-foreground">Loading listing…</div>
        ) : (
          <div className="p-6 space-y-6">
            <div
              className={`relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br ${gradientForId(listing.id)}`}
            >
              {listing.image_urls && listing.image_urls.length > 0 ? (
                <img
                  src={listing.image_urls[0]}
                  alt={listing.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <Package className="h-24 w-24 text-primary/40" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase text-primary shadow">
                {listing.status}
              </div>
            </div>

            {listing.image_urls && listing.image_urls.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {listing.image_urls.slice(1).map((u: string, i: number) => (
                  <img key={i} src={u} alt="" className="aspect-square rounded-lg object-cover" />
                ))}
              </div>
            )}

            <div>
              <h2 className="font-display text-3xl font-black">{listing.title}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {listing.location}
                </span>
                <span>· {listing.category}</span>
                <span>· {listing.condition}</span>
                <span>· by @{listing.owner?.username}</span>
                <span>· {timeAgo(listing.created_at)}</span>
              </div>
              {listing.description && (
                <p className="mt-3 whitespace-pre-wrap text-foreground/80">{listing.description}</p>
              )}
              {listing.looking_for && (
                <div className="mt-3 rounded-2xl border-2 border-primary/20 bg-primary-soft p-3 text-sm">
                  <span className="font-bold uppercase text-primary text-xs">Looking for: </span>
                  {listing.looking_for}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-display text-lg font-black mb-2">Reports ({flags.length})</h3>
              <ul className="space-y-2">
                {flags.map((f: any) => (
                  <li key={f.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      @{f.reporter?.username ?? "unknown"} · {timeAgo(f.created_at)}
                    </p>
                    <p className="text-sm mt-1">{f.reason}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <button
                onClick={onClose}
                className="rounded-full border-2 border-primary/30 px-5 py-2 text-sm font-bold text-primary hover:bg-primary-soft"
              >
                Close
              </button>
              {listing.status !== "removed" && (
                <button
                  onClick={() => {
                    if (confirm("Remove this listing?")) onRemove();
                  }}
                  disabled={removing}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-5 py-2 text-sm font-bold uppercase hover:opacity-90 disabled:opacity-50"
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
          className="mt-2 text-xs font-bold uppercase text-primary hover:underline"
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
        className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={() => mut.mutate()}
        disabled={!text.trim() || mut.isPending}
        className="mt-2 rounded-full bg-gradient-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-50"
      >
        {mut.isPending ? "Sending…" : "Send reply"}
      </button>
    </div>
  );
}
