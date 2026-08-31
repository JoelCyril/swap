import { Link } from "@tanstack/react-router";
import { type WantedRequestItem } from "@/lib/wanted.server";
import { timeAgo, handle } from "@/lib/db-types";
import { ArrowRightLeft, MapPin, Sparkles, Clock, Trash2, Megaphone, Pencil } from "lucide-react";

interface WantedCardProps {
  request: WantedRequestItem;
  myId?: string | null;
  onFulfill: (req: WantedRequestItem) => void;
  onEdit?: (req: WantedRequestItem) => void;
  onDelete?: (id: string) => void;
}

export function WantedCard({ request, myId, onFulfill, onDelete }: WantedCardProps) {
  const isMine = myId && myId === request.user_id;

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border-2 border-primary/20 bg-card p-4 sm:p-5 shadow-card transition-all hover:border-primary hover:shadow-card-hover">
      <div>
        {/* Top bar with Category, Emirate, Time */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-black uppercase tracking-wider text-[10px] text-primary">
            <Megaphone className="h-3 w-3" /> {request.category}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" /> {request.location}, {request.emirate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" /> {timeAgo(request.created_at)}
            </span>
          </div>
        </div>

        {/* What They Want */}
        <div className="mt-3.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">In Search Of (ISO)</p>
          <h3 className="font-display text-lg font-black text-foreground mt-0.5 group-hover:text-primary transition-colors">
            {request.title}
          </h3>
        </div>

        {/* What They Offer In Return */}
        <div className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" /> Offering to Swap
          </p>
          <p className="text-xs text-foreground/80 mt-1 line-clamp-3 whitespace-pre-wrap">
            {request.offering_description}
          </p>
        </div>
      </div>

      {/* Footer / Requester & Action */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-3">
        {/* User Info */}
        <Link
          to="/profile/$username"
          params={{ username: request.user.username }}
          className="flex items-center gap-2 min-w-0 group/user"
        >
          <div
            className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-white font-black text-xs shadow-sm"
            style={{ backgroundColor: request.user.avatar_url ? "transparent" : request.user.avatar_color || "#ea580c" }}
          >
            {request.user.avatar_url ? (
              <img src={request.user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              request.user.username[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate group-hover/user:text-primary">
              @{request.user.username}
            </p>
          </div>
        </Link>

        {/* Action Button */}
        {isMine ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit?.(request)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(request.id)}
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onFulfill(request)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 shrink-0"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> I Have This!
          </button>
        )}
      </div>
    </article>
  );
}
