/**
 * Private dashboard page (Server Component).
 * - Redirects to /sign-in if there is no authenticated user.
 * - Ensures there is always an active space (creates "Casa" if first login).
 * UI strings in Spanish.
 */
import { redirect } from "next/navigation";
import { getServerComponentClient } from "@/lib/supabase/server";
import { requireSpace } from "./guards/requireSpace";
import SignOutButton from "@/components/auth/SignOutButton";
import { JSX } from "react";

export default async function DashboardPage(): Promise<JSX.Element> {
  // 1) Auth check
  const supabase = await getServerComponentClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  const email = data.user.email ?? "usuario";

  // 2) Ensure active space (idempotent)
  const spaceId = await requireSpace();

  // 3) Render UI with guaranteed space
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <p className="text-sm text-muted-foreground">
        Bienvenido, {email}. Espacio activo: {spaceId}
      </p>
      <SignOutButton />
    </main>
  );
}
