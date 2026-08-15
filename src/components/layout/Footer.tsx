import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/swap-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-6 border-t border-border bg-card/80">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-2">
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="SWAP" className="h-7 w-auto object-contain" />
          <span className="text-[11px] leading-none text-muted-foreground">
            © {new Date().getFullYear()} — Trade, don't spend.
          </span>
        </div>
        <nav className="flex items-center gap-4 text-[11px] leading-none text-muted-foreground">
          <Link to="/listings" className="hover:text-primary transition">
            Browse
          </Link>
          <Link to="/terms" className="hover:text-primary transition font-semibold">
            Terms&Conditions
          </Link>
          <Link to="/help" className="hover:text-primary transition">
            Contact Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
