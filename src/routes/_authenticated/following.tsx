import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listMyFollowing } from "@/lib/follows.functions";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/following")({
  head: () => ({ meta: [{ title: "Following — SWAP" }] }),
  component: FollowingPage,
});

function FollowingPage() {
  const fn = useServerFn(listMyFollowing);
  const { data, isLoading } = useQuery({ queryKey: ["following"], queryFn: () => fn() });
  const people = data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-black">Following</h1>
            <p className="text-sm text-muted-foreground">People whose new listings appear first in your feed.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">Loading…</div>
        ) : people.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-card p-12 text-center text-muted-foreground">
            You are not following anyone yet.
            <Link to="/listings" className="mt-3 block text-sm font-bold text-primary hover:underline">Browse people and listings →</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {people.map((person) => (
              <Link
                key={person.id}
                to="/profile/$username"
                params={{ username: person.username }}
                className="flex items-center gap-4 rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-card transition hover:border-primary hover:shadow-card-hover"
              >
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white"
                  style={{ backgroundColor: person.avatar_url ? "transparent" : person.avatar_color }}
                >
                  {person.avatar_url ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : person.display_name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">@{person.username}</p>
                  {person.location && <p className="truncate text-xs text-muted-foreground">{person.location}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
