// File: src/components/transactions/TransactionDrawer.tsx
"use client";

/**
 * TransactionDrawer
 * - Drawer container with tabs (Expense/Income/Transfer).
 * - Lazy-loads the form content per tab (Suspense fallback).
 * - Spanish UI; code and comments in English as requested.
 *
 * How to replace stub lazy loaders with real forms (when you add them):
 * --------------------------------------------------------------------
 * 1) Create:
 *    - src/components/transactions/forms/ExpenseForm.tsx
 *    - src/components/transactions/forms/IncomeForm.tsx
 *    - src/components/transactions/forms/TransferForm.tsx
 *    Each should default-export a component with props: { spaceId: string; onSubmitted?: () => void }
 *
 * 2) Replace the three lazy declarations below with real dynamic imports, e.g.:
 *    const ExpenseForm = React.lazy(
 *      () =>
 *        import("./forms/ExpenseForm") as Promise<{
 *          default: React.ComponentType<TransactionFormProps>;
 *        }>
 *    );
 *
 *    (Do the same for IncomeForm and TransferForm.)
 */

import * as React from "react";
import { useEffect, useMemo, useState, Suspense } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { logInfo } from "@/lib/logging";
import { track } from "@/lib/telemetry";

export type TransactionType = "expense" | "income" | "transfer";

type TransactionFormProps = {
  /** Active space id (required to scope queries and currency). */
  spaceId: string;
  /** Callback fired after successful submit (e.g., to refetch parent lists or close drawer). */
  onSubmitted?: () => void;
};

/** Simple skeleton shown while loading a form lazily. */
function FormSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="h-6 w-1/3 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
      <div className="h-6 w-1/2 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
      <div className="h-10 w-36 rounded bg-muted" />
    </div>
  );
}

/** Stub content (safe placeholder until real forms exist). */
function StubForm({
  onSubmitted,
  label,
}: TransactionFormProps & { label: string }): React.ReactElement {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Esta es una vista previa del formulario de{" "}
        <span className="font-medium">{label}</span>. Agrega el archivo real en{" "}
        <code className="rounded bg-muted px-1">forms/{label}Form.tsx</code>.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            onSubmitted?.();
            toast.success("Simulado: guardado.");
          }}
        >
          Guardar
        </Button>
        <Button variant="outline" onClick={() => toast.info("Simulado: cancelar.")}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Lazy stubs (compile-friendly). Replace with real dynamic imports when forms exist. */
const ExpenseForm = React.lazy(async () => ({
  default: (props: TransactionFormProps) => <StubForm {...props} label="Expense" />,
}));
const IncomeForm = React.lazy(async () => ({
  default: (props: TransactionFormProps) => <StubForm {...props} label="Income" />,
}));
const TransferForm = React.lazy(async () => ({
  default: (props: TransactionFormProps) => <StubForm {...props} label="Transfer" />,
}));

type Props = {
  /** Controls drawer visibility (external state: useTransactionDrawer or Navbar "+" button). */
  open: boolean;
  /** Notified when drawer open state changes (accessibility / focus management). */
  onOpenChange: (open: boolean) => void;
  /** Active space id (SSR guard ensures this exists). */
  spaceId: string;
  /** Initial tab when opening the drawer. */
  defaultType?: TransactionType;
  /** Called after a form reports a successful submit. Typical behavior: close drawer & refetch. */
  onSubmitted?: () => void;
};

export default function TransactionDrawer(props: Props): React.ReactElement {
  const { open, onOpenChange, spaceId, defaultType = "expense", onSubmitted } = props;

  const [tab, setTab] = useState<TransactionType>(defaultType);

  // Reset the tab each time the drawer opens with a different defaultType.
  useEffect(() => {
    if (open) setTab(defaultType);
  }, [open, defaultType]);

  // Telemetry when opened
  useEffect(() => {
    if (open) {
      track("transaction_drawer_opened", { type: tab, spaceId });
      // Move 'type' into the extra payload (not in ctx) to satisfy LogContext type
      logInfo("transaction_drawer_opened", { feature: "transactions", spaceId }, { type: tab });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close + notify helper
  const handleSubmitted = useMemo(
    () => () => {
      onSubmitted?.();
      onOpenChange(false);
    },
    [onOpenChange, onSubmitted],
  );

  // Defensive: if spaceId is missing (should not happen due to SSR guard)
  if (!spaceId) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>Agregar transacción</SheetTitle>
            <SheetDescription>
              No se detectó un espacio activo. Vuelve a intentarlo.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Error: falta <code>spaceId</code>.
          </div>
          <div className="mt-4">
            <SheetClose asChild>
              <Button variant="outline">Cerrar</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Agregar transacción</SheetTitle>
          <SheetDescription>
            Registra un gasto, ingreso o transferencia en tu espacio actual.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TransactionType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expense" aria-label="Gasto">
                Gasto
              </TabsTrigger>
              <TabsTrigger value="income" aria-label="Ingreso">
                Ingreso
              </TabsTrigger>
              <TabsTrigger value="transfer" aria-label="Transferencia">
                Transferencia
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            <TabsContent value="expense" className="mt-0">
              <Suspense fallback={<FormSkeleton />}>
                <ExpenseForm spaceId={spaceId} onSubmitted={handleSubmitted} />
              </Suspense>
            </TabsContent>

            <TabsContent value="income" className="mt-0">
              <Suspense fallback={<FormSkeleton />}>
                <IncomeForm spaceId={spaceId} onSubmitted={handleSubmitted} />
              </Suspense>
            </TabsContent>

            <TabsContent value="transfer" className="mt-0">
              <Suspense fallback={<FormSkeleton />}>
                <TransferForm spaceId={spaceId} onSubmitted={handleSubmitted} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 flex justify-end">
          <SheetClose asChild>
            <Button variant="outline" aria-label="Cerrar">
              Cerrar
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
