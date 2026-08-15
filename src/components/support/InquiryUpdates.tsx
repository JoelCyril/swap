import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyInquiries } from "@/lib/support.functions";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/db-types";
import { LifeBuoy, X } from "lucide-react";

/**
 * Small corner widget showing the signed-in member's support inquiries and any
 * moderator replies. Hidden entirely when they have never sent one.
 */
export function InquiryUpdates({
  signedIn,
  placement = "floating",
}: {
  signedIn: boolean;
  placement?: "floating" | "sidebar";
}) {
  const [open, setOpen] = useState(false);
  // Only query once a real session exists — otherwise the server fn 401s.
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setHasSession(Boolean(data.session?.access_token));
    });
    return () => {
      alive = false;
    };
  }, [signedIn]);

  const fn = useServerFn(listMyInquiries);
  const { data } = useQuery({
    queryKey: ["my-inquiries"],
    queryFn: () => fn(),
    enabled: signedIn && hasSession,
    retry: false,
    refetchInterval: 60_000,
  });

  const items = data ?? [];
  if (!signedIn) return null;

  const replies = items.filter((i) => i.reply).length;

  return (
    <div className={placement === "floating" ? "fixed bottom-4 right-4 z-40 print:hidden" : "mt-4 print:hidden"}>
      {open ? (
        <div className={`${placement === "sidebar" ? "w-full" : "w-[min(340px,calc(100vw-2rem))]"} overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-card-hover`}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="inline-flex items-center gap-2 font-display text-sm font-black">
              <LifeBuoy className="h-4 w-4 text-primary" /> Inquiry updates
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4">
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground">
                You haven't sent any inquiries yet. Send one from the Help page and moderator replies
                will show up here.
              </p>
            )}
            {items.map((i) => (
              <div key={i.id} className="rounded-2xl bg-muted p-3">
                <p className="text-xs font-bold">{i.subject}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Sent {timeAgo(i.created_at)}</p>
                {i.reply ? (
                  <div className="mt-2 rounded-xl bg-primary-soft p-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary">
                      Moderator reply
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs">{i.reply}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] italic text-muted-foreground">Waiting for a reply…</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-card px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary shadow-card transition hover:shadow-card-hover"
        >
          <LifeBuoy className="h-4 w-4" /> Inquiry updates
          {replies > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-primary px-1 text-[10px] text-primary-foreground">
              {replies}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
