import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

interface Props {
  signedIn: boolean;
}

export function ReferralSidebarTab({ signedIn }: Props) {
  const [copied, setCopied] = useState(false);
  const meFn = useServerFn(getMyProfile);

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: () => meFn(),
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
  });

  const username = profile?.username;
  const referralLink =
    typeof window !== "undefined" && username
      ? `${window.location.origin}?ref=${username}`
      : `https://swap.ae?ref=${username || ""}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!username) {
      toast.error("Please sign in or complete your profile first.");
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied to clipboard!", {
        description: referralLink,
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback
      toast.info(`Your referral link: ${referralLink}`);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-card p-3 shadow-card transition-all hover:border-primary/40">
      <div className="flex items-center justify-between gap-2">
        <Link
          to={signedIn ? "/settings" : "/auth"}
          className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
          title={signedIn ? "Open Referral Settings" : "Sign in to get referral link"}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-xs group-hover:scale-105 transition">
            <Gift className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xs font-black text-foreground group-hover:text-primary transition truncate">
              Refer a Friend
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {signedIn && username ? `@${username} invite` : "Invite & earn"}
            </p>
          </div>
        </Link>

        {signedIn ? (
          <button
            type="button"
            onClick={handleCopy}
            title="Copy your referral link"
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase transition cursor-pointer select-none active:scale-95 ${
              copied
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-primary/10 text-primary hover:bg-gradient-primary hover:text-primary-foreground shadow-2xs"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        ) : (
          <Link
            to="/auth"
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black uppercase text-primary hover:bg-gradient-primary hover:text-primary-foreground transition cursor-pointer"
          >
            Join
          </Link>
        )}
      </div>
    </div>
  );
}
