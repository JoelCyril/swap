import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Gift, Sparkles, ArrowRight, Lock, Mail } from "lucide-react";

const DISMISSED_SESSION_KEY = "swap_auth_prompt_dismissed";
const DISMISSED_TIME_KEY = "swap_auth_prompt_last_closed";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours between prompts if dismissed

export function AuthPromptModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Route exclusions
  const isExcludedRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/reset-password");

  useEffect(() => {
    if (typeof window === "undefined" || isExcludedRoute) return;

    // 1. Check if user already dismissed in this session
    try {
      if (sessionStorage.getItem(DISMISSED_SESSION_KEY)) return;
      const lastClosed = localStorage.getItem(DISMISSED_TIME_KEY);
      if (lastClosed && Date.now() - Number(lastClosed) < COOLDOWN_MS) return;
    } catch {}

    // 2. Check if user is already signed in
    let isCancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (isCancelled || data.session?.user) return;

      // Check if they came via referral
      try {
        const storedRef = localStorage.getItem("swap_ref");
        if (storedRef) {
          setReferrer(storedRef);
        }
      } catch {}

      // 3. Start 10-second client-side timer
      const timer = setTimeout(() => {
        if (!isCancelled) {
          // Double-check auth right before opening to avoid race conditions
          supabase.auth.getSession().then(({ data: freshData }) => {
            if (!freshData.session?.user && !isCancelled) {
              setOpen(true);
            }
          });
        }
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    });

    return () => {
      isCancelled = true;
    };
  }, [location.pathname, isExcludedRoute]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_SESSION_KEY, "true");
      localStorage.setItem(DISMISSED_TIME_KEY, Date.now().toString());
    } catch {}
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign in failed");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created successfully!", {
          description: data.session
            ? "Welcome to SWAP!"
            : "Please check your email to confirm your account.",
        });
        handleDismiss();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        handleDismiss();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open || isExcludedRoute) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-8 shadow-2xl transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-muted/80 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            {referrer ? (
              <Gift className="h-6 w-6 text-primary-foreground animate-bounce" />
            ) : (
              <img
                src="/favicon.png"
                alt="SWAP"
                className="h-7 w-7 object-contain"
              />
            )}
          </div>

          {referrer ? (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              <Gift className="h-3.5 w-3.5" />
              Invited by @{referrer}
            </div>
          ) : (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Join UAE's Barter Community
            </div>
          )}

          <h2
            id="auth-modal-title"
            className="font-display text-2xl font-black text-foreground tracking-tight"
          >
            {referrer ? "Claim Your Invite on SWAP" : "Welcome to SWAP"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {referrer
              ? "Sign up in seconds to start trading gadgets, games, and fashion cashless."
              : "Trade pre-loved items with verified community members across the UAE."}
          </p>
        </div>

        {/* 1-Tap Google Button */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-primary/30 bg-background py-3 text-sm font-bold text-foreground transition hover:bg-primary-soft disabled:opacity-50 shadow-xs cursor-pointer select-none active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {!emailMode ? (
            <button
              type="button"
              onClick={() => setEmailMode(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/40 py-2.5 text-xs font-bold text-muted-foreground transition hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5" />
              Continue with Email
            </button>
          ) : (
            <form onSubmit={handleEmailAuth} className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">
                  {isSignUp ? "Create with Email" : "Sign In with Email"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  {isSignUp ? "Have an account? Sign in" : "New? Create account"}
                </button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border-2 border-primary/20 bg-background pl-9 pr-4 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border-2 border-primary/20 bg-background pl-9 pr-4 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? "Please wait..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          By signing up, you agree to SWAP's{" "}
          <Link
            to="/terms"
            onClick={handleDismiss}
            className="font-bold underline hover:text-foreground"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
