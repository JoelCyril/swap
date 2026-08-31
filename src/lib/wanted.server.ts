import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type ItemCategory, type Emirate } from "./db-types";

export interface WantedRequestItem {
  id: string;
  user_id: string;
  title: string;
  category: ItemCategory;
  offering_description: string;
  emirate: Emirate | string;
  location: string;
  status: "active" | "fulfilled" | "cancelled";
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    avatar_color?: string | null;
  };
}

export async function fetchWantedRequests(params?: {
  emirate?: string;
  category?: string;
  search?: string;
}): Promise<WantedRequestItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select(`
        id,
        author_id,
        body,
        created_at,
        updated_at,
        author:profiles!announcements_author_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          avatar_color
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    const list: WantedRequestItem[] = [];

    for (const row of data) {
      if (!row.body || !row.body.startsWith('{"kind":"wanted_request"')) continue;
      try {
        const payload = JSON.parse(row.body);
        if (payload.kind !== "wanted_request") continue;

        const author = row.author as any;
        list.push({
          id: row.id,
          user_id: row.author_id,
          title: payload.title || "Wanted Item",
          category: payload.category || "Electronics",
          offering_description: payload.offering_description || "",
          emirate: payload.emirate || "Dubai",
          location: payload.location || "Dubai",
          status: "active",
          created_at: row.created_at,
          updated_at: row.updated_at || row.created_at,
          user: {
            id: row.author_id,
            username: author?.username || "trader",
            display_name: author?.display_name || author?.username || "Trader",
            avatar_url: author?.avatar_url,
            avatar_color: author?.avatar_color || "#ea580c",
          },
        });
      } catch {}
    }

    let filtered = list;

    if (params?.emirate && params.emirate !== "All" && params.emirate !== "all") {
      filtered = filtered.filter((r) => r.emirate.toLowerCase() === params.emirate!.toLowerCase());
    }

    if (params?.category && params.category !== "All" && params.category !== "all") {
      filtered = filtered.filter((r) => r.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.offering_description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.user.username.toLowerCase().includes(q),
      );
    }

    return filtered;
  } catch (err) {
    console.error("[Wanted] Error fetching wanted requests:", err);
    return [];
  }
}

export async function insertWantedRequest(
  userId: string,
  data: {
    title: string;
    category: ItemCategory;
    offering_description: string;
    emirate: string;
    location: string;
  },
): Promise<WantedRequestItem> {
  const payload = {
    kind: "wanted_request",
    title: data.title.trim(),
    category: data.category,
    offering_description: data.offering_description.trim(),
    emirate: data.emirate || "Dubai",
    location: data.location || "Dubai",
  };

  const { data: row, error } = await supabaseAdmin
    .from("announcements")
    .insert({
      author_id: userId,
      body: JSON.stringify(payload),
      image_urls: [],
    })
    .select(`
      id,
      author_id,
      body,
      created_at,
      updated_at,
      author:profiles!announcements_author_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        avatar_color
      )
    `)
    .single();

  if (error || !row) {
    throw new Error(error?.message || "Failed to persist wanted request");
  }

  const author = row.author as any;
  return {
    id: row.id,
    user_id: row.author_id,
    title: payload.title,
    category: payload.category as ItemCategory,
    offering_description: payload.offering_description,
    emirate: payload.emirate,
    location: payload.location,
    status: "active",
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    user: {
      id: row.author_id,
      username: author?.username || "trader",
      display_name: author?.display_name || author?.username || "Trader",
      avatar_url: author?.avatar_url,
      avatar_color: author?.avatar_color || "#ea580c",
    },
  };
}

export async function removeWantedRequest(id: string, userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("announcements")
    .delete()
    .eq("id", id)
    .eq("author_id", userId);

  return !error;
}
