import { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminMarkTradeCompleted } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Package,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Search,
  MapPin,
  ExternalLink,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Mail,
  X,
  BarChart3,
  Activity,
  Send,
} from "lucide-react";
import { timeAgo, gradientForId, handle } from "@/lib/db-types";

export type DailyGrowthPoint = {
  date: string;
  label: string;
  users_joined: number;
  cumulative_users: number;
  listings_created: number;
  cumulative_listings: number;
  trades_completed: number;
  cumulative_trades: number;
};

export type TradeItem = {
  id: string;
  status: "accepted" | "completed" | string;
  created_at: string;
  updated_at: string;
  listing_id: string;
  listing_title: string;
  listing_image: string | null;
  from_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    avatar_color: string | null;
    has_confirmed_complete: boolean;
    has_confirmed_received: boolean;
  };
  to_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    avatar_color: string | null;
    has_confirmed_complete: boolean;
    has_confirmed_received: boolean;
  };
  complete_count: number;
  received_count: number;
};

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  location: string;
  emirate: string | null;
  created_at: string;
  last_active_at?: string | null;
  is_active_today?: boolean;
  is_active_yesterday?: boolean;
  is_active_24h?: boolean;
  is_active_7d?: boolean;
  is_active_30d?: boolean;
  total_listings: number;
  active_listings: number;
  inventory_items: number;
  has_listings: boolean;
  has_inventory: boolean;
  completed_trades: number;
  total_offers: number;
  has_completed_trade: boolean;
  last_listing_at: string | null;
  last_trade_at: string | null;
  last_email_sent_at: string | null;
};

type AnalyticsData = {
  summary: {
    total_users: number;
    active_users_today?: number;
    active_users_yesterday?: number;
    active_users_24h?: number;
    active_users_7d?: number;
    active_users_30d?: number;
    users_with_listings: number;
    users_without_listings: number;
    conversion_rate: number;
    active_listings: number;
    total_listings: number;
    total_inventory_items: number;
    total_offers: number;
    completed_swaps: number;
    accepted_offers: number;
    users_with_trades: number;
  };
  users: UserRow[];
  trades?: TradeItem[];
  daily_growth?: DailyGrowthPoint[];
  emirate_breakdown: Record<string, { users: number; listings: number }>;
  category_breakdown: Record<string, number>;
};

type MemberFilter = "all" | "active" | "active_today" | "active_yesterday" | "with_listings" | "no_listings" | "with_trades" | "with_inventory";
type SortField = "newest" | "active" | "listings" | "trades" | "inventory";

