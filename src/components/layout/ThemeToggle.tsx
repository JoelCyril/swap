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
      className={`group relative inline-flex items-center gap-2 rounded-full p-2 text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative h-5 w-5 grid place-items-center">
        <Sun
          className={`h-4 w-4 transition-all duration-300 ${
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          }`}
        />
        <Moon
          className={`h-4 w-4 transition-all duration-300 ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-blue-400"
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
