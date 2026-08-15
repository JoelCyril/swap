import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listBlockedIds } from "@/lib/settings.functions";
import { useSession } from "@/hooks/use-session";

/** Ids of members hidden from the current viewer (blocked either direction). */
export function useBlockedIds() {
  const { session } = useSession();
  const fn = useServerFn(listBlockedIds);
  const { data } = useQuery({
    queryKey: ["blocked-ids"],
    queryFn: () => fn(),
    enabled: !!session,
    staleTime: 60_000,
  });

  return new Set<string>(data ?? []);
}
