/**
 * Env helper. Code and comments in English; UI strings elsewhere in Spanish.
 */
export interface AppEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string; // Supabase anon/publishable key
  NEXT_PUBLIC_SUPABASE_SCHEMA: string;
  NEXT_PUBLIC_APP_URL: string; // e.g. http://localhost:3000 or production origin
}

/**
 * Safely read environment variables. Throws early if any is missing.
 */
function readEnv(): AppEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "accounting";

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!appUrl) throw new Error("Missing env: NEXT_PUBLIC_APP_URL");

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    NEXT_PUBLIC_SUPABASE_SCHEMA: schema,
    NEXT_PUBLIC_APP_URL: appUrl,
  };
}

export const env: Readonly<AppEnv> = readEnv();
