import { CATEGORIES, type ItemCategory } from "@/lib/db-types";

interface Props {
  active?: ItemCategory | "All" | "Collectors" | string;
  onChange?: (c: any) => void;
}

export function CategoryBar({ active = "All", onChange }: Props) {
  return (
    <div className="w-full max-w-full overflow-hidden bg-gradient-to-r from-primary/95 via-primary to-primary-glow text-primary-foreground shadow-xs dark:bg-none dark:bg-card/75 dark:backdrop-blur-md dark:border-b dark:border-border/70 dark:text-foreground transition-colors">
      <div className="mx-auto flex max-w-[1400px] w-full items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* ALL */}
        <button
          type="button"
          onClick={() => onChange?.("All")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            active === "All"
              ? "bg-white text-primary shadow-md scale-105 dark:bg-primary dark:text-primary-foreground dark:shadow-[0_0_16px_rgba(249,115,22,0.45)]"
              : "bg-white/10 hover:bg-white/25 text-primary-foreground dark:bg-card/90 dark:text-muted-foreground hover:dark:text-foreground hover:dark:bg-secondary dark:border dark:border-border/60"
          }`}
        >
          All
        </button>

        {/* COLLECTORS - First Category with Cool Gold Glow */}
        <button
          type="button"
          onClick={() => onChange?.("Collectors")}
          className={`group relative shrink-0 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center cursor-pointer ${
            active === "Collectors"
              ? "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 scale-105 ring-2 ring-white dark:ring-amber-300/40 shadow-[0_0_22px_rgba(251,191,36,0.95)]"
              : "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.7)] border border-amber-200/60 hover:brightness-110 hover:scale-105"
          }`}
        >
          <span className="font-black tracking-wide drop-shadow-xs">Collectors</span>
        </button>

        {/* Regular Categories */}
        {CATEGORIES.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange?.(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-primary shadow-md scale-105 dark:bg-primary dark:text-primary-foreground dark:shadow-[0_0_16px_rgba(249,115,22,0.45)]"
                  : "bg-white/10 hover:bg-white/25 text-primary-foreground dark:bg-card/90 dark:text-muted-foreground hover:dark:text-foreground hover:dark:bg-secondary dark:border dark:border-border/60"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
