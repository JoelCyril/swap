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
      <div className="sticky top-24 flex flex-col gap-2">
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
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-card py-3 text-xs font-black uppercase tracking-wider text-primary"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters & sort
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <FilterPanel {...props} />
              <WantedSidebarWidget signedIn={props.signedIn} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border-2 border-primary/30 py-2.5 text-xs font-black uppercase tracking-wider text-primary"
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
  return (
    <>

        <div className="flex items-center gap-2 border-b border-border pb-3">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold">Filters</h3>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-primary">
            Condition
          </h4>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer group">
                <input
                  type="checkbox"
                  checked={conditions.includes(c)}
                  onChange={() => onToggleCondition(c)}
                  className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary accent-primary"
                />
                <span className="group-hover:text-primary transition">{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-primary">
            Emirate
          </h4>
          <select
            value={emirate}
            onChange={(e) => onEmirate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All emirates</option>
            {EMIRATES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-primary">
            Sort by
          </h4>
          <div className="flex flex-col gap-1.5">
            {SORTS.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === s.key}
                  onChange={() => onSort(s.key)}
                  className="h-4 w-4 accent-primary"
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition hover:shadow-glow"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset filters
        </button>
    </>
  );
}
