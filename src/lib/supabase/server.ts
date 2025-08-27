// src/lib/supabase/server.ts
// Server-side Supabase clients for different Next.js contexts:
// - getServerComponentClient(): Server Components / Server Actions (read-only cookies)
// - getRouteHandlerClient(): Route Handlers (writable cookies)
// - getServerStaticClient(): Static server client (NO cookies) for cached readers (unstable_cache)

import { cookies } from "next/headers";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "./env";
import type { Database } from "@/types/database";

/**
 * Server Component / Server Action client (read-only cookie store).
 * Uses getAll/setAll shape required by @supabase/ssr@0.6.1.
 * DO NOT use this inside unstable_cache() because it calls cookies().
 */
export async function getServerComponentClient(): Promise<SupabaseClient<Database>> {
  const store = await cookies(); // Next 15: async

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          // Map Next cookies -> { name, value }[]
          return store.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll() {
          // No-op on RSC (avoid writes)
        },
      },
    }
  );
}

/**
 * Route Handler client (writable cookie store).
 * Enables auth flows (login/out) by writing response cookies.
 * Safe for API routes and actions that must mutate auth cookies.
 */
export async function getRouteHandlerClient(): Promise<SupabaseClient<Database>> {
  const store = await cookies(); // Next 15: async

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return store.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptionsWithName }[]) {
          for (const { name, value, options } of cookiesToSet) {
            // Next sets/removes via .set; removal comes as maxAge=0 from SSR
            store.set({ name, value, ...options });
          }
        },
      },
    }
  );
}

/**
 * Static server client (NO cookies).
 * Use this inside unstable_cache() or any cached server function.
 * RLS applies as 'anon' unless you pass a service role (not recommended here).
 */
export function getServerStaticClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
