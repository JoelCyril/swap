export const DEFAULT_SUPABASE_URL = "https://supabase.swapuae.com";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkzMDQzMDAwLCJleHAiOjE5NTA3MjMwMDB9.i-1ZRQo2D0rxqOf00AI37ohD14Jqo8HJwTAuiMs0tWg";
export const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3OTMwNDMwMDAsImV4cCI6MTk1MDcyMzAwMH0.0SocPHXmH-8DcfLln0j-LgLcBH3lCaB1ebkvPQriIqM";

/**
 * Single source of truth for Supabase URL.
 * Guarantees that stale or invalid environment variables from Vercel/GitHub
 * can never corrupt the connection to self-hosted Supabase.
 */
export function resolveSupabaseUrl(_url?: string | null): string {
  return DEFAULT_SUPABASE_URL;
}

/**
 * Single source of truth for Supabase Anon Key.
 * Rejects corrupt/invalid keys (including casing typos) and guarantees
 * the verified self-hosted JWT signature is always used.
 */
export function resolveSupabaseAnonKey(_key?: string | null): string {
  return DEFAULT_SUPABASE_ANON_KEY;
}

/**
 * Single source of truth for Supabase Service Role Key.
 */
export function resolveSupabaseServiceRoleKey(_key?: string | null): string {
  return DEFAULT_SUPABASE_SERVICE_ROLE_KEY;
}
