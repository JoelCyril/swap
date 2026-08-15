import { ChevronRight } from "lucide-react";
import { CATEGORIES, type ItemCategory } from "@/lib/db-types";

interface Props {
  active?: ItemCategory | "All";
  onChange?: (c: ItemCategory | "All") => void;
}

export function CategoryBar({ active = "All", onChange }: Props) {
  const items: (ItemCategory | "All")[] = ["All", ...CATEGORIES];
  return (
    <div className="bg-gradient-to-r from-primary/95 via-primary to-primary-glow text-primary-foreground">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange?.(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                isActive ? "bg-white text-primary shadow-md scale-105" : "bg-white/10 hover:bg-white/25"
              }`}
            >
              {cat}
            </button>
          );
        })}
        <button
          type="button"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/30 transition"
          aria-label="More categories"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
