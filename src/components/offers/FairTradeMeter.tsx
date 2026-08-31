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

  const score = data?.score ?? 80;
  const isBalanced = score >= 75;

  return (
    <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card p-3.5 shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-sm">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xs font-black uppercase tracking-wider text-foreground">
                AI Fair Trade Meter
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Sparkles className="h-2.5 w-2.5" /> AI Verified
              </span>
            </div>
            <p className="text-[11px] font-semibold text-primary">
              {loading ? "Analyzing trade value..." : data?.verdict || "Balanced Swap"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-sm font-black text-foreground">{loading ? "..." : `${score}%`}</span>
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Parity</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500"
          }`}
          style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
        />
      </div>

      {/* Expanded details */}
      {expanded && data && (
        <div className="mt-2.5 space-y-1.5 border-t border-border/50 pt-2 text-xs animate-in fade-in duration-200">
          <p className="text-muted-foreground flex items-start gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{data.summary}</span>
          </p>
          {data.advice && (
            <p className="text-[11px] font-medium text-foreground/80 bg-primary-soft/40 rounded-lg p-1.5">
              💡 {data.advice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
