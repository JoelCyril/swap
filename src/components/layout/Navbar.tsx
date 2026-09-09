import { handle } from "@/lib/db-types";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, User, LogOut, ShieldCheck, Bell, Settings, Menu, X, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase, getStoredSessionSync } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications.functions";
import { listAnnouncements } from "@/lib/announcements.functions";
import { PendingOfferPopup } from "@/components/offers/PendingOfferPopup";
import { ThemeToggle } from "./ThemeToggle";

import { toast } from "sonner";
const logoUrl = "/swap-logo.png";

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(() => getStoredSessionSync());
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();
  const updateProfile = useServerFn(updateMyProfile);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("sb-") && e.key.endsWith("-auth-token")) {
        const sync = getStoredSessionSync();
        setSession(sync);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const getProfile = useServerFn(getMyProfile);
  const { data: me } = useQuery({
    queryKey: ["me", session?.user.id],
    queryFn: () => getProfile(),
    enabled: !!session,
  });

  const isAdmin = me?.roles?.includes("admin");

  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const [bellOpen, setBellOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const { data: notifs } = useQuery({
    queryKey: ["notifications", session?.user.id],
    queryFn: () => listNotifs(),
    enabled: !!session,
    refetchInterval: 30000,
  });
  const unreadCount = (notifs ?? []).filter((n: any) => !n.read).length;

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`notif-${session.user.id}`)
      .on(
        "postgres_changes",
        // Bulk read updates emit one event per notification. Listening only for new
        // notifications avoids turning a single "mark all" click into dozens of
        // refetches.
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, queryClient]);

  const annFn = useServerFn(listAnnouncements);
  const { data: announcements } = useQuery({
    queryKey: ["announcements-nav"],
    queryFn: () => annFn(),
    refetchInterval: 60000,
  });
  const [annSeen, setAnnSeen] = useState(0);
  useEffect(() => {
    const read = () => setAnnSeen(Number(localStorage.getItem("announcements-seen-at") ?? 0));
    read();
    window.addEventListener("announcements-seen", read);
    return () => window.removeEventListener("announcements-seen", read);
  }, []);
  const newAnnouncements = (announcements ?? []).filter(
    (a: any) => new Date(a.created_at).getTime() > annSeen,
  ).length;

  const links = session
    ? ([
        { to: "/listings", label: "Browse" },
        { to: "/wanted", label: "Wanted" },
        { to: "/my-listings", label: "Inventory" },
        { to: "/favourites", label: "Saved" },
        { to: "/offers", label: "Offers" },
        { to: "/announcements", label: "Announcements" },
      ] as const)
    : ([
        { to: "/listings", label: "Browse" },
        { to: "/wanted", label: "Wanted" },
        { to: "/announcements", label: "Announcements" },
      ] as const);


  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate({ to: "/listings", replace: true });
  }

  async function handleMarkAllRead() {
    if (markingAllRead) return;

    setMarkingAllRead(true);
    queryClient.setQueriesData({ queryKey: ["notifications"] }, (current: any) =>
      Array.isArray(current) ? current.map((notification) => ({ ...notification, read: true })) : current,
    );

    try {
      await markAll();
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.error(error instanceof Error ? error.message : "Could not mark notifications as read");
    } finally {
      setMarkingAllRead(false);
    }
  }

  const avatarUrl = me?.profile?.avatar_url;


  return (
    <>
    <header className="sticky top-0 z-40 w-full max-w-full bg-gradient-primary text-primary-foreground shadow-glow dark:bg-none dark:bg-card/90 dark:backdrop-blur-md dark:border-b dark:border-border dark:text-foreground dark:shadow-sm transition-colors">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 px-3 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
        <button
          type="button"
          onClick={() => { setNavOpen((v) => !v); setMenuOpen(false); setBellOpen(false); }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 dark:bg-white/10 text-white dark:text-foreground transition hover:bg-white/25 dark:hover:bg-white/15 xl:hidden border border-transparent dark:border-white/10"
          aria-label="Menu"
          aria-expanded={navOpen}
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/listings" className="flex items-center gap-2 shrink-0 group">
          <img
            src={logoUrl}
            alt="SWAP"
            className="h-10 w-auto object-contain transition-transform group-hover:rotate-[-4deg] drop-shadow sm:h-14"
          />
        </Link>

        <nav className="hidden xl:flex shrink-0 items-center gap-1 text-sm font-semibold uppercase tracking-wider">
          {links.map((l) => {
            const active = pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative rounded-full px-4 py-2 transition-all ${
                  active
                    ? "bg-white/25 text-white dark:bg-primary/20 dark:text-primary shadow-inner dark:shadow-none"
                    : "opacity-80 hover:bg-white/15 hover:opacity-100 dark:opacity-90 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-white/10"
                }`}
              >
                {l.label}
                {l.to === "/announcements" && newAnnouncements > 0 && (
                  <span className="absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground shadow">
                    {newAnnouncements > 9 ? "9+" : newAnnouncements}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search bar (hidden on mobile, visible from sm up) */}
        <form
          className="relative ml-auto hidden w-full min-w-0 flex-1 sm:block sm:max-w-md lg:max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/listings", search: { q: query.trim() || undefined } });
          }}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60 dark:text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or people…"
            aria-label="Search items or people"
            className="w-full rounded-full border border-transparent dark:border-border/60 bg-white dark:bg-background/90 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-md outline-none ring-0 focus:ring-2 focus:ring-white/70 dark:focus:ring-primary/50 transition"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 shrink-0 sm:ml-0">
          {/* Theme Toggle Button */}
          <ThemeToggle className="bg-white/15 dark:bg-white/10 text-white dark:text-foreground hover:bg-white/25 dark:hover:bg-white/15 shrink-0 border border-transparent dark:border-white/10" />

          {session ? (
            <>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setBellOpen((v) => !v); setMenuOpen(false); }}
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 dark:bg-white/10 text-white dark:text-foreground hover:bg-white/25 dark:hover:bg-white/15 transition border border-transparent dark:border-white/10"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground px-1 shadow">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm max-h-[70vh] overflow-y-auto rounded-2xl border-2 border-primary/20 bg-card text-foreground shadow-card-hover sm:w-80">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <p className="text-sm font-bold">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={markingAllRead}
                      className="text-xs text-primary hover:underline disabled:cursor-wait disabled:opacity-60"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {(notifs ?? []).length === 0 ? (
                  <p className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {(notifs ?? []).map((n: any) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!n.read) {
                              await markRead({ data: { id: n.id } });
                              queryClient.invalidateQueries({ queryKey: ["notifications"] });
                            }
                            setBellOpen(false);
                            if (n.link) navigate({ to: n.link });
                          }}
                          className={`block w-full text-left px-4 py-3 hover:bg-primary-soft ${n.read ? "" : "bg-primary-soft/40"}`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{n.title}</p>
                              {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                              <p className="mt-1 text-[10px] text-muted-foreground uppercase">
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/notifications"
                  onClick={() => setBellOpen(false)}
                  className="block border-t border-border px-4 py-2 text-center text-xs font-bold text-primary hover:bg-primary-soft"
                >
                  View all
                </Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-primary shadow-md hover:scale-105 transition"
              style={{ backgroundColor: avatarUrl ? "transparent" : me?.profile?.avatar_color ?? "white" }}
              aria-label="Account menu"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black text-white drop-shadow">
                  {me?.profile?.display_name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                </span>
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border-2 border-primary/20 bg-card p-2 text-foreground shadow-card-hover">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-bold truncate">{handle(me?.profile)}</p>
                </div>
                {me?.profile && (
                  <Link
                    to="/profile/$username"
                    params={{ username: me.profile.username }}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-soft"
                  >
                    <User className="h-4 w-4" /> View profile
                  </Link>
                )}
                <Link
                  to="/following"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-soft"
                >
                  <Users className="h-4 w-4" /> Following
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-soft"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-soft"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                )}
                <div className="flex items-center justify-between border-t border-border px-3 py-2 my-0.5 text-xs">
                  <span className="font-semibold text-muted-foreground whitespace-nowrap">Appearance</span>
                  <ThemeToggle showLabel className="px-2.5 py-1 text-xs hover:bg-primary-soft dark:hover:bg-muted border border-border/40 dark:border-border/60" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
          </>
        ) : (
          <Link
            to="/auth"
            className="shrink-0 whitespace-nowrap rounded-full bg-white dark:bg-primary px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-primary dark:text-primary-foreground shadow-md transition hover:scale-105 sm:px-5 sm:py-2 sm:text-sm"
          >
            Sign in
          </Link>
        )}
        </div>
      </div>

      {/* Mobile search bar (full width on small screens) */}
      <div className="px-3 pb-2.5 sm:hidden">
        <form
          className="relative w-full min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/listings", search: { q: query.trim() || undefined } });
          }}
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60 dark:text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or people…"
            aria-label="Search items or people"
            className="w-full rounded-full border border-transparent dark:border-border/60 bg-white dark:bg-background/90 py-2 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none ring-0 focus:ring-2 focus:ring-white/70 dark:focus:ring-primary/50 transition"
          />
        </form>
      </div>

      {navOpen && (
        <nav className="border-t border-white/20 dark:border-border px-3 pb-3 xl:hidden">
          <div className="flex flex-col gap-1 pt-2 text-sm font-semibold uppercase tracking-wider">
            {!session && (
              <Link
                to="/auth"
                onClick={() => setNavOpen(false)}
                className="flex items-center justify-between rounded-xl bg-white/20 dark:bg-primary/25 px-4 py-3 font-black text-white dark:text-primary transition hover:bg-white/30 mb-1"
              >
                <span>Sign in / Register</span>
              </Link>
            )}
            {links.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setNavOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition ${
                    active
                      ? "bg-white/25 text-white dark:bg-primary/20 dark:text-primary"
                      : "hover:bg-white/15 dark:hover:bg-white/10 text-white/90 dark:text-muted-foreground dark:hover:text-foreground"
                  }`}
                >
                  {l.label}
                  {l.to === "/announcements" && newAnnouncements > 0 && (
                    <span className="grid min-w-5 h-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground">
                      {newAnnouncements > 9 ? "9+" : newAnnouncements}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-white/20 dark:border-border pt-3 px-2 flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-white/90 dark:text-muted-foreground">Appearance</span>
              <ThemeToggle showLabel className="bg-white/15 dark:bg-white/10 text-white dark:text-foreground hover:bg-white/25 dark:hover:bg-white/15 border border-transparent dark:border-white/10" />
            </div>
          </div>
        </nav>
      )}
    </header>
    <PendingOfferPopup />
    </>
  );
}
