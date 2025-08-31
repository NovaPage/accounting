"use client";

/**
 * Sign-in card that shows:
 * - Google OAuth button
 * - Email & Password forms (login / sign-up with tabs)
 * UI strings in Spanish.
 */
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import EmailPasswordAuth from "@/components/auth/EmailPasswordAuth";
import { Separator } from "@/components/ui/separator";

export interface SignInCardProps {
  /** Optional next path after login (must start with "/"). */
  nextUrl?: string;
}

export default function SignInCard({ nextUrl = "/dashboard" }: SignInCardProps) {
  return (
    <section className="mx-auto w-full max-w-sm p-6 space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Inicia sesión</h1>
        <p className="text-sm text-muted-foreground">
          Accede con Google o con tu correo y contraseña.
        </p>
      </header>

      <GoogleSignInButton nextUrl={nextUrl} />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o</span>
        <Separator className="flex-1" />
      </div>

      <EmailPasswordAuth nextUrl={nextUrl} />

      <p className="text-xs text-muted-foreground">
        Al continuar, aceptas los términos y la política de privacidad.
      </p>
    </section>
  );
}
