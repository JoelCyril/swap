import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { banUser, liftBan, getUserBan } from "@/lib/bans.functions";
import { Ban, ShieldOff } from "lucide-react";
import { toast } from "sonner";

const DURATIONS: { label: string; days: number | null }[] = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "1 year", days: 365 },
  { label: "Permanent", days: null },
];

/** Admin-only controls to ban or unban a member. */
export function BanUserPanel({ userId, displayName }: { userId: string; displayName: string }) {
  const qc = useQueryClient();
  const banFn = useServerFn(banUser);
  const liftFn = useServerFn(liftBan);
  const getBan = useServerFn(getUserBan);

  const [reason, setReason] = useState("");
  const [durationIdx, setDurationIdx] = useState(1);

  const { data: activeBan } = useQuery({
    queryKey: ["user-ban", userId],
    queryFn: () => getBan({ data: { user_id: userId } }),
  });

  const ban = useMutation({
    mutationFn: () =>
      banFn({ data: { user_id: userId, reason: reason.trim(), days: DURATIONS[durationIdx].days } }),
    onSuccess: () => {
      setReason("");
      qc.invalidateQueries({ queryKey: ["user-ban", userId] });
      toast.success(`${displayName} has been banned`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const lift = useMutation({
    mutationFn: () => liftFn({ data: { user_id: userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-ban", userId] });
      toast.success("Ban lifted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mb-10 rounded-3xl border-2 border-destructive/30 bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-black text-destructive">
        <Ban className="h-4 w-4" /> Moderation
      </h2>

      {activeBan ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl bg-destructive/10 p-4 text-sm">
            <p className="font-bold">This member is banned</p>
            <p className="mt-1 text-muted-foreground">Reason: {activeBan.reason}</p>
            <p className="text-muted-foreground">
              {activeBan.expires_at
                ? `Until ${new Date(activeBan.expires_at).toLocaleString()}`
                : "Permanent"}
            </p>
          </div>
          <button
            onClick={() => lift.mutate()}
            disabled={lift.isPending}
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary transition hover:bg-primary-soft disabled:opacity-50"
          >
            <ShieldOff className="h-3.5 w-3.5" /> Lift ban
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Reason</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Why is this member being banned?"
              className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Duration</label>
            <select
              value={durationIdx}
              onChange={(e) => setDurationIdx(Number(e.target.value))}
              className="mt-1 w-full rounded-full border-2 border-primary/20 bg-white px-4 py-2 text-sm"
            >
              {DURATIONS.map((d, i) => (
                <option key={d.label} value={i}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (reason.trim().length < 3) return toast.error("Please add a reason");
              if (confirm(`Ban ${displayName}? They will lose access to the site.`)) ban.mutate();
            }}
            disabled={ban.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-xs font-black uppercase tracking-wider text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" /> Ban user
          </button>
        </div>
      )}
    </section>
  );
}
