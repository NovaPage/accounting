// File: src/components/transactions/GlobalAddButton.tsx
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionDrawer } from "@/hooks/useTransactionDrawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Global FAB-like button for opening the Transaction Drawer.
 * Keeps copy in Spanish (UI), code/comments in English.
 */
export default function GlobalAddButton(): JSX.Element {
  const open = useTransactionDrawer((s) => s.open);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            aria-label="Agregar transacción"
            title="Agregar transacción"
            onClick={() => open("expense")}
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Agregar
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Abrir registro de transacción</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
