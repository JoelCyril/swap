import { useState } from "react";
import { ShieldCheck, Mail, RefreshCw, Sparkles, Clock, Wrench } from "lucide-react";

export function MaintenancePage() {
  const [checking, setChecking] = useState(false);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-primary/20">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Top Header Logo */}
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <img
            src="/swap-logo.png"
            alt="SWAP"
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary shadow-xs mb-5">
          <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} />
          System Maintenance & Upgrades
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border-2 border-primary/25 bg-card/95 backdrop-blur-md shadow-card">
          {/* Custom 3D Maintenance Illustration */}
          <div className="relative w-full aspect-square max-h-72 sm:max-h-80 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent flex items-center justify-center p-3">
            <img
              src="/maintenance.jpg"
              alt="SWAP Under Maintenance"
              className="h-full w-auto object-contain rounded-2xl drop-shadow-lg"
            />
          </div>

          <div className="p-6 sm:p-8 pt-2 space-y-6 text-left">
            <div className="text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                We're Getting a Tune-Up!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                SWAP is temporarily offline for scheduled infrastructure upgrades. We're tuning our servers so your barter experience is faster and smoother than ever.
              </p>
            </div>

            {/* Reassurance Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">Data 100% Safe</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    All member listings, trade proposals, and messages are securely preserved.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">Engine Upgrade</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Expanding database capacity to handle more trades without interruptions.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-muted-foreground">
          Thank you for your patience while we upgrade SWAP UAE. We'll be back online soon!
        </p>
      </div>
    </div>
  );
}
