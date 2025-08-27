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
    window.location.assign("/login");
  };

  return (
    <Button variant="outline" onClick={onClick}>
      Cerrar sesión
    </Button>
  );
}
