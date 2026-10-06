import { useState } from "react";
import { RefreshCw, Mail } from "lucide-react";

export function MaintenancePage() {
  const [checking, setChecking] = useState(false);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        {/* Helmet Logo Picture */}
        <div className="mb-6 relative">
          <img
            src="/maintenance.jpg"
            alt="SWAP Under Maintenance"
            className="h-44 w-44 sm:h-52 sm:w-52 object-contain drop-shadow-md rounded-3xl"
          />
        </div>

        {/* Minimal Under Maintenance Title */}
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          Under Maintenance
        </h1>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
          We're currently undergoing maintenance to improve your experience. We'll be back online shortly!
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 px-6 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Check Again"}
          </button>

          <a
            href="mailto:swapuaeofficial@gmail.com"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/20 bg-card py-2.5 px-6 text-xs font-bold text-foreground hover:bg-muted transition"
          >
            <Mail className="h-3.5 w-3.5 text-primary" />
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
