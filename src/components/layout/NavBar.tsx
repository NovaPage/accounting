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
import { NavMobile } from "./NavMobile";
import GlobalAdd from "@/components/transactions/GlobalAdd";
import { getActiveSpace } from "@/lib/space";
import { getServerComponentClient } from "@/lib/supabase/server";
import { NavTabs } from "./NavTabs";
import { Notifications } from "./Notifications";
import { UserNav } from "./UserNav";

export async function NavBar() {
  const supabase = await getServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, do not render the App Navbar (Landing Page handles its own header if needed, or no header)
  if (!user) {
    return null;
  }

  // Only fetch space if user is authenticated
  let space;
  try {
    space = await getActiveSpace();
  } catch (e) {
    console.error("NavBar space fetch error:", e);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 gap-4">

        {/* Left: Logo & Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            Orbit
          </Link>
          <div className="hidden md:block">
            <NavTabs />
          </div>
        </div>

        {/* Right: Actions & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Work in Space */}
          <div className="flex items-center gap-2 mr-2">
            <div className="hidden sm:block">
              <SpaceSwitcher />
            </div>
            <GlobalAdd space={space || null} />
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <div className="h-4 w-px bg-border mx-2" />
            <ThemeToggle />
            <Notifications />
            <UserNav />
          </div>

          <div className="md:hidden">
            <NavMobile />
          </div>
        </div>
      </div>
    </header>
  );
}
