import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      throw redirect({ to: "/auth" });
    }

    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    if (expiresAt && expiresAt < Date.now() + 180_000) {
      try {
        const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
        if (!refErr && refreshed?.session) {
          return { user: refreshed.session.user };
        }
      } catch {
        // Continue with current session if temporary network glitch
      }
    }

    return { user: session.user };
  },
  component: () => <Outlet />,
});
