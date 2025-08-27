"use client";

/**
 * login card that displays the Google OAuth button.
 * - Receives nextUrl to preserve post-login redirect.
 * - All UI strings in Spanish.
 */
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { JSX } from "react";

export interface SignInCardProps {
  /** Optional next path after login (must start with "/"). */
  nextUrl?: string;
}

export default function SignInCard({ nextUrl = "/dashboard" }: SignInCardProps): JSX.Element {
  return (
    <section className="mx-auto w-full max-w-sm p-6">
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Inicia sesión</h1>
          <p className="text-sm text-muted-foreground">
            Continúa con tu cuenta de Google para acceder.
          </p>
        </header>

        <GoogleSignInButton nextUrl={nextUrl} />

        <p className="text-xs text-muted-foreground">
          Al continuar, aceptas los términos y la política de privacidad.
        </p>
      </div>
    </section>
  );
}
