import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listMyFavouriteIds, toggleFavourite } from "@/lib/favourites.functions";
import { useSession } from "@/hooks/use-session";

export const SAVED_KEY = ["saved-ids"] as const;

/** Shared, cached list of listing ids the signed-in user has saved. */
export function useSavedIds() {
  const { user } = useSession();
  const fn = useServerFn(listMyFavouriteIds);
  const q = useQuery({
    queryKey: [...SAVED_KEY, user?.id ?? "anon"],
    queryFn: () => fn(),
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  return {
    savedIds: (q.data ?? []) as string[],
    isLoading: !!user && q.data === undefined,
    isSignedIn: !!user,
    userId: user?.id ?? null,
  };
}

/** Toggle a listing's saved state with optimistic UI + cache invalidation. */
export function useToggleSaved() {
  const qc = useQueryClient();
  const { user } = useSession();
  const fn = useServerFn(toggleFavourite);

  return useMutation({
    mutationFn: (listingId: string) => fn({ data: { listing_id: listingId } }),
    onMutate: async (listingId) => {
      const key = [...SAVED_KEY, user?.id ?? "anon"];
      await qc.cancelQueries({ queryKey: key });
      const prev = (qc.getQueryData(key) as string[] | undefined) ?? [];
      const next = prev.includes(listingId) ? prev.filter((i) => i !== listingId) : [...prev, listingId];
      qc.setQueryData(key, next);
      return { key, prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(e instanceof Error ? e.message : "Could not update saved listings");
    },
    onSuccess: (res, listingId, ctx) => {
      // Trust the server's final state so the icon never drifts from the DB.
      if (ctx && res && typeof res === "object" && "favourited" in res) {
        const prev = (qc.getQueryData(ctx.key) as string[] | undefined) ?? [];
        const on = (res as { favourited: boolean }).favourited;
        const next = on
          ? Array.from(new Set([...prev, listingId]))
          : prev.filter((i) => i !== listingId);
        qc.setQueryData(ctx.key, next);
      }
      qc.invalidateQueries({ queryKey: ["favourites"] });
    },
  });
}
