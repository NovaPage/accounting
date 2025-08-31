// File: src/components/accounts/ArchiveAccountDialog.tsx
"use client";

/**
 * ArchiveAccountDialog
 * - Accessible confirmation dialog (Radix-based via shadcn/ui).
 * - Calls a Server Action to set `is_archived = true` on `accounts`.
 * - Spanish UI; code and comments in English as requested.
 *
 * Wiring example (Server Action):
 * --------------------------------
 * // File: src/app/dashboard/accounts/actions.ts
 * "use server";
 * import { getServerComponentClient } from "@/lib/supabase/server";
 *
 * export async function archiveAccountAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
 *   const supabase = await getServerComponentClient();
 *   const payload = { is_archived: true } as { is_archived?: boolean };
 *   // @ts-expect-error - in case Database types lag, scope the cast to this call
 *   const { error } = await supabase.from("accounts").update(payload).eq("id", id);
 *   if (error) return { ok: false, message: error.message ?? "No fue posible archivar la cuenta." };
 *   return { ok: true };
 * }
 *
 * Usage:
 * --------------------------------
 * <ArchiveAccountDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   accountId={row.account_id}
 *   accountName={row.account_name}
 *   onArchived={() => queryClient.invalidateQueries({ queryKey: ["accounts","balances", spaceId] })}
 *   archiveAction={archiveAccountAction}
 * />
 */

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

type ArchiveResult = { ok: true } | { ok: false; message: string };

type Props = {
  /** Controls dialog visibility (lifted to parent for full control). */
  open: boolean;
  /** Notified when dialog open state changes (required for accessibility & focus mgmt). */
  onOpenChange: (open: boolean) => void;
  /** Target account id to archive. */
  accountId: string;
  /** Optional account name for friendly copy. */
  accountName?: string;
  /** Server Action to archive the account (must run on the server). */
  archiveAction: (accountId: string) => Promise<ArchiveResult>;
  /** Optional callback invoked after successful archive (e.g., refetch, close parent). */
  onArchived?: () => void;
};

export default function ArchiveAccountDialog(props: Props): React.ReactElement {
  const { open, onOpenChange, accountId, accountName, archiveAction, onArchived } = props;

  const [isPending, startTransition] = useTransition();

  const handleConfirm = (): void => {
    // startTransition expects sync callback; wrap async work inside
    startTransition(() => {
      (async () => {
        if (!accountId) {
          toast.error("Cuenta inválida.");
          return;
        }
        const res = await archiveAction(accountId);
        if (!res.ok) {
          toast.error(res.message || "No fue posible archivar la cuenta. Intenta de nuevo.");
          return;
        }
        toast.success("Cuenta archivada.");
        onOpenChange(false);
        onArchived?.();
      })();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Archivar cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            {accountName ? (
              <>
                La cuenta <span className="font-medium">{accountName}</span> se marcará como
                archivada. No se eliminará y podrás consultarla más tarde. Esta acción no afecta tus
                transacciones históricas.
              </>
            ) : (
              <>
                La cuenta se marcará como archivada. No se eliminará y podrás consultarla más tarde.
                Esta acción no afecta tus transacciones históricas.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Archivando..." : "Archivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
