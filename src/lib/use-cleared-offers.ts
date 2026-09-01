import { useEffect, useState, useCallback } from "react";

export const CLEARED_KEY = "swap.clearedOffers";

export function useClearedOffers() {
  const [cleared, setCleared] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLEARED_KEY);
      if (raw) setCleared(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const clear = useCallback((id: string) => {
    setCleared((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem(CLEARED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const restore = useCallback((id: string) => {
    setCleared((prev) => {
      const next = prev.filter((item) => item !== id);
      try {
        localStorage.setItem(CLEARED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setCleared([]);
    try {
      localStorage.removeItem(CLEARED_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { cleared, clear, restore, restoreAll, isLoaded };
}
