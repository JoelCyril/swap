import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyBan } from "@/lib/bans.functions";
import { ShieldAlert } from "lucide-react";

/** Blocks the whole app for a banned user and explains why. */
export function BanGate({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const fn = useServerFn(getMyBan);
  const { data: ban } = useQuery({
    queryKey: ["my-ban", userId],
    queryFn: () => fn(),
    enabled: !!userId,
    refetchInterval: 60000,
  });

  if (!ban) return <>{children}</>;

  const permanent = !ban.expires_at;

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border-2 border-destructive/30 bg-card p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-black">Your account is suspended</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A moderator has restricted your access to SWAP.
        </p>
        <div className="mt-5 rounded-2xl bg-muted p-4 text-left text-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Reason</p>
          <p className="mt-1 font-semibold">{ban.reason || "No reason provided"}</p>
          <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Duration
          </p>
          <p className="mt-1 font-semibold">
            {permanent
              ? "Permanent"
              : `Until ${new Date(ban.expires_at as string).toLocaleString()}`}
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="mt-6 w-full rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
