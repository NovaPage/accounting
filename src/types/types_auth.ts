/**
 * Minimal cookie options type compatible with NextResponse cookies API
 * and supabase-ssr cookie adapter callbacks.
 */
export type CookieOptions = {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
};
