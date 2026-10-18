"use client";

/**
 * Simple sign-out button for client components.
 * - UI text in Spanish.
 * - Code and comments in English.
 */
import { Button } from "@/components/ui/button";
import { getBrowserClient } from "@/lib/supabase/client";
import { JSX } from "react";

export default function SignOutButton(): JSX.Element {
  const onClick = async (): Promise<void> => {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    document.cookie = "space_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.assign("/login");
  };

  return (
    <Button variant="outline" onClick={onClick}>
      Cerrar sesión
    </Button>
  );
}
