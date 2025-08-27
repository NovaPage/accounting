// src/app/api/auth/callback/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getRouteHandlerClient } from "@/lib/supabase/server";
import type { AuthError } from "@supabase/supabase-js";

/**
 * /api/auth/callback?code=...&next=/game
 * - Exchanges the OAuth `code` for a Supabase session and sets cookies.
 * - Redirects to `next` (defaults to /game).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (!code) {
    const to = new URL("/login", req.url);
    to.searchParams.set("error", "missing_code");
    return NextResponse.redirect(to, { headers: { "Cache-Control": "no-store" } });
  }

  const supabase = await getRouteHandlerClient();

  // Pass the "code" directly (avoids URL parsing edge cases)
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Log without using `any`
    const status: number | undefined =
      (error as AuthError).status !== undefined ? (error as AuthError).status : undefined;

    console.error("[oauth.exchangeCodeForSession] error:", {
      message: error.message,
      status,
      name: error.name,
    });

    const to = new URL("/login", req.url);
    to.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(to, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.redirect(new URL(next, req.url), {
    headers: { "Cache-Control": "no-store" },
  });
}
