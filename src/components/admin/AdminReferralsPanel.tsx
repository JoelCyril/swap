import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminReferralsLeaderboard } from "@/lib/referrals.functions";
import { timeAgo } from "@/lib/db-types";
import {
  Gift,
  Users,
  Trophy,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Flame,
  Award,
  Clock,
  TrendingUp,
  Search,
} from "lucide-react";

export function AdminReferralsPanel() {
  const qc = useQueryClient();
  const getLeaderboard = useServerFn(getAdminReferralsLeaderboard);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-referrals-leaderboard"],
    queryFn: () => getLeaderboard(),
    staleTime: 5 * 60 * 1000, // 5 min cache - zero polling
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["admin-referrals-leaderboard"] });
    setIsRefreshing(false);
  };

  const totalReferrals = data?.totalReferrals ?? 0;
  const totalActive = data?.totalActive ?? 0;
  const activeRate = data?.activeRate ?? 0;
  const leaderboard = data?.leaderboard ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const topReferrer = leaderboard[0];

  const filteredLeaderboard = leaderboard.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.username.toLowerCase().includes(q) ||
      item.display_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <Gift className="h-7 w-7 text-primary" />
            Referrals & Leaderboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track user invitations, monitor who brings in the most members, and analyze community growth.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Referrals */}
        <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Total Referrals
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-4xl font-black text-foreground">
            {isLoading ? "…" : totalReferrals}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total accounts signed up via referral links
          </p>
        </div>

        {/* Active Traders Rate */}
        <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Active Trader Rate
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-4xl font-black text-foreground">
            {isLoading ? "…" : `${activeRate}%`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalActive} referred users listed items or traded
          </p>
        </div>

        {/* Top Referrer */}
        <div className="rounded-3xl border-2 border-amber-500/30 bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Trophy className="h-4 w-4" /> Top Ambassador
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          {topReferrer ? (
            <div className="mt-3 flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center overflow-hidden rounded-full font-bold text-white text-base shrink-0"
                style={{ backgroundColor: topReferrer.avatar_color || "#f59e0b" }}
              >
                {topReferrer.avatar_url ? (
                  <img src={topReferrer.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (topReferrer.display_name || topReferrer.username || "U")[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black text-foreground">
                  @{topReferrer.username}
                </p>
                <p className="text-xs font-bold text-primary">
                  {topReferrer.totalReferrals} invites ({topReferrer.activeCount} active)
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              {isLoading ? "Loading…" : "No referrals yet"}
            </p>
          )}
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-black text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Community Referrers Leaderboard
            </h3>
            <p className="text-xs text-muted-foreground">
              Ranked by total invited members who successfully joined SWAP
            </p>
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search referrers…"
              className="w-full rounded-full border border-border bg-muted/40 pl-9 pr-3 py-1.5 text-xs text-foreground outline-none focus:border-primary transition"
            />
          </div>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm font-semibold text-muted-foreground animate-pulse">
            Loading leaderboard data…
          </div>
        )}

        {!isLoading && filteredLeaderboard.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <Gift className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">No referrers found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? "No users match your search query."
                : "When users start inviting friends using ?ref=username, they will be ranked on this leaderboard!"}
            </p>
          </div>
        )}

        {!isLoading && filteredLeaderboard.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pl-2 w-16">Rank</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3 text-center">Total Invites</th>
                  <th className="pb-3 text-center">Active Traders</th>
                  <th className="pb-3 text-center">Conversion</th>
                  <th className="pb-3 text-right pr-2">Latest Referral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLeaderboard.map((item) => {
                  const conversion =
                    item.totalReferrals > 0
                      ? Math.round((item.activeCount / item.totalReferrals) * 100)
                      : 0;

                  return (
                    <tr key={item.userId} className="hover:bg-muted/30 transition-colors">
                      {/* Rank */}
                      <td className="py-3.5 pl-2 font-display font-black">
                        {item.rank === 1 && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-600 font-black text-xs">
                            🥇 1
                          </span>
                        )}
                        {item.rank === 2 && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-300/30 text-slate-700 dark:text-slate-200 font-black text-xs">
                            🥈 2
                          </span>
                        )}
                        {item.rank === 3 && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-300 font-black text-xs">
                            🥉 3
                          </span>
                        )}
                        {item.rank > 3 && (
                          <span className="text-muted-foreground font-mono pl-1">
                            #{item.rank}
                          </span>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="grid h-8 w-8 place-items-center overflow-hidden rounded-full font-bold text-white text-xs shrink-0"
                            style={{ backgroundColor: item.avatar_color || "#f97316" }}
                          >
                            {item.avatar_url ? (
                              <img src={item.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (item.display_name || item.username || "U")[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to="/profile/$username"
                              params={{ username: item.username }}
                              className="font-bold text-foreground hover:text-primary transition truncate block"
                            >
                              @{item.username}
                            </Link>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {item.display_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 font-display font-black text-xs text-primary">
                          {item.totalReferrals}
                        </span>
                      </td>

                      {/* Active */}
                      <td className="py-3.5 text-center font-bold text-foreground">
                        {item.activeCount}
                      </td>

                      {/* Conversion */}
                      <td className="py-3.5 text-center">
                        <span
                          className={`font-mono text-xs font-bold ${
                            conversion >= 50
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conversion}%
                        </span>
                      </td>

                      {/* Latest */}
                      <td className="py-3.5 text-right pr-2 text-[11px] text-muted-foreground">
                        {timeAgo(item.latestReferralAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-black text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Referral Signups
              </h3>
              <p className="text-xs text-muted-foreground">
                Live stream of the latest community invitations
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Latest {recentActivity.length}
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {recentActivity.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile/$username"
                    params={{ username: act.referrerUsername }}
                    className="font-bold text-foreground hover:text-primary transition"
                  >
                    @{act.referrerUsername}
                  </Link>
                  <span className="text-muted-foreground">invited</span>
                  <Link
                    to="/profile/$username"
                    params={{ username: act.joinedUsername }}
                    className="font-bold text-primary hover:underline"
                  >
                    @{act.joinedUsername}
                  </Link>
                  {act.isActive && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {timeAgo(act.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
