// src/lib/supabase/client.ts
/**
 * Supabase browser client (singleton). Use in Client Components only.
 * Code and comments in English. UI strings in Spanish elsewhere.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "./env";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      publicEnv.supabaseUrl,
      publicEnv.supabaseAnonKey
    );
  }
  return browserClient;
}
