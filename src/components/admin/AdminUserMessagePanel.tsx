import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminSendDirectNotification,
  adminListSentNotifications,
} from "@/lib/admin.functions";
import { timeAgo, handle } from "@/lib/db-types";
import {
  Send,
  Bell,
  Mail,
  Search,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  X,
  AlertCircle,
  MessageSquare,
  Package,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface UserOption {
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

interface AdminUserMessagePanelProps {
  users?: UserOption[];
  initialUser?: UserOption | null;
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
  { label: "Help & Inquiries", link: "/help" },
  { label: "Terms & Guidelines", link: "/terms" },
];

export function AdminUserMessagePanel({
  users = [],
  initialUser = null,
  onClose,
}: AdminUserMessagePanelProps) {
  const qc = useQueryClient();
  const sendFn = useServerFn(adminSendDirectNotification);
  const listSentFn = useServerFn(adminListSentNotifications);

  // Recipient state
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(initialUser);
  const [userQuery, setUserQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Message fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
    }
  }, [initialUser]);

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

  // Mutation to send notification
  const sendMut = useMutation({
    mutationFn: () => {
      if (!selectedUser && !userQuery.trim()) {
        throw new Error("Please pick or type a recipient username");
      }
      return sendFn({
        data: {
          userId: selectedUser?.id,
          username: !selectedUser ? userQuery.trim().replace(/^@/, "") : undefined,
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || undefined,
          sendEmail,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-sent-notifications"] });
      // Reset form but keep selected user for quick follow-up if desired
      setTitle("");
      setBody("");
      setLink("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send notification"),
  });

  const handleSelectPreset = (preset: (typeof NOTIF_PRESETS)[0]) => {
    setTitle(preset.title);
    setBody(preset.body);
    setLink(preset.link);
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

  return (
    <div className="space-y-8">
      {/* Main Card Container */}
      <div className="rounded-3xl border-2 border-primary/25 bg-card p-6 sm:p-8 shadow-card space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-foreground">
                Message a User
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Send a targeted direct notification (and optional email) to an individual member.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="self-end sm:self-center grid h-8 w-8 place-items-center rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* SECTION 1: Select Recipient */}
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
                <X className="h-3.5 w-3.5" /> Change User
              </button>
            </div>
          ) : (
            /* Search / Autocomplete Box */
            <div className="relative">
              <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/25 bg-card px-4 py-3 focus-within:border-primary focus-within:shadow-sm transition">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-sm font-bold">@</span>
                <input
                  type="text"
                  value={userQuery}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Type username or name (e.g. atul, ayesha, naira)..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                />
                {userQuery && (
                  <button
                    type="button"
                    onClick={() => setUserQuery("")}
                    className="text-muted-foreground hover:text-foreground"
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

        {/* SECTION 2: Quick Presets / Templates */}
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

        {/* SECTION 3: Message Content */}
        <div className="space-y-4 pt-2 border-t border-border/80">
          <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
            3. Notification Content *
          </label>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notification Title *
              </span>
              <span className="text-[11px] text-muted-foreground">{title.length}/120</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Notice from SWAP Moderation Team"
              maxLength={120}
              className="w-full rounded-2xl border-2 border-primary/20 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notification Message Body *
              </span>
              <span className="text-[11px] text-muted-foreground">{body.length}/2000</span>
            </div>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the message the member will see in their notification center…"
              maxLength={2000}
              className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition"
            />
          </div>

          {/* Action Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Action Link (Optional)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /my-listings or /offers"
              className="w-full rounded-2xl border-2 border-primary/20 bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-primary transition"
            />
            {/* Quick Route Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-muted-foreground mr-1">Insert link:</span>
              {QUICK_LINKS.map((ql) => (
                <button
                  key={ql.link}
                  type="button"
                  onClick={() => setLink(ql.link)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                    link === ql.link
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
              {/* In-App Always On */}
              <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-default">
                <span className="grid h-5 w-5 place-items-center rounded bg-primary text-primary-foreground text-xs font-black">
                  ✓
                </span>
                <span className="flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  In-App Notification Bell (Always delivered)
                </span>
              </label>

              {/* Optional Email */}
              <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-primary/30 text-primary accent-primary cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-amber-500" />
                  Also send as direct email to member
                </span>
              </label>
            </div>
            {sendEmail && (
              <p className="text-[11px] text-muted-foreground">
                An official email with this notification and action link will also be dispatched via Resend to the member's registered email address.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 4: Live Preview */}
        {(title.trim() || body.trim()) && (
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                Live Preview: Recipient's Notification Inbox
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">
                Recipient: @{selectedUser?.username || userQuery.replace(/^@/, "") || "user"}
              </span>
            </div>

            {/* Notification Bell Preview Card */}
            <div className="flex items-start gap-3.5 rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-sm max-w-xl">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">
                  {title.trim() || "Notification Title"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                  {body.trim() || "Message body will appear here…"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Just now · SWAP Moderator
                  </span>
                  {link.trim() && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline">
                      Open {link} <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Dispatch Action */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => sendMut.mutate()}
            disabled={
              sendMut.isPending ||
              !title.trim() ||
              !body.trim() ||
              (!selectedUser && !userQuery.trim())
            }
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-95 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Send className="h-4 w-4" />
            {sendMut.isPending
              ? "Sending Notification…"
              : `Send to @${selectedUser?.username || userQuery.replace(/^@/, "").trim() || "user"}`}
          </button>

          {(title || body || link || selectedUser) && (
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setBody("");
                setLink("");
                setSelectedUser(null);
                setUserQuery("");
              }}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* SECTION 6: Sent Messages History */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
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
