import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listFavourites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favourites")
      .select("listing_id, listing:listings(*, owner:profiles!listings_owner_profile_fkey(*))")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((r) => r.listing as { id: string; status: string } | null)
      .filter((l): l is NonNullable<typeof l> => !!l && l.status !== "removed");
  });

export const toggleFavourite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listing_id: string }) => z.object({ listing_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: listing } = await context.supabase
      .from("listings")
      .select("owner_id, title")
      .eq("id", data.listing_id)
      .maybeSingle();
    if (!listing) throw new Error("That listing no longer exists");
    if (listing.owner_id === context.userId) throw new Error("You can't save your own listing");

    const { data: existing } = await context.supabase
      .from("favourites")
      .select("listing_id")
      .eq("user_id", context.userId)
      .eq("listing_id", data.listing_id)
      .maybeSingle();
    if (existing) {
      await context.supabase
        .from("favourites")
        .delete()
        .eq("user_id", context.userId)
        .eq("listing_id", data.listing_id);
      return { favourited: false };
    }
    await context.supabase
      .from("favourites")
      .insert({ user_id: context.userId, listing_id: data.listing_id });

    const { data: me } = await context.supabase
      .from("profiles")
      .select("username")
      .eq("id", context.userId)
      .maybeSingle();
    const { notifyUser } = await import("./notifications.server");
    await notifyUser({
      userId: listing.owner_id,
      type: "save",
      title: "Someone saved your listing",
      body: `@${me?.username ?? "A user"} saved "${listing.title}"`,
      link: `/listings/${data.listing_id}`,
    });
    return { favourited: true };
  });

export const listMyFavouriteIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("favourites")
      .select("listing_id")
      .eq("user_id", context.userId);
    return (data ?? []).map((r) => r.listing_id);
  });
