// src/lib/supabase/env.ts
/**
 * Centralized environment accessors for Supabase.
 * - Public: safe to expose on the client (RLS applies).
 * - Server: private keys for backend only (Node/Edge).
 * Code and comments in English. UI strings must be in Spanish (elsewhere).
 */

export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string; // aka "publishable" key
};

function readPublicEnv(): PublicEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return { supabaseUrl, supabaseAnonKey };
}

export const publicEnv: Readonly<PublicEnv> = readPublicEnv();

// ────────────────────────────────────────────────────────────────────────────────
// Optional server-only secrets (not used by the SSR client; do not import in RSC)
// Wrapped in a function to avoid accidental import in the client bundle.
export type ServerEnv = {
  serviceRoleKey: string;
  jwtSecret: string;
};

export function getServerEnv(): ServerEnv {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? "";

  if (!serviceRoleKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return { serviceRoleKey, jwtSecret };
}
