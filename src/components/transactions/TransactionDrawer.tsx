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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { logInfo } from "@/lib/logging";
import { track } from "@/lib/telemetry";
import { fetchDrawerData, type DrawerData } from "@/app/actions/data";

export type TransactionType = "expense" | "income" | "transfer";



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

/** Real dynamic imports */
const ExpenseForm = React.lazy(() => import("./forms/ExpenseForm"));
const IncomeForm = React.lazy(() => import("./forms/IncomeForm"));
const TransferForm = React.lazy(() => import("./forms/TransferForm"));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  defaultType?: TransactionType;
  onSubmitted?: () => void;
};

export default function TransactionDrawer(props: Props): React.ReactElement {
  const { open, onOpenChange, spaceId, defaultType = "expense", onSubmitted } = props;

  const [tab, setTab] = useState<TransactionType>(defaultType);
  const [data, setData] = useState<DrawerData>({ accounts: [], categories: [] });
  const [loading, setLoading] = useState(false);

  // Reset tab on open
  useEffect(() => {
    if (open) setTab(defaultType);
  }, [open, defaultType]);

  // Fetch data when opened
  useEffect(() => {
    if (open && spaceId) {
      setLoading(true);
      fetchDrawerData(spaceId)
        .then(setData)
        .catch((err) => console.error("Failed to fetch drawer data", err))
        .finally(() => setLoading(false));

      track("transaction_drawer_opened", { type: tab, spaceId });
      logInfo("transaction_drawer_opened", { feature: "transactions", spaceId }, { type: tab });
    }
  }, [open, spaceId, tab]);

  const handleSubmitted = useMemo(
    () => () => {
      onSubmitted?.();
      onOpenChange(false);
    },
    [onOpenChange, onSubmitted],
  );

  if (!spaceId) return <></>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Agregar transacción</SheetTitle>
          <SheetDescription>
            Registra un gasto, ingreso o transferencia en tu espacio actual.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TransactionType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expense">Gasto</TabsTrigger>
              <TabsTrigger value="income">Ingreso</TabsTrigger>
              <TabsTrigger value="transfer">Transferencia</TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            {loading ? (
              <FormSkeleton />
            ) : (
              <>
                <TabsContent value="expense" className="mt-0">
                  <Suspense fallback={<FormSkeleton />}>
                    <ExpenseForm
                      spaceId={spaceId}
                      onSubmitted={handleSubmitted}
                      accounts={data.accounts}
                      categories={data.categories}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="income" className="mt-0">
                  <Suspense fallback={<FormSkeleton />}>
                    <IncomeForm
                      spaceId={spaceId}
                      onSubmitted={handleSubmitted}
                      accounts={data.accounts}
                      categories={data.categories}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="transfer" className="mt-0">
                  <Suspense fallback={<FormSkeleton />}>
                    <TransferForm
                      spaceId={spaceId}
                      onSubmitted={handleSubmitted}
                      accounts={data.accounts}
                    />
                  </Suspense>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
