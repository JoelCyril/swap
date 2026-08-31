import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

const searchSchema = z.object({
  fromItem: z.string().uuid().optional(),
  add: z.boolean().optional(),
});

export const Route = createFileRoute("/_authenticated/new-listing")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "List an Item — SWAP" },
      { name: "description", content: "Post something to trade with your neighbours." },
    ],
  }),
  component: NewListingRedirectPage,
});

function NewListingRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/my-listings", search: { add: true }, replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted-foreground">Opening item manager…</p>
      </div>
    </div>
  );
}
