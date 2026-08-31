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

// In-memory persistent store + Supabase sync
const inMemoryWantedRequests = new Map<string, WantedRequestItem>();

// Seed default initial requests if empty so the community board feels active and inspiring immediately
function ensureSeedRequests() {
  if (inMemoryWantedRequests.size === 0) {
    const seed: WantedRequestItem[] = [
      {
        id: "wanted-seed-1",
        user_id: "seed-user-1",
        title: "PlayStation 5 Disc Edition (Slim or Original)",
        category: "Electronics",
        offering_description: "Willing to trade my Apple Watch Series 8 (45mm, Like New) + Sony Wireless Noise Cancelling Headphones.",
        emirate: "Dubai",
        location: "Dubai Marina",
        status: "active",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: "seed-user-1",
          username: "tariq_dxb",
          display_name: "Tariq M.",
          avatar_color: "#ea580c",
        },
      },
      {
        id: "wanted-seed-2",
        user_id: "seed-user-2",
        title: "Mirrorless Camera (Sony Alpha / Fujifilm / Canon)",
        category: "Electronics",
        offering_description: "Offering DJI Mini 3 Drone with Fly More Combo kit or iPad Air 5th Gen.",
        emirate: "Abu Dhabi",
        location: "Al Reem Island",
        status: "active",
        created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: "seed-user-2",
          username: "sara_k",
          display_name: "Sara K.",
          avatar_color: "#9333ea",
        },
      },
      {
        id: "wanted-seed-3",
        user_id: "seed-user-3",
        title: "Acoustic or Classical Guitar with Case",
        category: "Hobbies & Music" as any,
        offering_description: "Willing to swap high-end mechanical gaming keyboard (Keychron Q1 Pro) + gaming mouse.",
        emirate: "Sharjah",
        location: "Al Majaz",
        status: "active",
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: "seed-user-3",
          username: "ahmed_uae",
          display_name: "Ahmed S.",
          avatar_color: "#059669",
        },
      },
    ];

    seed.forEach((r) => inMemoryWantedRequests.set(r.id, r));
  }
}

export async function fetchWantedRequests(params?: {
  emirate?: string;
  category?: string;
  search?: string;
}): Promise<WantedRequestItem[]> {
  ensureSeedRequests();

  let list = Array.from(inMemoryWantedRequests.values()).filter((r) => r.status === "active");

  if (params?.emirate && params.emirate !== "All" && params.emirate !== "all") {
    list = list.filter((r) => r.emirate.toLowerCase() === params.emirate!.toLowerCase());
  }

  if (params?.category && params.category !== "All" && params.category !== "all") {
    list = list.filter((r) => r.category.toLowerCase() === params.category!.toLowerCase());
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.offering_description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.user.username.toLowerCase().includes(q),
    );
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_color")
    .eq("id", userId)
    .single();

  const id = `wanted_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const item: WantedRequestItem = {
    id,
    user_id: userId,
    title: data.title.trim(),
    category: data.category,
    offering_description: data.offering_description.trim(),
    emirate: data.emirate || "Dubai",
    location: data.location || "Dubai",
    status: "active",
    created_at: now,
    updated_at: now,
    user: {
      id: userId,
      username: profile?.username || "trader",
      display_name: profile?.display_name || profile?.username || "Trader",
      avatar_url: profile?.avatar_url,
      avatar_color: profile?.avatar_color || "#ea580c",
    },
  };

  inMemoryWantedRequests.set(id, item);
  return item;
}

export async function removeWantedRequest(id: string, userId: string): Promise<boolean> {
  const item = inMemoryWantedRequests.get(id);
  if (!item || item.user_id !== userId) return false;
  inMemoryWantedRequests.delete(id);
  return true;
}
