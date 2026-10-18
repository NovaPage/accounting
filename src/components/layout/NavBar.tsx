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
import GlobalAddButton from "@/components/transactions/GlobalAddButton";
import GlobalDrawer from "@/components/transactions/GlobalDrawer";
import { getActiveSpace } from "@/lib/space";
import { getServerComponentClient } from "@/lib/supabase/server";
import { NavTabs } from "./NavTabs";
import { Notifications } from "./Notifications";
import { UserNav } from "./UserNav";
import { MobileBottomNav } from "./MobileBottomNav";

export async function NavBar() {
  const supabase = await getServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, do not render the App Navbar (Landing Page handles its own header if needed, or no header)
  if (!user) {
    return null;
  }

  // Only fetch space if user is authenticated
  let space = null;
  try {
    space = await getActiveSpace();
  } catch (e) {
    console.error("NavBar space fetch error:", e);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 gap-4">

          {/* Left: Logo & Space Switcher & Desktop Tabs */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/dashboard" className="font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
              Orbit
            </Link>
            
            {/* Space Switcher always accessible on mobile and desktop */}
            <div className="flex items-center">
              <SpaceSwitcher />
            </div>

            <div className="hidden md:block">
              <NavTabs />
            </div>
          </div>

          {/* Right: Actions (Desktop GlobalAddButton + Controls) & Mobile Controls */}
          <div className="flex items-center gap-2">
            {/* Desktop Add Button */}
            <div className="hidden md:flex items-center gap-2 mr-1">
              <GlobalAddButton />
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <div className="hidden sm:block">
                <Notifications />
              </div>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      {/* Global Transaction Drawer mounted cleanly at root level */}
      <GlobalDrawer space={space} />

      {/* Standard Mobile Bottom Navigation Bar with Action Center */}
      <MobileBottomNav space={space} />
    </>
  );
}
