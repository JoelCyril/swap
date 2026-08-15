import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications.functions";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SWAP" },
      { name: "description", content: "Your offers, meetups, messages and moderation updates." },
      { property: "og:title", content: "Notifications — SWAP" },
      { property: "og:description", content: "SWAP activity inbox." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const { data: notifs } = useQuery({ queryKey: ["notifications"], queryFn: () => list() });
  const unread = (notifs ?? []).filter((n: any) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[800px] flex-1 px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-black">Notifications</h1>
              <p className="text-muted-foreground text-sm">{unread} unread</p>
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={async () => { await markAll(); qc.invalidateQueries({ queryKey: ["notifications"] }); }}
              className="rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-bold uppercase text-primary hover:bg-primary-soft"
            >
              Mark all read
            </button>
          )}
        </div>

        {(notifs ?? []).length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-10 text-center">
            <p className="text-muted-foreground">You're all caught up.</p>
            <Link to="/listings" className="mt-4 inline-block text-primary font-bold hover:underline">Browse listings →</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {(notifs ?? []).map((n: any) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!n.read) { await markRead({ data: { id: n.id } }); qc.invalidateQueries({ queryKey: ["notifications"] }); }
                    if (n.link) navigate({ to: n.link });
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
                    n.read ? "border-border bg-card" : "border-primary/40 bg-primary-soft/40"
                  }`}
                >
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
