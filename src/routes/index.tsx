import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        (hash && (hash.includes("access_token") || hash.includes("error"))) ||
        (search && (search.includes("code=") || search.includes("error=")))
      ) {
        // Allow client to process OAuth callback tokens
        return;
      }
    }
    throw redirect({ to: "/listings" });
  },
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Once Supabase auth captures the hash/code, redirect cleanly to listings
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      navigate({ to: "/listings", replace: true });
    });

    supabase.auth.getSession().then(() => {
      navigate({ to: "/listings", replace: true });
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
