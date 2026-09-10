import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTradeFairnessScore } from "@/lib/ai.functions";
import { Sparkles, Scale, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

export function FairTradeMeter({
  targetListing,
  offeredItems,
}: {
  targetListing: {
    title: string;
    category: string;
    condition: string;
    description?: string;
  };
  offeredItems: Array<{
    name: string;
    category: string;
    condition: string;
    description?: string;
  }>;
}) {
  const [data, setData] = useState<{
    score: number;
    verdict: string;
    summary: string;
    advice: string;
    target_aed?: number;
    offered_total_aed?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const calculate = useServerFn(getTradeFairnessScore);

  useEffect(() => {
    if (!offeredItems || offeredItems.length === 0) {
      setData(null);
      return;
    }

    let active = true;
    setLoading(true);

    calculate({
      data: {
        targetListing: {
          title: targetListing.title,
          category: targetListing.category,
          condition: targetListing.condition,
          description: targetListing.description,
        },
        offeredItems: offeredItems.map((i) => ({
          name: i.name,
          category: i.category,
          condition: i.condition,
          description: i.description,
        })),
      },
    })
      .then((res) => {
        if (active && res) setData(res);
      })
      .catch((err) => {
        console.warn("Failed to calculate trade fairness", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [targetListing.title, targetListing.condition, offeredItems.length, calculate]);

  if (!offeredItems || offeredItems.length === 0) return null;

  const score = data?.score ?? (loading ? 50 : 80);
  const isBalanced = score >= 75;
  const isSeverelyUnbalanced = score < 50;

  return (
    <div
      className={`rounded-2xl border-2 p-3.5 shadow-sm transition-all ${
        isSeverelyUnbalanced
          ? "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-card"
          : isBalanced
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card"
          : "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`grid h-8 w-8 place-items-center rounded-xl text-white shadow-sm ${
              isSeverelyUnbalanced
                ? "bg-rose-600"
                : isBalanced
                ? "bg-emerald-600"
                : "bg-amber-600"
            }`}
          >
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xs font-black uppercase tracking-wider text-foreground">
                AI Fair Trade Meter
              </span>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isSeverelyUnbalanced
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" /> Groq AI Verified
              </span>
            </div>
            <p
              className={`text-[11px] font-bold ${
                isSeverelyUnbalanced
                  ? "text-rose-600 dark:text-rose-400"
                  : isBalanced
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {loading ? "Analyzing trade value with Groq..." : data?.verdict || "Balanced Swap"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className={`text-sm font-black ${
                isSeverelyUnbalanced
                  ? "text-rose-600 dark:text-rose-400"
                  : isBalanced
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {loading ? "..." : `${score}%`}
            </span>
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Parity</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
          }`}
          style={{ width: `${Math.min(100, Math.max(6, score))}%` }}
        />
      </div>

      {/* AED Valuation Badges */}
      {data && (typeof data.target_aed === "number" || typeof data.offered_total_aed === "number") && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="truncate">
            Target: <strong className="text-foreground">~{data.target_aed ?? "—"} AED</strong>
          </span>
          <span className="text-muted-foreground/40">⇄</span>
          <span className="truncate text-right">
            Offered: <strong className="text-foreground">~{data.offered_total_aed ?? "—"} AED</strong>
          </span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && data && (
        <div className="mt-2.5 space-y-2 border-t border-border/50 pt-2.5 text-xs animate-in fade-in duration-200">
          <p className="text-muted-foreground flex items-start gap-1.5">
            {isSeverelyUnbalanced ? (
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug text-foreground/90">{data.summary}</span>
          </p>
          {data.advice && (
            <div
              className={`rounded-xl p-2 text-[11px] font-semibold ${
                isSeverelyUnbalanced
                  ? "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
                  : "bg-primary-soft/50 text-foreground/90 border border-primary/20"
              }`}
            >
              💡 {data.advice}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
