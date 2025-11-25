// File: src/components/layout/NavBar.tsx
/**
 * Top navigation bar (Server Component).
 * - Renders links and client controls (ThemeToggle).
 * - Embeds SpaceSwitcher (Server) for SSR data and server action.
 *
 * UI strings in Spanish; code and comments in English.
 */

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle"; // client component is fine inside server
import SpaceSwitcher from "./SpaceSwitcher";
import GlobalAdd from "@/components/transactions/GlobalAdd";
import { getActiveSpace } from "@/lib/space";
import { getServerComponentClient } from "@/lib/supabase/server";

export async function NavBar() {
  const supabase = await getServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <header className="w-full border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Orbit
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login">Iniciar Sesión</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
    );
  }

  // Only fetch space if user is authenticated
  let space;
  try {
    space = await getActiveSpace();
  } catch (e) {
    // Fallback if space fetch fails (e.g. during onboarding edge cases)
    console.error("NavBar space fetch error:", e);
    return (
      <header className="w-full border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Orbit
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <ThemeToggle />
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className="w-full border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Orbit
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/forms">Forms</Link>
          <Link href="/theme">Theme</Link>

          {/* Right-side controls */}
          {/* Space switcher (Server) for SSR fetch + server action */}
          <SpaceSwitcher />

          <GlobalAdd space={space} />

          {/* Theme toggle (Client) */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
