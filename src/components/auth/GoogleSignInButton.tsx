"use client";

/**
 * GoogleSignInButton (Supabase OAuth Classic)
 * - Adds cursor-pointer, hover/active states, and smooth transitions.
 * - Spanish labels for UX; code/comments in English.
 */
import { memo, useCallback, useMemo, useState } from "react";
import { Chrome, Loader2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";

function buildCallbackUrl(nextUrl: string | null): string | undefined {
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const browserBase = typeof window !== "undefined" ? window.location.origin : "";
  const base = envBase || browserBase;
  if (!base) return undefined;
  const u = new URL("/api/auth/callback", base);
  if (nextUrl) u.searchParams.set("next", nextUrl);
  return u.toString();
}

export type GoogleSignInButtonProps = {
  nextUrl?: string;
  className?: string;
  label?: string;
  onError?: (message: string) => void;
};

function GoogleSignInButton({
  nextUrl = "/dashboard",
  className = "",
  label = "Continuar con Google",
  onError,
}: GoogleSignInButtonProps): JSX.Element {
  const supabase = getBrowserClient();
  const [loading, setLoading] = useState<boolean>(false);
  const redirectTo = useMemo<string | undefined>(() => buildCallbackUrl(nextUrl), [nextUrl]);

  const onClick = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error || !data) {
        setLoading(false);
        onError?.(error?.message ?? "No se pudo iniciar sesión con Google.");
      }
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "No se pudo iniciar sesión con Google.";
      onError?.(msg);
    }
  }, [redirectTo, onError, supabase]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium
                   cursor-pointer transition-all duration-150
                   hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:shadow
                   active:scale-[.98] disabled:opacity-60"
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
