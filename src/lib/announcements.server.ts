import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { resolveSupabaseUrl, resolveSupabaseAnonKey } from "@/integrations/supabase/config";

export function publicClient() {
  const url = resolveSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const key = resolveSupabaseAnonKey(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}
