import { CATEGORIES, type ItemCategory } from "@/lib/db-types";

interface Props {
  active?: ItemCategory | "All" | "Collectors" | string;
  onChange?: (c: any) => void;
}

export function CategoryBar({ active = "All", onChange }: Props) {
  return (
    <div className="bg-gradient-to-r from-primary/95 via-primary to-primary-glow text-primary-foreground shadow-xs">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* ALL */}
        <button
          type="button"
          onClick={() => onChange?.("All")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            active === "All"
              ? "bg-white text-primary shadow-md scale-105"
              : "bg-white/10 hover:bg-white/25 text-primary-foreground"
          }`}
        >
          All
        </button>

        {/* 🏆 COLLECTORS - First Category with Cool Gold Glow */}
        <button
          type="button"
          onClick={() => onChange?.("Collectors")}
          className={`group relative shrink-0 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
            active === "Collectors"
              ? "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 scale-105 ring-2 ring-white shadow-[0_0_22px_rgba(251,191,36,0.95)]"
              : "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.7)] border border-amber-200/60 hover:brightness-110 hover:scale-105"
          }`}
        >
          <span className="relative flex items-center gap-1.5 drop-shadow-xs">
            <span className="text-sm leading-none animate-bounce">🏆</span>
            <span className="font-black tracking-wide">Collectors</span>
          </span>
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
                isActive ? "bg-white text-primary shadow-md scale-105" : "bg-white/10 hover:bg-white/25"
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
