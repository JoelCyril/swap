import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { timeAgo, gradientForId, handle } from "@/lib/db-types";

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  location: string;
  emirate: string | null;
  created_at: string;
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
};

type AnalyticsData = {
  summary: {
    total_users: number;
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
  emirate_breakdown: Record<string, { users: number; listings: number }>;
  category_breakdown: Record<string, number>;
};

type MemberFilter = "all" | "with_listings" | "no_listings" | "with_trades" | "with_inventory";
type SortField = "newest" | "listings" | "trades" | "inventory";

export function AnalyticsPanel({ data, isLoading }: { data: AnalyticsData | undefined; isLoading: boolean }) {
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("newest");

  const summary = data?.summary;
  const rawUsers = data?.users ?? [];

  // Filter & Search
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawUsers
      .filter((u) => {
        // Tab Filter
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Members */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Members</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-foreground">{summary.total_users}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Registered accounts</p>
        </div>

        {/* Members With Listings */}
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
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
        </div>

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
        </div>

        {/* Completed Trades */}
        <div className="rounded-2xl border-2 border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Swaps Done
            </span>
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-blue-800 dark:text-blue-300">
            {summary.completed_swaps}
          </p>
          <p className="text-[11px] text-blue-600/90 mt-0.5">{summary.users_with_trades} traders active</p>
        </div>

        {/* Marketplace Listings */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Listings</span>
            <Package className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-foreground">{summary.active_listings}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active on marketplace</p>
        </div>

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
                      {user.has_completed_trade && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400">
                          {user.completed_trades} Trade{user.completed_trades > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground/70" /> {user.location} · Joined{" "}
                      {timeAgo(user.created_at)}
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
    </div>
  );
}
