import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

interface Props {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: Props) {
  const [theme, toggleTheme] = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative ${
        showLabel
          ? "inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          : "grid h-10 w-10 shrink-0 place-items-center rounded-full"
      } text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative h-5 w-5 grid place-items-center">
        <Sun
          strokeWidth={2.25}
          className={`h-4.5 w-4.5 transition-all duration-300 ${
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100 text-current drop-shadow-xs group-hover:rotate-45"
          }`}
        />
        <Moon
          strokeWidth={2.25}
          className={`h-4.5 w-4.5 transition-all duration-300 ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-current drop-shadow-xs group-hover:-rotate-12"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold capitalize">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      )}
    </button>
  );
}
