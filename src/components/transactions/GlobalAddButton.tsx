// File: src/components/transactions/GlobalAddButton.tsx
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionDrawer } from "@/hooks/useTransactionDrawer";

/**
 * Global FAB-like button for opening the Transaction Drawer on desktop.
 * Keeps copy in Spanish (UI), code/comments in English.
 */
export default function GlobalAddButton(): JSX.Element {
  const open = useTransactionDrawer((s) => s.open);

  return (
    <Button
      type="button"
      aria-label="Agregar transacción"
      onClick={() => open("expense")}
      className="gap-2 shadow-xs"
    >
      <Plus className="size-4" aria-hidden="true" />
      <span>Agregar</span>
    </Button>
  );
}
