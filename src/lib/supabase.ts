import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;
let browserClientCacheKey: string | null = null;

/** Single browser Supabase client (avoids multiple GoTrueClient / auth storage warnings). */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    browserClient = null;
    browserClientCacheKey = null;
    return null;
  }

  const cacheKey = `${url}::${anonKey}`;
  if (browserClient && browserClientCacheKey === cacheKey) {
    return browserClient;
  }

  browserClient = createClient(url, anonKey);
  browserClientCacheKey = cacheKey;
  return browserClient;
}