export function AnalyticsPanel({
  data,
  isLoading,
  onEmailNoListings,
  onSendUserEmail,
  onMessageUser,
  sendingUserId,
}: {
  data: AnalyticsData | undefined;
  isLoading: boolean;
  onEmailNoListings?: () => void;
  onSendUserEmail?: (user: UserRow) => void;
  onMessageUser?: (user: UserRow) => void;
  sendingUserId?: string | null;
}) {
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("newest");
  const [tradesModalOpen, setTradesModalOpen] = useState(false);
  const [tradesFilter, setTradesFilter] = useState<"all" | "completed" | "accepted">("all");
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState<"users" | "listings" | "trades">("users");

  const qc = useQueryClient();
  const markCompleteFn = useServerFn(adminMarkTradeCompleted);
  const completeTradeMut = useMutation({
    mutationFn: (offerId: string) => markCompleteFn({ data: { offerId } }),
    onSuccess: (res) => {
      toast.success(res.message || "Trade marked as completed!");
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to mark trade as completed"),
  });

  const summary = data?.summary;
  const rawUsers = data?.users ?? [];
  const rawTrades = data?.trades ?? [];

  const filteredTrades = useMemo(() => {
    return rawTrades.filter((t) => {
      if (tradesFilter === "completed") return t.status === "completed";
      if (tradesFilter === "accepted") return t.status === "accepted";
      return true;
    });
  }, [rawTrades, tradesFilter]);

  const rawTimeline = useMemo<DailyGrowthPoint[]>(() => {
    if (data?.daily_growth && data.daily_growth.length > 0) {
      return data.daily_growth;
    }
    const userMap = new Map<string, number>();
    for (const u of rawUsers) {
      const d = u.created_at ? u.created_at.slice(0, 10) : null;
      if (d) userMap.set(d, (userMap.get(d) || 0) + 1);
    }
    const dates = Array.from(userMap.keys()).sort();
    let cum = 0;
    return dates.map((date) => {
      const count = userMap.get(date) || 0;
      cum += count;
      const d = new Date(`${date}T12:00:00Z`);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date,
        label,
        users_joined: count,
        cumulative_users: cum,
        listings_created: 0,
        cumulative_listings: 0,
        trades_completed: 0,
        cumulative_trades: 0,
      };
    });
  }, [data?.daily_growth, rawUsers]);

  // Filter & Search
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawUsers
      .filter((u) => {
        // Tab Filter
        if (filter === "active" && !u.is_active_7d) return false;
        if (filter === "active_today" && !u.is_active_today) return false;
        if (filter === "active_yesterday" && !u.is_active_yesterday) return false;
        if (filter === "with_listings" && !u.has_listings) return false;
        if (filter === "no_listings" && u.has_listings) return false;
        if (filter === "with_trades" && !u.has_completed_trade) return false;
        if (filter === "with_inventory" && !u.has_inventory) return false;

        // Search Filter
        if (q) {
          const matchUsername = u.username.toLowerCase().includes(q);
          const matchName = u.display_name.toLowerCase().includes(q);
          const matchLoc = u.location.toLowerCase().includes(q) || (u.emirate ?? "").toLowerCase().includes(q);
          if (!matchUsername && !matchName && !matchLoc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "active") {
          const aTime = a.last_active_at ? new Date(a.last_active_at).getTime() : new Date(a.created_at).getTime();
          const bTime = b.last_active_at ? new Date(b.last_active_at).getTime() : new Date(b.created_at).getTime();
          return bTime - aTime;
        }
        if (sort === "listings") return b.total_listings - a.total_listings;
        if (sort === "trades") return b.completed_trades - a.completed_trades;
        if (sort === "inventory") return b.inventory_items - a.inventory_items;
        // Default: newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rawUsers, filter, search, sort]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
        <p className="text-sm font-semibold">Loading moderator analytics…</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-primary/30 p-10 text-center text-muted-foreground">
        No analytics data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {/* Total Members */}
        <button
          type="button"
          onClick={() => {
            setChartMetric("users");
            setChartModalOpen(true);
          }}
          className="group text-left rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
              Total Members
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary group-hover:scale-110 transition-transform">
              <span>Graph</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-foreground">{summary.total_users}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Click for join trend graph ↗</p>
        </button>

        {/* Active Users */}
        <button
          type="button"
          onClick={() => {
            setFilter(filter === "active" ? "all" : "active");
          }}
          className="group text-left rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm hover:border-emerald-500/60 hover:bg-emerald-500/15 hover:shadow-md transition-all cursor-pointer relative overflow-hidden focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active Users
            </span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {summary.active_users_7d ?? 0}
          </p>
          <p className="text-[11px] font-bold text-emerald-600/90 mt-0.5">
            {summary.active_users_today ?? 0} active today ({summary.active_users_yesterday ?? 0} yesterday)
          </p>
        </button>

        {/* Members With Listings */}
        <button
          type="button"
          onClick={() => {
            setFilter(filter === "with_listings" ? "all" : "with_listings");
          }}
          className="group text-left rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-md transition-all cursor-pointer relative overflow-hidden focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              With Listings
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {summary.users_with_listings}
          </p>
          <p className="text-[11px] font-bold text-emerald-600/90 mt-0.5">{summary.conversion_rate}% lister rate</p>
        </button>

        {/* 0 Listings (Lurkers) */}
        <div className="rounded-2xl border-2 border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              No Listings
            </span>
            <UserX className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-amber-800 dark:text-amber-300">
            {summary.users_without_listings}
          </p>
          <p className="text-[11px] font-bold text-amber-600/90 mt-0.5">Accounts with 0 items</p>
          {onEmailNoListings && summary.users_without_listings > 0 && (
            <button
              type="button"
              onClick={onEmailNoListings}
              className="mt-2.5 w-full rounded-xl border border-amber-500/30 bg-amber-500/15 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 transition cursor-pointer"
            >
              ✉️ Email Campaign
            </button>
          )}
        </div>

        {/* Completed Trades */}
        <div
          onClick={() => setTradesModalOpen(true)}
          className="group text-left rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-4 shadow-sm hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-md transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Swaps Done
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChartMetric("trades");
                  setChartModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 hover:bg-blue-500/35 px-1.5 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-300 transition cursor-pointer"
                title="View Swaps Growth Graph"
              >
                <span>Graph</span>
                <TrendingUp className="h-3 w-3" />
              </button>
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-black text-blue-800 dark:text-blue-300">
              {summary.completed_swaps}
            </p>
            {summary.accepted_offers > 0 && (
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-300">
                +{summary.accepted_offers} in progress
              </span>
            )}
          </div>
          <p className="text-[11px] text-blue-600/90 mt-0.5 font-medium">
            {summary.users_with_trades} traders active • Click to inspect ↗
          </p>
        </div>

        {/* Marketplace Listings */}
        <button
          type="button"
          onClick={() => {
            setChartMetric("listings");
            setChartModalOpen(true);
          }}
          className="group text-left rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
              Listings
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary group-hover:scale-110 transition-transform">
              <span>Graph</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-foreground">{summary.active_listings}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Click for activity graph ↗</p>
        </button>

        {/* Total Inventory Items */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inventory</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-foreground">{summary.total_inventory_items}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total items saved</p>
        </div>
      </div>

      {/* EMIRATES & CATEGORIES SNAPSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emirate Distribution */}
        <div className="rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Members by Emirate
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(data?.emirate_breakdown ?? {}).map(([em, stats]) => (
              <div
                key={em}
                className="flex items-center gap-2 rounded-full border border-primary/20 bg-muted/40 px-3 py-1 text-xs"
              >
                <span className="font-bold text-foreground">{em}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary text-[10px]">
                  {stats.users} members · {stats.listings} items
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Listed Categories
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(data?.category_breakdown ?? {}).map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-muted/40 px-3 py-1 text-xs"
              >
                <span className="font-bold text-foreground">{cat}</span>
                <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-black text-primary">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MEMBER EXPLORER TABLE */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-5 sm:p-6 shadow-card">
        {/* Explorer Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <h2 className="font-display text-xl font-black text-foreground">Member Activity Explorer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed tracking of who has listed, who has done trades, and who has 0 listings.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold uppercase text-muted-foreground">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortField)}
              className="rounded-full border border-primary/20 bg-card px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
            >
              <option value="newest">Newest Joined</option>
              <option value="active">Most Recently Active</option>
              <option value="listings">Most Listings</option>
              <option value="trades">Most Trades Done</option>
              <option value="inventory">Most Inventory</option>
            </select>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["all", `All Members (${rawUsers.length})`],
              ["active_today", `🟢 Active Today (${summary.active_users_today ?? 0})`],
              ["active_yesterday", `Active Yesterday (${summary.active_users_yesterday ?? 0})`],
              ["active", `⚡ Active This Week (${summary.active_users_7d ?? 0})`],
              ["with_listings", `📦 Has Listings (${summary.users_with_listings})`],
              ["no_listings", `🆕 0 Listings Yet (${summary.users_without_listings})`],
              ["with_trades", `🤝 Completed Trades (${summary.users_with_trades})`],
              ["with_inventory", `🎒 Has Inventory (${rawUsers.filter((u) => u.has_inventory).length})`],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k as MemberFilter)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  filter === k
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or name…"
              className="w-full rounded-full border border-primary/20 bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Member Cards List */}
        <div className="mt-5 space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-primary/20 p-8 text-center text-muted-foreground text-sm">
              No members match your current filter and search query.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-3.5 hover:border-primary/40 hover:bg-background transition sm:flex-row sm:items-center sm:justify-between"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="h-11 w-11 rounded-full object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-sm"
                      style={{ backgroundColor: user.avatar_color || "#ea580c" }}
                    >
                      {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground truncate">{user.display_name}</p>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                      {user.is_active_today ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active today
                        </span>
                      ) : user.is_active_yesterday ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Active yesterday
                        </span>
                      ) : user.is_active_7d ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Active {timeAgo(user.last_active_at || user.created_at)}
                        </span>
                      ) : null}
                      {user.has_completed_trade && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400">
                          {user.completed_trades} Trade{user.completed_trades > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground/70" /> {user.location} · Joined{" "}
                      {timeAgo(user.created_at)}
                      {user.last_active_at && !user.is_active_today && !user.is_active_yesterday && (
                        <span> · Last active {timeAgo(user.last_active_at)}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Stats & Link */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                  {/* Listings Badge */}
                  {user.has_listings ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <Package className="h-3 w-3" /> {user.total_listings} listing{user.total_listings > 1 ? "s" : ""} (
                      {user.active_listings} active)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      <UserX className="h-3 w-3" /> 0 listings
                    </span>
                  )}

                  {/* Inventory Count */}
                  <span className="text-xs text-muted-foreground font-medium hidden md:inline">
                    {user.inventory_items} item{user.inventory_items === 1 ? "" : "s"} in inventory
                  </span>

                  {/* 7-Day Cooldown Nudge Email Button */}
                  {(() => {
                    const lastSent = user.last_email_sent_at ? new Date(user.last_email_sent_at).getTime() : 0;
                    const diffMs = Date.now() - lastSent;
                    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                    const inCooldown = lastSent > 0 && diffMs < sevenDaysMs;
                    const daysLeft = Math.ceil((sevenDaysMs - diffMs) / (24 * 60 * 60 * 1000));

                    if (inCooldown) {
                      return (
                        <button
                          type="button"
                          disabled
                          title={`Email sent ${timeAgo(user.last_email_sent_at!)}. Cooldown active for ${daysLeft} more day(s).`}
                          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/70 px-3 py-1 text-xs font-bold text-muted-foreground cursor-not-allowed opacity-70"
                        >
                          <Mail className="h-3 w-3" /> Emailed ({daysLeft}d left)
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        disabled={sendingUserId === user.id}
                        onClick={() => onSendUserEmail?.(user)}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer active:scale-95 shadow-sm"
                      >
                        {sendingUserId === user.id ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Mail className="h-3 w-3" /> Nudge Email
                          </>
                        )}
                      </button>
                    );
                  })()}

                  {/* Message User Button */}
                  {onMessageUser && (
                    <button
                      type="button"
                      onClick={() => onMessageUser(user)}
                      title={`Send direct notification to @${user.username}`}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Send className="h-3 w-3" /> Message
                    </button>
                  )}

                  {/* Profile Link */}
                  <Link
                    to="/profile/$username"
                    params={{ username: user.username }}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* TRADES / SWAPS DONE MODAL */}
      {tradesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border-2 border-primary/30 bg-card p-6 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-600">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-foreground">
                    Swaps & Trades ({data?.trades?.length ?? 0})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {summary?.completed_swaps ?? 0} confirmed completed • {summary?.accepted_offers ?? 0} accepted & in-progress
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTradesModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 py-3 border-b border-border/60">
              <button
                type="button"
                onClick={() => setTradesFilter("all")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
                  tradesFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                All Trades ({data?.trades?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setTradesFilter("completed")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
                  tradesFilter === "completed"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                Completed ({summary?.completed_swaps ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setTradesFilter("accepted")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
                  tradesFilter === "accepted"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                Accepted / In Progress ({summary?.accepted_offers ?? 0})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTradesModalOpen(false);
                  setChartMetric("trades");
                  setChartModalOpen(true);
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 transition cursor-pointer"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Swaps Growth Graph 📈</span>
              </button>
            </div>

            {/* Trade Cards List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {filteredTrades.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  No trades found matching this filter.
                </div>
              ) : (
                filteredTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-background"
                  >
                    {/* Item and Traders */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {trade.listing_image ? (
                        <img
                          src={trade.listing_image}
                          alt={trade.listing_title}
                          className="h-14 w-14 rounded-xl object-cover border border-border/80 shrink-0"
                        />
                      ) : (
                        <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary font-black text-xs shrink-0">
                          SWAP
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          to="/listings/$id"
                          params={{ id: trade.listing_id }}
                          className="font-display text-sm font-black text-foreground hover:text-primary transition truncate block"
                        >
                          {trade.listing_title}
                        </Link>
                        {/* Traders */}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Link
                            to="/profile/$username"
                            params={{ username: trade.from_user.username }}
                            className="font-bold text-foreground hover:underline"
                          >
                            @{trade.from_user.username}
                          </Link>
                          <span className="text-muted-foreground/60">⇄</span>
                          <Link
                            to="/profile/$username"
                            params={{ username: trade.to_user.username }}
                            className="font-bold text-foreground hover:underline"
                          >
                            @{trade.to_user.username}
                          </Link>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground/80">
                          Started {timeAgo(trade.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col sm:items-end justify-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2">
                        {trade.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <Clock className="h-3.5 w-3.5" /> Accepted ({trade.complete_count}/2 confirmed)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to="/offers/$id"
                          params={{ id: trade.id }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-foreground px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View Trade
                        </Link>
                        {trade.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Mark this trade for "${trade.listing_title}" as completed?`)) {
                                completeTradeMut.mutate(trade.id);
                              }
                            }}
                            disabled={completeTradeMut.isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LINE / AREA GROWTH GRAPH MODAL */}
      <GrowthTrendsModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        data={rawTimeline}
        summary={summary}
        initialMetric={chartMetric}
      />
    </div>
  );
}

type GrowthMetric = "users" | "listings" | "trades";
type GrowthMode = "daily" | "cumulative";
type GrowthRange = "7" | "14" | "30" | "all";

function GrowthTrendsModal({
  open,
  onClose,
  data,
  summary,
  initialMetric = "users",
}: {
  open: boolean;
  onClose: () => void;
  data: DailyGrowthPoint[];
  summary: AnalyticsData["summary"] | undefined;
  initialMetric: GrowthMetric;
}) {
  const [metric, setMetric] = useState<GrowthMetric>(initialMetric);
  const [mode, setMode] = useState<GrowthMode>("daily");
  const [range, setRange] = useState<GrowthRange>("30");

  useEffect(() => {
    if (open) {
      setMetric(initialMetric);
    }
  }, [open, initialMetric]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (range === "7") return data.slice(-7);
    if (range === "14") return data.slice(-14);
    if (range === "30") return data.slice(-30);
    return data;
  }, [data, range]);

  const config = useMemo(() => {
    if (metric === "listings") {
      return {
        title: "Listings Activity & Growth",
        subtitle: "Items listed on the marketplace over time",
        dailyKey: "listings_created" as const,
        cumulativeKey: "cumulative_listings" as const,
        unit: "listings",
        allTimeCount: summary?.total_listings ?? 0,
        color: "#10b981",
        gradientId: "listingsGrad",
        badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      };
    }
    if (metric === "trades") {
      return {
        title: "Swaps Completed Growth",
        subtitle: "Successful trades completed between members over time",
        dailyKey: "trades_completed" as const,
        cumulativeKey: "cumulative_trades" as const,
        unit: "swaps",
        allTimeCount: summary?.completed_swaps ?? 0,
        color: "#3b82f6",
        gradientId: "tradesGrad",
        badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
      };
    }
    return {
      title: "Member Growth & Daily Signups",
      subtitle: "New members joining SwapUAE over time",
      dailyKey: "users_joined" as const,
      cumulativeKey: "cumulative_users" as const,
      unit: "members",
      allTimeCount: summary?.total_users ?? 0,
      color: "#8b5cf6",
      gradientId: "usersGrad",
      badgeBg: "bg-primary/10 text-primary border-primary/30",
    };
  }, [metric, summary]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalInPeriod: 0, peak: 0, peakDate: "—", avg: "0.0" };
    }
    let sum = 0;
    let max = 0;
    let maxDate = "—";
    for (const d of filteredData) {
      const val = d[config.dailyKey];
      sum += val;
      if (val > max) {
        max = val;
        maxDate = d.label;
      }
    }
    const avg = (sum / filteredData.length).toFixed(1);
    return {
      totalInPeriod: sum,
      peak: max,
      peakDate: maxDate,
      avg,
    };
  }, [filteredData, config.dailyKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-2xl overflow-y-auto text-card-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${config.badgeBg}`}>
                <TrendingUp className="h-3.5 w-3.5" />
                Growth & Activity Graph
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-foreground mt-2">
              {config.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {config.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Metric, Mode & Range Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-3">
          {/* Metric Selector Pills */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-muted/50 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setMetric("users")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                metric === "users"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👥 Members
            </button>
            <button
              type="button"
              onClick={() => setMetric("listings")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                metric === "listings"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📦 Listings
            </button>
            <button
              type="button"
              onClick={() => setMetric("trades")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                metric === "trades"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔄 Swaps
            </button>
          </div>

          {/* Mode Selector (Daily vs Cumulative) */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-muted/50 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setMode("daily")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                mode === "daily"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Amt vs Day Joined
            </button>
            <button
              type="button"
              onClick={() => setMode("cumulative")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                mode === "cumulative"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cumulative Total
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex items-center gap-1 rounded-2xl bg-muted/50 p-1 border border-border/60">
            {(["7", "14", "30", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer uppercase ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "all" ? "All Time" : `${r}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
          <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total In Period
            </span>
            <p className="mt-1 text-xl font-black font-display text-foreground">
              +{stats.totalInPeriod} <span className="text-xs font-normal text-muted-foreground">{config.unit}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Peak Day
            </span>
            <p className="mt-1 text-xl font-black font-display text-foreground">
              {stats.peak} <span className="text-xs font-normal text-muted-foreground">({stats.peakDate})</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Daily Average
            </span>
            <p className="mt-1 text-xl font-black font-display text-foreground">
              {stats.avg} <span className="text-xs font-normal text-muted-foreground">/ day</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              All-Time Total
            </span>
            <p className="mt-1 text-xl font-black font-display text-foreground">
              {config.allTimeCount} <span className="text-xs font-normal text-muted-foreground">{config.unit}</span>
            </p>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="rounded-2xl border border-border/80 bg-background/40 p-3 sm:p-4 my-2">
          {filteredData.length === 0 ? (
            <div className="py-24 text-center text-sm text-muted-foreground">
              No growth data available for this range.
            </div>
          ) : (
            <div className="h-[280px] sm:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis
                    dataKey="label"
                    stroke="currentColor"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ opacity: 0.3 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ opacity: 0.3 }}
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        metric={metric}
                        mode={mode}
                        color={config.color}
                        unit={config.unit}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={mode === "cumulative" ? config.cumulativeKey : config.dailyKey}
                    stroke={config.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${config.gradientId})`}
                    dot={{ r: 2.5, fill: config.color }}
                    activeDot={{ r: 5, fill: config.color, stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Daily Timeline Activity */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Activity Breakdown
            </span>
            <span className="text-[11px] text-muted-foreground">
              Showing days in selected period
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/60">
            {filteredData
              .slice()
              .reverse()
              .slice(0, 10)
              .map((point) => {
                const dailyVal = point[config.dailyKey];
                const cumVal = point[config.cumulativeKey];
                return (
                  <div
                    key={point.date}
                    className="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground text-[11px]">{point.date}</span>
                      <span className="font-bold text-foreground">{point.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-black px-2 py-0.5 rounded-md ${
                          dailyVal > 0
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        +{dailyVal} {config.unit}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        total: <strong className="text-foreground">{cumVal}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomChartTooltip({
  active,
  payload,
  metric,
  mode,
  color,
  unit,
}: any) {
  if (!active || !payload || !payload.length) return null;
  const dataPoint: DailyGrowthPoint = payload[0].payload;

  const dailyVal =
    metric === "listings"
      ? dataPoint.listings_created
      : metric === "trades"
      ? dataPoint.trades_completed
      : dataPoint.users_joined;

  const cumVal =
    metric === "listings"
      ? dataPoint.cumulative_listings
      : metric === "trades"
      ? dataPoint.cumulative_trades
      : dataPoint.cumulative_users;

  return (
    <div className="rounded-2xl border border-border/90 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-popover-foreground min-w-[160px]">
      <div className="text-[11px] font-bold text-muted-foreground">{dataPoint.date}</div>
      <div className="font-display text-sm font-black text-foreground mt-0.5">{dataPoint.label}</div>
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Amt on this day:</span>
          <span className="font-black" style={{ color }}>
            +{dailyVal} {unit}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Cumulative total:</span>
          <span className="font-black text-foreground">{cumVal} total</span>
        </div>
      </div>
    </div>
  );
}

