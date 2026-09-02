import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const LONG_LIVED_SECONDS = 60 * 60 * 24 * 365 * 20; // 20 years

function adminClient() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)!;
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function repairImageUrl(
  url: string | null | undefined,
  bucket: "listing-images" | "avatars" = "listing-images",
): Promise<string | null | undefined> {
  if (!url || typeof url !== "string") return url;

  const marker = `/storage/v1/object/public/${bucket}/`;
  if (url.includes(marker)) {
    const rawPath = url.split(marker)[1]?.split("?")[0];
    if (rawPath) {
      try {
        const supabase = adminClient();
        const { data } = await supabase.storage.from(bucket).createSignedUrl(decodeURIComponent(rawPath), LONG_LIVED_SECONDS);
        if (data?.signedUrl) return data.signedUrl;
      } catch (e) {
        console.warn("Could not sign URL for path:", rawPath, e);
      }
    }
  }

  return url;
}

export async function repairImageUrls(
  urls: string[] | null | undefined,
  bucket: "listing-images" | "avatars" = "listing-images",
): Promise<string[]> {
  if (!urls || !Array.isArray(urls)) return [];
  const results = await Promise.all(urls.map((u) => repairImageUrl(u, bucket)));
  return results.filter(Boolean) as string[];
}
