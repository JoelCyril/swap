import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { EMIRATES, CONDITIONS, type ItemCondition } from "@/lib/db-types";
import { InquiryUpdates } from "@/components/support/InquiryUpdates";
import { WantedSidebarWidget } from "@/components/wanted/WantedSidebarWidget";

export type SortKey = "shuffle" | "newest" | "oldest";

interface Props {
  conditions: ItemCondition[];
  onToggleCondition: (c: ItemCondition) => void;
  emirate: string;
  onEmirate: (n: string) => void;
  signedIn: boolean;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onReset: () => void;
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "shuffle", label: "Shuffled" },
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
];


export function FilterSidebar(props: Props) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 flex flex-col gap-3.5">
        <div className="rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card">
          <FilterPanel {...props} />
        </div>
        <WantedSidebarWidget signedIn={props.signedIn} />
        <InquiryUpdates signedIn={props.signedIn} placement="sidebar" />
      </div>
    </aside>
  );
}

export function MobileFilters(props: Props) {
  const [open, setOpen] = useState(false);
  const activeFiltersCount = props.conditions.length + (props.emirate ? 1 : 0) + (props.sort !== "shuffle" ? 1 : 0);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-card py-3 text-xs font-black uppercase tracking-wider text-primary shadow-sm"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters & sort
        {activeFiltersCount > 0 && (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
            {activeFiltersCount}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <FilterPanel {...props} />
              <WantedSidebarWidget signedIn={props.signedIn} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gradient-primary py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  conditions,
  onToggleCondition,
  emirate,
  onEmirate,
  sort,
  onSort,
  onReset,
}: Props) {
  const isFiltered = conditions.length > 0 || !!emirate || sort !== "shuffle";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-display text-sm font-black text-foreground">Filters</h3>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline transition"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Condition (Interactive Pills Grid) */}
      <div>
        <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Condition
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {CONDITIONS.map((c) => {
            const active = conditions.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => onToggleCondition(c)}
                className={`rounded-xl border px-2.5 py-1.5 text-center text-xs font-bold transition cursor-pointer select-none ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-xs font-black"
                    : "border-primary/20 bg-background/70 text-foreground hover:border-primary/40 hover:bg-background"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Emirate Dropdown */}
      <div>
        <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Emirate
        </h4>
        <select
          value={emirate}
          onChange={(e) => onEmirate(e.target.value)}
          className="w-full rounded-2xl border-2 border-primary/20 bg-background px-3.5 py-2 text-xs font-bold text-foreground outline-none focus:border-primary shadow-2xs transition"
        >
          <option value="">All emirates</option>
          {EMIRATES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By (Sleek List) */}
      <div>
        <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Sort by
        </h4>
        <div className="space-y-1.5">
          {SORTS.map((s) => {
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onSort(s.key)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-xs font-bold transition cursor-pointer select-none ${
                  active
                    ? "border-primary bg-primary/10 text-primary font-black shadow-2xs"
                    : "border-border/60 bg-background/50 text-foreground/80 hover:border-primary/30 hover:bg-background"
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`grid h-3.5 w-3.5 place-items-center rounded-full border transition ${
                    active ? "border-primary bg-primary text-white" : "border-muted-foreground/40 bg-transparent"
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Filters Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm transition hover:shadow-glow active:scale-98"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset filters
        </button>
      )}
    </div>
  );
}
