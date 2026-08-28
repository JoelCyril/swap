import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Project-specific replacement for the generated `attachSupabaseAuth`.
 * It additionally refreshes an expired/near-expired access token before
 * attaching it, so users with a stale session don't get a wall of failed
 * server-function calls (which previously surfaced as "This page didn't load").
 */
export const attachSupabaseAuthFresh = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      token = session?.access_token;
      const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
      if (session && expiresAt && expiresAt < Date.now() + 180_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed.session?.access_token ?? token;
      }
    } catch {
      // fall through with whatever token we have (possibly none)
    }
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
