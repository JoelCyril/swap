import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InquiryUpdates } from "./InquiryUpdates";

/** Renders the inquiry-updates widget only for signed-in members. */
export function InquiryUpdatesMount() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!signedIn) return null;
  return <InquiryUpdates signedIn />;
}
