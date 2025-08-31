"use client";

/**
 * Home page with OAuth deep-link fallback.
 * If the root receives ?code=..., forward it to /api/auth/callback
 * so the app can exchange the code and then redirect to /dashboard.
 * UI strings are Spanish; code + comments are English.
 */
import type { JSX } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home(): JSX.Element {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const next = "/dashboard";
      const url = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(
        next
      )}`;
      window.location.replace(url);
    }
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Bienvenido 👋</h1>
      <p className="text-muted-foreground">
        Este starter incluye shadcn/ui, theming, React Query, formularios con RHF + Zod,
        linting, CI, analytics y más.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard">
          <Button>Abrir Panel</Button>
        </Link>
        <Link href="/forms">
          <Button variant="outline">Abrir Formularios</Button>
        </Link>
        <Link href="/theme">
          <Button variant="ghost">Abrir Tema</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Iniciar sesión</Button>
        </Link>
      </div>
    </section>
  );
}
