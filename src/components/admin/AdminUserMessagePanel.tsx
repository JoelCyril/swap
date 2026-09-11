import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminSendDirectNotification,
  adminListSentNotifications,
  adminSendNotification,
  adminEmailUsersWithoutListings,
} from "@/lib/admin.functions";
import { timeAgo } from "@/lib/db-types";
import {
  Send,
  Bell,
  Mail,
  Search,
  CheckCircle2,
  Clock,
  X,
  MessageSquare,
  ArrowRight,
  Radio,
  Users,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export interface UserOption {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string | null;
  avatar_color?: string | null;
  emirate?: string | null;
  location?: string | null;
  total_listings?: number;
  completed_trades?: number;
}

export type CommunicationMode = "direct" | "broadcast" | "email";

export interface AdminUserMessagePanelProps {
  users?: UserOption[];
  initialUser?: UserOption | null;
  initialMode?: CommunicationMode;
  summary?: {
    total_users?: number;
    users_without_listings?: number;
  };
  onModeChange?: (mode: CommunicationMode) => void;
  onClose?: () => void;
}

const NOTIF_PRESETS = [
  {
    icon: "💬",
    name: "General Notice",
    title: "Notice from SWAP Team",
    body: "Hi! We have an update regarding your account on SWAP. Please reach out to our team if you have any questions.",
    link: "/notifications",
  },
  {
    icon: "📦",
    name: "Listing Action",
    title: "Update regarding your listed item",
    body: "Hi! A moderator reviewed your listing. Please verify your item photos, category, and details so interested traders can make offers.",
    link: "/my-listings",
  },
  {
    icon: "🤝",
    name: "Swap Follow-up",
    title: "Update regarding your swap trade",
    body: "Hi! We're checking in on your recent swap offer. Please coordinate your meetup or confirm completion once the handoff is done.",
    link: "/offers",
  },
  {
    icon: "🎉",
    name: "Milestone / Badge",
    title: "Congratulations from the SWAP Team! 🎉",
    body: "Thank you for being an active and trusted member of the UAE barter community. Keep up the awesome swaps!",
    link: "/profile",
  },
  {
    icon: "⚠️",
    name: "Guidelines Reminder",
    title: "Important community reminder",
    body: "Please remember that all items, chats, and trade handoffs must adhere to SWAP Community Guidelines and UAE safety standards.",
    link: "/terms",
  },
  {
    icon: "💡",
    name: "Add Items Tip",
    title: "Add items to your inventory to trade more!",
    body: "Tip: Having multiple active items in your inventory makes other SWAP members much more likely to trade with you!",
    link: "/your-items",
  },
];

const QUICK_LINKS = [
  { label: "My Listings", link: "/my-listings" },
  { label: "Active Offers", link: "/offers" },
  { label: "Browse Listings", link: "/listings" },
  { label: "Your Items", link: "/your-items" },
  { label: "Announcements", link: "/announcements" },
  { label: "Terms & Guidelines", link: "/terms" },
];

export function AdminUserMessagePanel({
  users = [],
  initialUser = null,
  initialMode = "direct",
  summary,
  onModeChange,
  onClose,
}: AdminUserMessagePanelProps) {
  const qc = useQueryClient();
  const sendDirectFn = useServerFn(adminSendDirectNotification);
  const sendBroadcastFn = useServerFn(adminSendNotification);
  const sendEmailCampaignFn = useServerFn(adminEmailUsersWithoutListings);
  const listSentFn = useServerFn(adminListSentNotifications);

  const [mode, setMode] = useState<CommunicationMode>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleModeSwitch = (newMode: CommunicationMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  // 1. Direct user state
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(initialUser);
  const [userQuery, setUserQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [directTitle, setDirectTitle] = useState("");
  const [directBody, setDirectBody] = useState("");
  const [directLink, setDirectLink] = useState("");
  const [directSendEmail, setDirectSendEmail] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
      setMode("direct");
    }
  }, [initialUser]);

  // 2. Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "no_listings">("all");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastLink, setBroadcastLink] = useState("");

  // 3. Email campaign state
  const [emailSubject, setEmailSubject] = useState(
    "List your first item on SWAP — Trade easily across UAE 📦",
  );
  const [emailHeading, setEmailHeading] = useState(
    "Turn your unused items into something you love",
  );
  const [emailMessage, setEmailMessage] = useState(
    "You joined SWAP, but haven't listed any items yet!\n\nListing takes less than 30 seconds with our instant camera auto-fill. Start swapping electronics, accessories, books, and more with UAE neighbours without spending money.",
  );
  const [emailButtonText, setEmailButtonText] = useState("List an Item Now");
  const [emailButtonLink, setEmailButtonLink] = useState("/my-listings?add=true");

  // Fetch history of sent notifications
  const { data: sentHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["admin-sent-notifications"],
    queryFn: () => listSentFn(),
  });

  // Filter users matching search query
  const filteredUsers = useMemo(() => {
    if (!userQuery.trim()) return users.slice(0, 8);
    const q = userQuery.toLowerCase().replace(/^@/, "");
    return users
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.display_name && u.display_name.toLowerCase().includes(q)),
      )
      .slice(0, 10);
  }, [users, userQuery]);

  // Direct Message Mutation
  const sendDirectMut = useMutation({
    mutationFn: () => {
      if (!selectedUser && !userQuery.trim()) {
        throw new Error("Please pick or type a recipient username");
      }
      return sendDirectFn({
        data: {
          userId: selectedUser?.id,
          username: !selectedUser ? userQuery.trim().replace(/^@/, "") : undefined,
          title: directTitle.trim(),
          body: directBody.trim(),
          link: directLink.trim() || undefined,
          sendEmail: directSendEmail,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-sent-notifications"] });
      setDirectTitle("");
      setDirectBody("");
      setDirectLink("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send notification"),
  });

  // Broadcast Mutation
  const sendBroadcastMut = useMutation({
    mutationFn: () =>
      sendBroadcastFn({
        data: {
          target: broadcastTarget,
          title: broadcastTitle.trim(),
          body: broadcastBody.trim(),
          link: broadcastLink.trim() || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-sent-notifications"] });
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastLink("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to broadcast notification"),
  });

  // Email Campaign Mutation
  const sendEmailCampaignMut = useMutation({
    mutationFn: () =>
      sendEmailCampaignFn({
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
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send email campaign"),
  });

  const handleSelectPreset = (preset: (typeof NOTIF_PRESETS)[0]) => {
    if (mode === "direct") {
      setDirectTitle(preset.title);
      setDirectBody(preset.body);
      setDirectLink(preset.link);
    } else if (mode === "broadcast") {
      setBroadcastTitle(preset.title);
      setBroadcastBody(preset.body);
      setBroadcastLink(preset.link);
    }
  };

  const handleSelectUser = (u: UserOption) => {
    setSelectedUser(u);
    setUserQuery("");
    setShowDropdown(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setUserQuery("");
  };

  const noListingsCount = summary?.users_without_listings ?? 0;
  const totalUsersCount = summary?.total_users ?? users.length;

  return (
    <div className="space-y-8">
      {/* Main Unified Communications Card */}
      <div className="rounded-3xl border-2 border-primary/25 bg-card p-6 sm:p-8 shadow-card space-y-6">
        {/* Symmetrical Header with Integrated Segmented Mode Control */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
              {mode === "direct" && <Send className="h-5 w-5" />}
              {mode === "broadcast" && <Radio className="h-5 w-5" />}
              {mode === "email" && <Mail className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-black text-foreground">
                  Notifications & Broadcast Hub
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {mode === "direct" && "Directly message an individual member with in-app notification & optional email."}
                {mode === "broadcast" && "Broadcast announcements directly to all members' notification inboxes."}
                {mode === "email" && "Send branded email campaigns to encourage members with 0 listings to post items."}
              </p>
            </div>
          </div>

          {/* Symmetrical 3-Channel Pill Switcher */}
          <div className="flex flex-wrap items-center rounded-2xl border border-border/90 bg-muted/40 p-1 self-start lg:self-center shadow-xs">
            <button
              type="button"
              onClick={() => handleModeSwitch("direct")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer select-none ${
                mode === "direct"
                  ? "bg-gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Direct Message</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch("broadcast")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer select-none ${
                mode === "broadcast"
                  ? "bg-gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Broadcast to All</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch("email")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer select-none ${
                mode === "email"
                  ? "bg-gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Campaign</span>
              {noListingsCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    mode === "email" ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
                  }`}
                >
                  {noListingsCount}
                </span>
              )}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-1 grid h-7 w-7 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/60 transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: DIRECT USER MESSAGE */}
        {/* ========================================================================= */}
        {mode === "direct" && (
          <div className="space-y-6">
            {/* 1. Recipient Member Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                1. Recipient Member *
              </label>

              {selectedUser ? (
                /* Selected User Card */
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-primary/40 bg-primary-soft/40 p-4 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.username}
                        className="h-12 w-12 rounded-full object-cover border-2 border-primary/30 shrink-0"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: selectedUser.avatar_color || "#ff8845" }}
                        className="grid h-12 w-12 place-items-center rounded-full font-display text-lg font-black text-white shrink-0 shadow-sm"
                      >
                        {(selectedUser.display_name || selectedUser.username || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display text-base font-black text-foreground truncate">
                          {selectedUser.display_name || selectedUser.username}
                        </p>
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                          @{selectedUser.username}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedUser.emirate || selectedUser.location || "UAE"}
                        {selectedUser.total_listings !== undefined &&
                          ` · ${selectedUser.total_listings} listing${selectedUser.total_listings === 1 ? "" : "s"}`}
                        {selectedUser.completed_trades !== undefined &&
                          ` · ${selectedUser.completed_trades} trade${selectedUser.completed_trades === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearUser}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Change Member
                  </button>
                </div>
              ) : (
                /* Search / Autocomplete Box */
                <div className="relative max-w-lg">
                  <div className="flex items-center gap-2.5 rounded-2xl border-2 border-primary/30 bg-muted/30 dark:bg-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition shadow-xs">
                    <Search className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground text-sm font-bold select-none">@</span>
                    <input
                      type="text"
                      data-keep-light
                      value={userQuery}
                      onFocus={() => setShowDropdown(true)}
                      onChange={(e) => {
                        setUserQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      placeholder="Type username or name (e.g. atul, ayesha, naira)..."
                      className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/70"
                    />
                    {userQuery && (
                      <button
                        type="button"
                        onClick={() => setUserQuery("")}
                        className="text-muted-foreground hover:text-foreground p-1 transition cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {showDropdown && filteredUsers.length > 0 && (
                    <div
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border-2 border-primary/30 bg-card p-1.5 shadow-xl divide-y divide-border/50"
                    >
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-primary/10 transition cursor-pointer"
                        >
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.username}
                              className="h-8 w-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              style={{ backgroundColor: u.avatar_color || "#ff8845" }}
                              className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white shrink-0"
                            >
                              {(u.display_name || u.username)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">
                              {u.display_name || u.username}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              @{u.username} {u.emirate ? `· ${u.emirate}` : ""}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-primary shrink-0">Select →</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick User Chips */}
                  {users.length > 0 && !selectedUser && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <span className="text-[11px] font-bold text-muted-foreground mr-1">Quick pick:</span>
                      {users.slice(0, 6).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-muted/40 px-2.5 py-1 text-[11px] font-bold text-foreground hover:border-primary hover:bg-primary/5 transition cursor-pointer"
                        >
                          <span>@{u.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-border/80">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                2. Quick Presets / Templates (Optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {NOTIF_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex flex-col items-start p-2.5 rounded-2xl border border-border bg-card/80 hover:border-primary/50 hover:bg-primary/5 text-left transition cursor-pointer group"
                  >
                    <span className="text-lg group-hover:scale-110 transition">{preset.icon}</span>
                    <span className="font-bold text-xs text-foreground mt-1 line-clamp-1">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Notification Content */}
            <div className="space-y-4 pt-2 border-t border-border/80">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                3. Notification Content *
              </label>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notification Title *
                  </span>
                  <span className="text-[11px] text-muted-foreground">{directTitle.length}/120</span>
                </div>
                <input
                  type="text"
                  value={directTitle}
                  onChange={(e) => setDirectTitle(e.target.value)}
                  placeholder="e.g. Notice from SWAP Moderation Team"
                  maxLength={120}
                  className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notification Message Body *
                  </span>
                  <span className="text-[11px] text-muted-foreground">{directBody.length}/2000</span>
                </div>
                <textarea
                  rows={4}
                  value={directBody}
                  onChange={(e) => setDirectBody(e.target.value)}
                  placeholder="Write the message the member will see in their notification center…"
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Action Link (Optional)
                </label>
                <input
                  type="text"
                  value={directLink}
                  onChange={(e) => setDirectLink(e.target.value)}
                  placeholder="e.g. /my-listings or /offers"
                  className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:border-primary transition"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">Insert link:</span>
                  {QUICK_LINKS.map((ql) => (
                    <button
                      key={ql.link}
                      type="button"
                      onClick={() => setDirectLink(ql.link)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                        directLink === ql.link
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {ql.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Delivery Channels
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-default">
                    <span className="grid h-5 w-5 place-items-center rounded bg-primary text-primary-foreground text-xs font-black">
                      ✓
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell className="h-3.5 w-3.5 text-primary" />
                      In-App Notification Bell (Always delivered)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={directSendEmail}
                      onChange={(e) => setDirectSendEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-primary/30 text-primary accent-primary cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-amber-500" />
                      Also send as direct email to member
                    </span>
                  </label>
                </div>
                {directSendEmail && (
                  <p className="text-[11px] text-muted-foreground">
                    An official email with this notification and action link will also be dispatched via Resend to the member's registered email address.
                  </p>
                )}
              </div>
            </div>

            {/* 4. Live Preview */}
            {(directTitle.trim() || directBody.trim()) && (
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                    Live Preview: Recipient's Notification Inbox
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Recipient: @{selectedUser?.username || userQuery.replace(/^@/, "") || "user"}
                  </span>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-sm max-w-xl">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-foreground">
                      {directTitle.trim() || "Notification Title"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                      {directBody.trim() || "Message body will appear here…"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Just now · SWAP Moderator
                      </span>
                      {directLink.trim() && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline">
                          Open {directLink} <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Dispatch Action */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => sendDirectMut.mutate()}
                disabled={
                  sendDirectMut.isPending ||
                  !directTitle.trim() ||
                  !directBody.trim() ||
                  (!selectedUser && !userQuery.trim())
                }
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-95 transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Send className="h-4 w-4" />
                {sendDirectMut.isPending
                  ? "Sending Notification…"
                  : `Send to @${selectedUser?.username || userQuery.replace(/^@/, "").trim() || "user"}`}
              </button>

              {(directTitle || directBody || directLink || selectedUser) && (
                <button
                  type="button"
                  onClick={() => {
                    setDirectTitle("");
                    setDirectBody("");
                    setDirectLink("");
                    setSelectedUser(null);
                    setUserQuery("");
                  }}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Clear Fields
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: BROADCAST ANNOUNCEMENT */}
        {/* ========================================================================= */}
        {mode === "broadcast" && (
          <div className="space-y-6">
            {/* 1. Audience Target */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                1. Target Audience *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => setBroadcastTarget("all")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition cursor-pointer ${
                    broadcastTarget === "all"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">
                      All Registered Members
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Broadcast to all {totalUsersCount} active users on SWAP
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBroadcastTarget("no_listings")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition cursor-pointer ${
                    broadcastTarget === "no_listings"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">
                      Members Without Listings
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target the {noListingsCount} users who have 0 listed items
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-border/80">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                2. Quick Presets / Templates (Optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {NOTIF_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex flex-col items-start p-2.5 rounded-2xl border border-border bg-card/80 hover:border-primary/50 hover:bg-primary/5 text-left transition cursor-pointer group"
                  >
                    <span className="text-lg group-hover:scale-110 transition">{preset.icon}</span>
                    <span className="font-bold text-xs text-foreground mt-1 line-clamp-1">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Broadcast Content */}
            <div className="space-y-4 pt-2 border-t border-border/80">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                3. Broadcast Content *
              </label>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Broadcast Title *
                  </span>
                  <span className="text-[11px] text-muted-foreground">{broadcastTitle.length}/120</span>
                </div>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Official Announcement: Ramadan Trading Specials"
                  maxLength={120}
                  className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Broadcast Message Body *
                  </span>
                  <span className="text-[11px] text-muted-foreground">{broadcastBody.length}/2000</span>
                </div>
                <textarea
                  rows={4}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Write the announcement message that will appear in users' notifications…"
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Action Link (Optional)
                </label>
                <input
                  type="text"
                  value={broadcastLink}
                  onChange={(e) => setBroadcastLink(e.target.value)}
                  placeholder="e.g. /announcements or /my-listings?add=true"
                  className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:border-primary transition"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">Insert link:</span>
                  {QUICK_LINKS.map((ql) => (
                    <button
                      key={ql.link}
                      type="button"
                      onClick={() => setBroadcastLink(ql.link)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                        broadcastLink === ql.link
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {ql.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Live Broadcast Preview */}
            {(broadcastTitle.trim() || broadcastBody.trim()) && (
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                    Live Broadcast Preview (Recipient Inbox)
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Target: {broadcastTarget === "all" ? "All Users" : `Users without listings (${noListingsCount})`}
                  </span>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-sm max-w-xl">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-foreground">
                      {broadcastTitle.trim() || "Broadcast Title"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                      {broadcastBody.trim() || "Announcement message will appear here…"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Just now · SWAP System Broadcast
                      </span>
                      {broadcastLink.trim() && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline">
                          Open {broadcastLink} <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Dispatch Action */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetMsg =
                    broadcastTarget === "all"
                      ? `Broadcast to ALL ${totalUsersCount} registered members?`
                      : `Broadcast to ${noListingsCount} members without listings?`;
                  if (confirm(targetMsg)) {
                    sendBroadcastMut.mutate();
                  }
                }}
                disabled={
                  sendBroadcastMut.isPending ||
                  !broadcastTitle.trim() ||
                  !broadcastBody.trim()
                }
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-95 transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Radio className="h-4 w-4" />
                {sendBroadcastMut.isPending
                  ? "Broadcasting Announcement…"
                  : broadcastTarget === "all"
                    ? `Broadcast to All Users (${totalUsersCount})`
                    : `Send to ${noListingsCount} Users Without Listings`}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: DIRECT EMAIL CAMPAIGN */}
        {/* ========================================================================= */}
        {mode === "email" && (
          <div className="space-y-6">
            {/* Target info card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Target: Registered members with 0 active listings
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official responsive branded email will be dispatched via Resend to encourage item listings.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-900 dark:text-amber-100 self-start sm:self-center">
                {noListingsCount} Recipients
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
                className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
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
                className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
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
                className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
              />
            </div>

            {/* Button Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={emailButtonText}
                  onChange={(e) => setEmailButtonText(e.target.value)}
                  placeholder="e.g. List an Item Now"
                  className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  CTA Button Target URL
                </label>
                <input
                  type="text"
                  value={emailButtonLink}
                  onChange={(e) => setEmailButtonLink(e.target.value)}
                  placeholder="e.g. /my-listings?add=true"
                  className="w-full rounded-2xl border-2 border-primary/20 bg-muted/20 dark:bg-muted/30 px-4 py-2 text-sm text-foreground outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {/* Live Branded Email Preview */}
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-primary">
                Live Branded Email Preview
              </p>
              <div className="rounded-2xl border border-border bg-card p-6 text-left text-foreground shadow-sm max-w-md mx-auto">
                <div className="text-center mb-4">
                  <span className="text-3xl">📦</span>
                  <h3 className="font-display text-lg font-black text-foreground mt-2">
                    {emailHeading || "Email Heading"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Hi <strong>@username</strong>,
                </p>
                <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80 mb-5">
                  {emailMessage}
                </p>
                <div className="text-center">
                  <span className="inline-block rounded-full bg-gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md uppercase tracking-wider">
                    {emailButtonText || "List an Item Now"} →
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatch Action */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Send this email campaign to ${noListingsCount} members without listings?`,
                    )
                  ) {
                    sendEmailCampaignMut.mutate();
                  }
                }}
                disabled={
                  sendEmailCampaignMut.isPending ||
                  !emailSubject.trim() ||
                  !emailHeading.trim() ||
                  !emailMessage.trim() ||
                  noListingsCount === 0
                }
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-90 transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Mail className="h-4 w-4" />
                {sendEmailCampaignMut.isPending
                  ? "Sending Email Campaign…"
                  : `Send Email to ${noListingsCount} Members`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Symmetrical History Section: Recent Sent Messages & Notifications */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-black text-foreground">
              Recent Sent Messages & Notifications ({sentHistory?.length ?? 0})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            Track deliveries & read receipts
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent mr-2" />
            <span className="text-xs">Loading sent notifications history…</span>
          </div>
        ) : (sentHistory ?? []).length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-card p-8 text-center text-xs text-muted-foreground">
            No direct notifications sent yet. Use the form above to send your first message to a user.
          </div>
        ) : (
          <div className="divide-y divide-border/60 max-h-[460px] overflow-y-auto pr-1">
            {sentHistory.map((item: any) => {
              const recipient = item.recipient;
              return (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-muted/30 p-2.5 rounded-2xl transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {recipient?.avatar_url ? (
                      <img
                        src={recipient.avatar_url}
                        alt={recipient.username}
                        className="h-9 w-9 rounded-full object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: recipient?.avatar_color || "#ff8845" }}
                        className="grid h-9 w-9 place-items-center rounded-full text-xs font-black text-white shrink-0"
                      >
                        {(recipient?.display_name || recipient?.username || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-foreground">
                          To: @{recipient?.username ?? "unknown"}
                        </span>
                        {item.read ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Clock className="h-3 w-3" /> Unread
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">· {timeAgo(item.created_at)}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground mt-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {item.body}
                      </p>
                      {item.link && (
                        <p className="text-[11px] text-primary mt-1 font-semibold">
                          Link: {item.link}
                        </p>
                      )}
                    </div>
                  </div>

                  {recipient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(recipient);
                        setMode("direct");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="self-start sm:self-center shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/10 transition cursor-pointer"
                    >
                      Message again
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export as AdminCommunicationsPanel alias
export { AdminUserMessagePanel as AdminCommunicationsPanel };
