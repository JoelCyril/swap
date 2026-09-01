import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchWantedRequests,
  insertWantedRequest,
  updateWantedRequest,
  removeWantedRequest,
  type WantedRequestItem,
} from "./wanted.server";
import { CATEGORIES } from "./db-types";

export const listWantedRequests = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        emirate: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .optional()
      .parse(d),
  )
  .handler(async ({ data }) => {
    return await fetchWantedRequests(data);
  });

export const createWantedRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        category: z.string().min(1),
        offering_description: z.string().min(1).max(2000),
        emirate: z.string().optional().default("Dubai"),
        location: z.string().optional().default("Dubai"),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    return await insertWantedRequest(context.userId, data as any);
  });

export const editWantedRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1),
        title: z.string().min(1).max(200),
        category: z.string().min(1),
        offering_description: z.string().min(1).max(2000),
        emirate: z.string().optional().default("Dubai"),
        location: z.string().optional().default("Dubai"),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    return await updateWantedRequest(context.userId, id, rest as any);
  });

export const deleteWantedRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    return await removeWantedRequest(data.id, context.userId);
  });

export const getWantedRequest = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { fetchWantedRequestById } = await import("./wanted.server");
    return await fetchWantedRequestById(data.id);
  });
