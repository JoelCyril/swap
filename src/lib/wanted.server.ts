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
    const { data: rows, error } = await supabaseAdmin
      .from("announcements")
      .select("id, author_id, body, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !rows) return [];

    const wantedRows = rows.filter(
      (r) => r.body && typeof r.body === "string" && r.body.startsWith('{"kind":"wanted_request"'),
    );

    if (wantedRows.length === 0) return [];

    const authorIds = [...new Set(wantedRows.map((r) => r.author_id).filter(Boolean))];

    const { data: profiles } =
      authorIds.length > 0
        ? await supabaseAdmin
            .from("profiles")
            .select("id, username, display_name, avatar_url, avatar_color")
            .in("id", authorIds)
        : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const list: WantedRequestItem[] = [];

    for (const row of wantedRows) {
      try {
        const payload = JSON.parse(row.body);
        if (payload.kind !== "wanted_request") continue;

        const author = profileMap.get(row.author_id);
        list.push({
          id: row.id,
          user_id: row.author_id,
          title: payload.title || "Wanted Item",
          category: (payload.category as ItemCategory) || "Electronics",
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
    .select("id, author_id, body, created_at, updated_at")
    .single();

  if (error || !row) {
    throw new Error(error?.message || "Failed to persist wanted request");
  }

  const { data: author } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_color")
    .eq("id", userId)
    .maybeSingle();

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

export async function updateWantedRequest(
  userId: string,
  id: string,
  data: {
    title: string;
    category: ItemCategory;
    offering_description: string;
    emirate: string;
    location: string;
  },
): Promise<WantedRequestItem> {
  // Check if announcement exists
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("announcements")
    .select("id, author_id, body, created_at")
    .eq("id", id)
    .maybeSingle();

  if (findErr || !existing) {
    throw new Error("Wanted request not found");
  }

  // Check permission: author or admin
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (existing.author_id !== userId && !isAdmin) {
    throw new Error("You do not have permission to edit this request");
  }

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
    .update({
      body: JSON.stringify(payload),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, author_id, body, created_at, updated_at")
    .single();

  if (error || !row) {
    throw new Error(error?.message || "Failed to update wanted request");
  }

  const { data: author } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_color")
    .eq("id", existing.author_id)
    .maybeSingle();

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
  const { data: existing } = await supabaseAdmin
    .from("announcements")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return false;

  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (existing.author_id !== userId && !isAdmin) {
    throw new Error("You do not have permission to delete this request");
  }

  const { error } = await supabaseAdmin
    .from("announcements")
    .delete()
    .eq("id", id);

  return !error;
}
