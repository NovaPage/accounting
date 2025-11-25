// File: src/components/accounts/AccountList.tsx
"use client";

/**
 * AccountList (presentational)
 * - NO hace fetch a Supabase ni toca v_account_balances.
 * - Recibe filas ya preparadas (SSR) y callbacks para acciones.
 * - Estados: loading/empty/error controlados vía props.
 *
 * UI en español.
 */

import * as React from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MONEY_ACCOUNT_TYPES } from "@/lib/constants";

type MoneyAccountType = "cash" | "bank" | "card";
type AnyAccountType = MoneyAccountType | "other";

export type AccountBalanceRow = {
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
  /** Id de espacio activo (SSR). */
  spaceId: string;

  /** Filas ya resueltas en el servidor (o undefined para mostrar loading). */
  rows?: AccountBalanceRow[];

  /** Texto de error opcional para pintar el banner de error. */
  errorText?: string | null;

  /** Estado de refresco (para deshabilitar el botón “Actualizar”). */
  isRefreshing?: boolean;

  /** Acción para refrescar las filas (p.ej., router.refresh() en el padre). */
  onRefresh?: () => void | Promise<void>;

  /** Abre flujo de edición. */
  onEdit?: (row: AccountBalanceRow) => void;

  /** Archivar fila (el componente muestra confirmación). */
  onArchive?: (row: AccountBalanceRow) => void | Promise<void>;
};

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

export default function AccountList({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  spaceId: _spaceId, // alias para evitar unused var
  rows,
  errorText,
  isRefreshing,
  onRefresh,
  onEdit,
  onArchive,
}: Props): React.ReactElement {
  // ---- Hooks al tope (regla de Hooks)
  const [confirmRow, setConfirmRow] = useState<AccountBalanceRow | null>(null);
  const [archiving, setArchiving] = useState(false);

  // List memorizada para que su referencia sea estable entre renders.
  const list = useMemo(() => rows ?? [], [rows]);

  // Moneda base a partir de la primera fila.
  const baseCurrency = useMemo(
    () => (list.length > 0 ? list[0].currency_code ?? "COP" : "COP"),
    [list],
  );

  // Total “suave” solo de filas en la moneda base.
  const total = useMemo(() => {
    return list.reduce(
      (acc, r) => (r.currency_code === baseCurrency ? acc + (r.balance ?? 0) : acc),
      0,
    );
  }, [list, baseCurrency]);

  // ----- Loading (antes de cualquier return ya declaramos hooks)
  if (rows === undefined && !errorText) {
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

  // ----- Error
  if (errorText) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cuentas</h2>
          {onRefresh ? (
            <Button variant="outline" onClick={() => onRefresh()} disabled={!!isRefreshing}>
              {isRefreshing ? "Actualizando..." : "Reintentar"}
            </Button>
          ) : null}
        </div>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
          {errorText}
        </div>
      </Card>
    );
  }

  // ----- Empty
  if (list.length === 0) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cuentas</h2>
          {onRefresh ? (
            <Button variant="outline" onClick={() => onRefresh()} disabled={!!isRefreshing}>
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          No tienes cuentas activas todavía. Crea una para empezar a registrar.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Header con total y actualizar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Cuentas</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Total (aprox):{" "}
            <span className="font-medium">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: baseCurrency }).format(
                total || 0,
              )}
            </span>
          </div>
          {onRefresh ? (
            <Button variant="outline" size="sm" onClick={() => onRefresh()} disabled={!!isRefreshing}>
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          ) : null}
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Rows */}
      <ul className={`space-y-2 transition-opacity duration-200 ${isRefreshing ? "opacity-50 pointer-events-none" : ""}`}>
        {list.map((row) => {
          const fmt = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: row.currency_code || baseCurrency,
          });
          const isMoneyType = (MONEY_ACCOUNT_TYPES as readonly string[]).includes(row.type);
          const canArchive = isMoneyType;

          return (
            <li
              key={row.account_id}
              className="flex items-center justify-between rounded-xl border bg-card p-3"
            >
              {/* Izquierda: nombre + tipo */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{row.account_name}</span>
                  <Badge variant={typeBadgeVariant(row.type)} className="capitalize">
                    {typeLabel(row.type)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">Moneda: {row.currency_code}</div>
              </div>

              {/* Derecha: saldo + acciones */}
              <div className="flex items-center gap-3">
                <div className="tabular-nums text-right text-sm font-medium">
                  {fmt.format(row.balance ?? 0)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(row)}
                    aria-label={`Editar cuenta ${row.account_name}`}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!canArchive || archiving}
                    onClick={() => setConfirmRow(row)}
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

      {/* Confirmación de archivado */}
      <AlertDialog open={!!confirmRow} onOpenChange={(open) => !open && setConfirmRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar cuenta?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            La cuenta no se eliminará y podrás consultarla más tarde. Esta acción no afecta tus
            movimientos históricos.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiving}
              onClick={async () => {
                if (!confirmRow) return;
                try {
                  setArchiving(true);
                  await onArchive?.(confirmRow);
                } finally {
                  setArchiving(false);
                  setConfirmRow(null);
                }
              }}
            >
              {archiving ? "Archivando..." : "Archivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
