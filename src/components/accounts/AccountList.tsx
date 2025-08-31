// File: src/components/accounts/AccountList.tsx
"use client";

/**
 * AccountList
 * - Reactive list of money accounts using the `v_account_balances` view.
 * - Minimal filters: current active space is passed as a prop (server-resolved).
 * - Actions: edit (callback) and archive (inline confirm + mutation).
 * - States: loading skeletons, empty state, and error banner.
 *
 * Notes:
 * - Code and comments are in English; UI strings are in Spanish (as requested).
 * - Uses Supabase browser client + React Query for a responsive UX.
 * - Relies on RLS to restrict access to the active user's space.
 */

import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getBrowserClient } from "@/lib/supabase/client";
import { MONEY_ACCOUNT_TYPES } from "@/lib/constants";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

type MoneyAccountType = "cash" | "bank" | "card";
type AnyAccountType = MoneyAccountType | "other";

type AccountBalanceRow = {
  account_id: string;
  account_name: string;
  type: AnyAccountType;
  currency_code: string;
  balance: number;
  is_archived?: boolean | null;
  order_index?: number | null;
  space_id?: string;
};

type Props = {
  /** Active space id, resolved on the server (SSR guard). */
  spaceId: string;
  /** Optional callback to open an edit flow (modal, drawer, route). */
  onEdit?: (accountId: string) => void;
};

const QUERY_KEY = (spaceId: string) => ["accounts", "balances", spaceId] as const;

/** Map account type to a human-readable Spanish label (UI only). */
function typeLabel(t: AnyAccountType): string {
  switch (t) {
    case "cash":
      return "Efectivo";
    case "bank":
      return "Banco";
    case "card":
      return "Tarjeta";
    default:
      return "Otro";
  }
}

/** Badge variant per account type (simple visual cue). */
function typeBadgeVariant(t: AnyAccountType): "default" | "secondary" | "outline" {
  switch (t) {
    case "cash":
      return "default";
    case "bank":
      return "secondary";
    case "card":
      return "outline";
    default:
      return "outline";
  }
}

/** Fetcher: read balances from the view with minimal columns and filters. */
async function fetchBalances(spaceId: string): Promise<AccountBalanceRow[]> {
  const supabase = getBrowserClient();

  const { data, error } = await supabase
    .from("v_account_balances")
    .select(
      [
        "account_id",
        "account_name",
        "type",
        "currency_code",
        "balance",
        "is_archived",
        "order_index",
        "space_id",
      ].join(", "),
    )
    .eq("space_id", spaceId)
    // Spread to satisfy mutable array type; MONEY_ACCOUNT_TYPES is readonly
    .in("type", [...MONEY_ACCOUNT_TYPES])
    .order("order_index", { ascending: true })
    .order("account_name", { ascending: true });

  if (error) {
    throw new Error(error.message || "No fue posible cargar las cuentas.");
  }

  const rows = (data ?? []) as AccountBalanceRow[];
  // If the view includes archived rows, filter them out in UI:
  return rows.filter((r) => !r.is_archived);
}

export default function AccountList({ spaceId, onEdit }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [archiveTarget, setArchiveTarget] = useState<AccountBalanceRow | null>(null);

  // Load balances reactively.
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEY(spaceId),
    queryFn: () => fetchBalances(spaceId),
    staleTime: 30_000, // 30s; balances won't change every millisecond
  });

  // Mutation: archive an account
  const archiveMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const supabase = getBrowserClient();

      // NOTE: In some codegen snapshots, Database types may not expose accounts.Update here,
      // causing the payload to be inferred as `never`. We scope the cast to this line only.
      const payload = { is_archived: true } as { is_archived?: boolean };

      // @ts-expect-error - Narrowing update type due to possible codegen lag; payload is minimal & safe.
      const { error: updErr } = await supabase.from("accounts").update(payload).eq("id", accountId);

      if (updErr) {
        throw new Error(updErr.message || "No fue posible archivar la cuenta.");
      }
      return true;
    },
    onSuccess: async () => {
      toast.success("Cuenta archivada.");
      await qc.invalidateQueries({ queryKey: QUERY_KEY(spaceId) });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { message?: string })?.message ??
        "No fue posible archivar la cuenta. Intenta de nuevo.";
      toast.error(msg);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cuentas</h2>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cuentas</h2>
          <Button variant="outline" onClick={async () => void (await refetch())}>
            Reintentar
          </Button>
        </div>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
          {(error as { message?: string })?.message ??
            "No pudimos cargar tus cuentas. Inténtalo de nuevo."}
        </div>
      </Card>
    );
  }

  const rows = data ?? [];

  // Compute a soft total only for rows sharing the first row's currency (avoid mixing FX).
  const baseCurrency = rows[0]?.currency_code ?? "COP";
  const totalBalance =
    rows.length > 0
      ? rows.reduce((acc, r) => (r.currency_code === baseCurrency ? acc + (r.balance ?? 0) : acc), 0)
      : 0;

  // Empty state
  if (rows.length === 0) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cuentas</h2>
          <Button variant="outline" onClick={async () => void (await refetch())} disabled={isFetching}>
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No tienes cuentas activas todavía. Crea una para empezar a registrar.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Header with aggregated total (soft) and refresh action */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Cuentas</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Total (aprox):{" "}
            <span className="font-medium">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: baseCurrency }).format(
                totalBalance || 0,
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => void (await refetch())}
            disabled={isFetching}
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Rows */}
      <ul className="space-y-2">
        {rows.map((row) => {
          const fmt = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: row.currency_code || baseCurrency,
          });
          const isMoneyType = (MONEY_ACCOUNT_TYPES as readonly string[]).includes(row.type);
          const canArchive = isMoneyType; // archive only money accounts per requirement
          return (
            <li
              key={row.account_id}
              className="flex items-center justify-between rounded-xl border bg-card p-3"
            >
              {/* Left: Name + type badge */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{row.account_name}</span>
                  <Badge variant={typeBadgeVariant(row.type)} className="capitalize">
                    {typeLabel(row.type)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">Moneda: {row.currency_code}</div>
              </div>

              {/* Right: Balance + actions */}
              <div className="flex items-center gap-3">
                <div className="tabular-nums text-right text-sm font-medium">
                  {fmt.format(row.balance ?? 0)}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(row.account_id)}
                    aria-label={`Editar cuenta ${row.account_name}`}
                  >
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!canArchive || archiveMutation.isPending}
                    onClick={() => setArchiveTarget(row)}
                    aria-label={`Archivar cuenta ${row.account_name}`}
                  >
                    Archivar
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Archive confirmation dialog */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar cuenta?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            La cuenta no se eliminará y podrás consultarla más tarde. Esta acción no afecta tus
            transacciones históricas.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveMutation.isPending}
              onClick={async () => {
                if (!archiveTarget) return;
                await archiveMutation.mutateAsync(archiveTarget.account_id);
                setArchiveTarget(null);
              }}
            >
              {archiveMutation.isPending ? "Archivando..." : "Archivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
