import { useState } from "react";
import { Wrench, ShieldCheck, Mail, RefreshCw, Sparkles, Clock } from "lucide-react";

export function MaintenancePage() {
  const [checking, setChecking] = useState(false);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Brand Logo & Icon */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative">
            <img
              src="/favicon.png"
              alt="SWAP"
              className="h-16 w-16 object-contain drop-shadow-md animate-pulse"
            />
            <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-sm">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="font-display text-4xl font-black tracking-tight text-primary">
            SWAP
          </span>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary shadow-xs mb-4">
          <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          System Maintenance in Progress
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border-2 border-primary/25 bg-card/90 backdrop-blur-md p-6 sm:p-8 shadow-card text-left space-y-6">
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              We'll Be Back Shortly!
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              SWAP is currently undergoing scheduled maintenance and database upgrades to ensure faster, more reliable bartering across the UAE.
            </p>
          </div>

          {/* Key Assurance Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground">Data 100% Safe</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  All member listings, active offers, and user chats are securely preserved.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground">System Upgrades</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Optimizing server performance and cloud capacity for all members.
                </p>
              </div>
            </div>
          </div>

          {/* Action & Contact */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 px-5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking Status…" : "Check Again"}
            </button>

            <a
              href="mailto:swapuaeofficial@gmail.com"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/20 bg-background py-3 px-5 text-xs font-bold text-foreground hover:bg-muted transition"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-xs text-muted-foreground">
          Thank you for your patience while we improve SWAP. See you soon!
        </p>
      </div>
    </div>
  );
}
