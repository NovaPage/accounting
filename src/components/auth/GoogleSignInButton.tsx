// src/c
"use client";

import { memo, useCallback, useState } from "react";
import { Chrome, Loader2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * buildCallbackUrl
 * - Builds an absolute redirect URL for Supabase OAuth to send the user back to your app.
 * - Uses NEXT_PUBLIC_SITE_URL (preferred) or window.location.origin as a fallback.
 * - Appends ?next=/path so your /auth/callback route can continue the flow to the desired page.
 */
function buildCallbackUrl(nextUrl: string | null): string | undefined {
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const browserBase = typeof window !== "undefined" ? window.location.origin : "";
  const base = envBase || browserBase;
  if (!base) return undefined; // let Supabase default if no base is available

  const u = new URL("/api/auth/callback", base);
  if (nextUrl) u.searchParams.set("next", nextUrl);
  return u.toString();
}

type GoogleSignInButtonProps = {
  /** Where to redirect after a successful login (landing path after /auth/callback) */
  nextUrl?: string;
  /** Extra classes for styling */
  className?: string;
  /** Custom label for the button (Spanish UX) */
  label?: string;
  /** Called if we detect a local error before the redirect happens */
  onError?: (message: string) => void;
};

/**
 * GoogleSignInButton (Supabase OAuth Classic)
 * - Calls supabase.auth.signInWithOAuth({ provider: 'google' }).
 * - No GIS script, no client-side Google config needed.
 * - Spanish labels for UX, English identifiers/comments for code.
 */
function GoogleSignInButton({
  nextUrl = "/game",
  className = "",
  label = "Continuar con Google",
  onError,
}: GoogleSignInButtonProps) {
  const supabase = getBrowserClient();
  const [loading, setLoading] = useState(false);

  const onClick = useCallback(async () => {
    try {
      setLoading(true);

      // Use Supabase OAuth classic flow
      const redirectTo = buildCallbackUrl(nextUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo, // e.g., http://localhost:3000/auth/callback?next=/game
        },
      });

      // Notes:
      // - In the classic OAuth flow, Supabase will usually perform a redirect immediately,
      //   so code after this line may not run.
      // - If an error is returned synchronously, we handle it here:
      if (error) {
        setLoading(false);
        onError?.(error.message || "No se pudo iniciar sesión con Google.");
      } else if (!data) {
        // Very rare: no redirect + no error
        setLoading(false);
        onError?.("No se pudo iniciar sesión con Google.");
      }
    } catch (e) {
      setLoading(false);
      const message =
        e instanceof Error ? e.message : "No se pudo iniciar sesión con Google.";
      onError?.(message);
    }
  }, [nextUrl, onError, supabase]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:shadow disabled:opacity-60 cursor-pointer"
        aria-label="Continuar con Google"
        title="Continuar con Google"
        aria-busy={loading || undefined}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Abriendo Google…</span>
          </>
        ) : (
          <>
            <Chrome className="h-4 w-4" aria-hidden />
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default memo(GoogleSignInButton);
