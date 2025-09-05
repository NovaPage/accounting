// File: src/app/dashboard/page.tsx

/**
 * Private dashboard page (Server Component).
 * - Redirects to /login if there is no authenticated user.
 * - Ensures there is always an active space (creates "Casa" if first login).
 * - Fetches initial account data on the server.
 * UI strings in Spanish.
 */

import { redirect } from "next/navigation";
import { JSX } from "react";
import { getServerComponentClient } from "@/lib/supabase/server";
import { requireSpace } from "./guards/requireSpace";
import { fetchAccounts } from "@/lib/queries/accounts";
import AccountsView from "@/components/accounts/AccountsView";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function DashboardPage(): Promise<JSX.Element> {
  // 1) Auth check (server-side)
  const supabase = await getServerComponentClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  const email = data.user.email ?? "usuario";

  // 2) Ensure active space (returns string)
  const spaceId: string = await requireSpace();

  // 3) Fetch initial data for the page on the server
  const initialAccounts = await fetchAccounts(spaceId);

  // 4) Render UI with a guaranteed space and initial data
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido, {email}.
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* Client component responsible for all account interactions */}
      <AccountsView spaceId={spaceId} initialAccounts={initialAccounts} />
      
    </div>
  );
}
