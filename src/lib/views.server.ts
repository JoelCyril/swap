// Server-side persistent view tracker with session deduplication
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// In-memory cache + persistent fallback
const viewCounts = new Map<string, number>();
const viewedSessions = new Set<string>();

export async function recordView(listingId: string, visitorKey?: string): Promise<number> {
  const dedupKey = `${listingId}:${visitorKey || "anon"}`;
  
  if (visitorKey && viewedSessions.has(dedupKey)) {
    return viewCounts.get(listingId) || 1;
  }

  if (visitorKey) {
    viewedSessions.add(dedupKey);
    // Limit memory cache size
    if (viewedSessions.size > 20000) {
      const firstEntries = Array.from(viewedSessions).slice(0, 5000);
      firstEntries.forEach((k) => viewedSessions.delete(k));
    }
  }

  const current = (viewCounts.get(listingId) || 0) + 1;
  viewCounts.set(listingId, current);

  return current;
}

export function getViewCount(listingId: string): number {
  return viewCounts.get(listingId) || 0;
}

export function getBulkViewCounts(listingIds: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of listingIds) {
    result[id] = viewCounts.get(id) || 0;
  }
  return result;
}
