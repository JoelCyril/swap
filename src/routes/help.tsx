import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { submitInquiry, submitMyInquiry } from "@/lib/support.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { LifeBuoy, Mail } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & support — SWAP" },
      { name: "description", content: "Ask the SWAP team anything — send us your inquiry and we'll get back to you by email." },
      { property: "og:title", content: "Help & support — SWAP" },
      { property: "og:description", content: "Contact the SWAP team with your question." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

const EMPTY = { name: "", email: "", subject: "", message: "" };

function HelpPage() {
  const send = useServerFn(submitInquiry);
  const sendAsMe = useServerFn(submitMyInquiry);
  const [form, setForm] = useState({ ...EMPTY });
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const mut = useMutation({
    mutationFn: () => (signedIn ? sendAsMe({ data: form }) : send({ data: form })),
    onSuccess: () => {
      setForm({ ...EMPTY });
      toast.success("Inquiry sent successfully", {
        description: signedIn
          ? "Watch for the moderator reply in “Inquiry updates”."
          : "Our team will review it shortly.",
      });

    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send your inquiry"),
  });

  const field = "mt-1 w-full rounded-2xl border-2 border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-black sm:text-4xl flex items-center gap-2">
          <LifeBuoy className="h-7 w-7 text-primary" /> Help &amp; support
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Need assistance or have questions? You can email us directly at{" "}
          <a
            href="mailto:swapuaeofficial@gmail.com"
            className="font-bold text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            swapuaeofficial@gmail.com
          </a>{" "}
          or fill in the inquiry form below. Signed-in members can track replies in the “Inquiry updates” widget.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/20 bg-primary-soft/40 p-3.5 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Direct Email Support</p>
              <p className="text-xs text-muted-foreground">swapuaeofficial@gmail.com</p>
            </div>
          </div>
          <a
            href="mailto:swapuaeofficial@gmail.com"
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow transition hover:opacity-90"
          >
            Email Us
          </a>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="mt-6 space-y-4 rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-card sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Your name</label>
              <input required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Your email</label>
              <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Subject</label>
            <input required maxLength={140} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">How can we help?</label>
            <textarea required rows={6} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-none`} />
          </div>
          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {mut.isPending ? "Sending…" : "Send inquiry"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Goes straight to the SWAP moderator team
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
