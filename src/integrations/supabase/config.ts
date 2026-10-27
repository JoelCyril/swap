export const DEFAULT_SUPABASE_URL = "https://supabase.swapuae.com";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkzMDQzMDAwLCJleHAiOjE5NTA3MjMwMDB9.i-1ZRQo2D0rxqOf00AI37ohD14Jqo8HJwTAuiMs0tWg";
export const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3OTMwNDMwMDAsImV4cCI6MTk1MDcyMzAwMH0.0SocPHXmH-8DcfLln0j-LgLcBHI31CaB1ebkvPQriIQm";

export function resolveSupabaseUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || url.includes("supabase.co")) {
    return DEFAULT_SUPABASE_URL;
  }
  return url;
}

export function resolveSupabaseAnonKey(key?: string | null): string {
  if (
    !key ||
    typeof key !== "string" ||
    key.includes("aacorcmqfjnfpmwauxwx") ||
    key.includes("ramwgcdselnqtcadkaok")
  ) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return key;
}

export function resolveSupabaseServiceRoleKey(key?: string | null): string {
  if (
    !key ||
    typeof key !== "string" ||
    key.includes("aacorcmqfjnfpmwauxwx") ||
    key.includes("ramwgcdselnqtcadkaok")
  ) {
    return DEFAULT_SUPABASE_SERVICE_ROLE_KEY;
  }
  return key;
}
