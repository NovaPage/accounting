// File: src/components/accounts/AccountsView.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  upsertAccountAction,
  archiveAccountAction,
  type UpsertAccountInput,
  type ArchiveAccountInput,
} from "@/app/actions/accounts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import AccountForm, {
  type AccountFormValues,
  type AccountUpsertInput,
  type AccountUpsertResult,
} from "./AccountForm";
import AccountList from "./AccountList";
import { type AccountBalanceRow } from "@/lib/services/account.service";

// Use imported type


type Props = {
  spaceId: string;
  initialAccounts: AccountBalanceRow[];
};

export default function AccountsView({ spaceId, initialAccounts }: Props) {
  const router = useRouter();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountBalanceRow | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleNewAccount = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleEdit = (row: AccountBalanceRow) => {
    setEditingAccount(row);
    setDialogOpen(true);
  };

  const handleArchive = async (row: AccountBalanceRow) => {
    try {
      // ✅ ArchiveAccountInput requiere { spaceId, accountId }
      const input: ArchiveAccountInput = { spaceId, accountId: row.account_id };
      await archiveAccountAction(input);
      toast.success("Cuenta archivada.");
      startTransition(() => router.refresh());
    } catch (e) {
      const msg =
        (e as { message?: string })?.message ??
        "No fue posible archivar la cuenta. Intenta de nuevo.";
      toast.error(msg);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAccount(null);
  };

  // Valores iniciales del formulario cuando se edita
  const formInitialValues: Partial<AccountFormValues> | undefined = editingAccount
    ? {
      id: editingAccount.account_id,
      name: editingAccount.account_name,
      type: editingAccount.type,
      currency_code: (editingAccount.currency_code as "COP" | "USD" | "EUR") ?? "COP",
      // Fix: Use the real opening balance from the DB, not the calculated total balance
      opening_balance: editingAccount.opening_balance,
      allow_negative: false,
    }
    : undefined;

  // Adaptador: el form entrega AccountUpsertInput (sin spaceId),
  // y la Server Action necesita UpsertAccountInput (con spaceId).
  const handleSubmitAction = async (input: AccountUpsertInput): Promise<AccountUpsertResult> => {
    const actionInput: UpsertAccountInput = { ...input, spaceId };
    return upsertAccountAction(actionInput);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={handleNewAccount}>Nueva cuenta</Button>
      </div>

      <AccountList
        spaceId={spaceId}
        rows={initialAccounts}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onRefresh={() => startTransition(() => router.refresh())}
        isRefreshing={isPending}
      />

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar cuenta" : "Crear nueva cuenta"}</DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Modifica los detalles de tu cuenta."
                : "Ingresa los detalles de la nueva cuenta para empezar a registrar transacciones."}
            </DialogDescription>
          </DialogHeader>

          <AccountForm
            spaceId={spaceId}
            initial={formInitialValues}
            onSubmitAction={handleSubmitAction}
            onSuccess={() => {
              handleDialogClose();
              startTransition(() => router.refresh());
            }}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
