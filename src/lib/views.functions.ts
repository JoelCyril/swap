import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { recordView, getViewCount, getBulkViewCounts } from "./views.server";

export const trackListingView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ listingId: z.string().uuid(), visitorKey: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const count = await recordView(data.listingId, data.visitorKey);
    return { viewsCount: count };
  });

export const fetchListingViews = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ listingId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    return { viewsCount: getViewCount(data.listingId) };
  });

export const fetchBulkListingViews = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ listingIds: z.array(z.string().uuid()) }).parse(d))
  .handler(async ({ data }) => {
    return getBulkViewCounts(data.listingIds);
  });
