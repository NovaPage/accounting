// File: src/components/transactions/forms/TransferForm.tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertTransactionAction } from "@/app/actions/transactions";

const CURRENCIES = ["COP", "USD", "EUR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];
export type SelectOption = { value: string; label: string };

export type TransferFormProps = {
  spaceId: string;
  onSubmitted?: () => void;
  accounts?: SelectOption[];
  defaultCurrency?: CurrencyCode;
};

const TransferSchema = z.object({
  date: z.string().min(1, { message: "Selecciona una fecha." }),
  account_id: z.string().min(1, { message: "Selecciona la cuenta origen." }),
  destination_account_id: z.string().min(1, { message: "Selecciona la cuenta destino." }),
  amount: z.coerce.number().positive({ message: "Ingresa un monto mayor a 0." }),
  currency_code: z.enum(CURRENCIES, { message: "Selecciona una moneda." }),
  note: z
    .string()
    .max(140, { message: "Máximo 140 caracteres." })
    .optional()
    .or(z.literal("")),
  fx_rate_to_space: z.coerce.number().positive({ message: "Ingresa una tasa válida (> 0)." }).default(1),
}).refine((data) => data.account_id !== data.destination_account_id, {
  message: "La cuenta destino debe ser diferente a la de origen.",
  path: ["destination_account_id"],
});

type TransferInput = z.input<typeof TransferSchema>;
type TransferValues = z.output<typeof TransferSchema>;

export default function TransferForm(props: TransferFormProps): React.ReactElement {
  const {
    spaceId,
    onSubmitted,
    accounts = [],
    defaultCurrency = "COP",
  } = props;

  const [isPending, startTransition] = useTransition();

  const form = useForm<TransferInput, undefined, TransferValues>({
    resolver: zodResolver(TransferSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      account_id: accounts[0]?.value ?? "",
      destination_account_id: accounts.length > 1 ? accounts[1].value : "",
      amount: 0,
      currency_code: defaultCurrency,
      note: "",
      fx_rate_to_space: 1,
    },
    mode: "onChange",
  });

  const selectedCurrency = form.watch("currency_code");
  const showFx = selectedCurrency !== defaultCurrency;

  const onSubmit: SubmitHandler<TransferValues> = (values) => {
    startTransition(async () => {
      const res = await upsertTransactionAction({
        spaceId,
        type: "transfer",
        date: values.date,
        amount: values.amount,
        currency_code: values.currency_code,
        account_id: values.account_id,
        destination_account_id: values.destination_account_id,
        description: values.note,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success("Transferencia registrada.");
      onSubmitted?.();
      form.reset();
    });
  };

  const hasAccounts = accounts.length > 0;

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} aria-label="Registrar transferencia">
      {/* Date */}
      <div className="grid gap-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" {...form.register("date")} />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      {/* Source Account */}
      <div className="grid gap-2">
        <Label>Cuenta Origen</Label>
        <Select
          value={form.watch("account_id")}
          onValueChange={(v) => form.setValue("account_id", v, { shouldValidate: true })}
          disabled={!hasAccounts}
        >
          <SelectTrigger aria-label="Cuenta Origen">
            <SelectValue placeholder={hasAccounts ? "Selecciona origen" : "No hay cuentas"} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.account_id && (
          <p className="text-sm text-destructive">{form.formState.errors.account_id.message}</p>
        )}
      </div>

      {/* Destination Account */}
      <div className="grid gap-2">
        <Label>Cuenta Destino</Label>
        <Select
          value={form.watch("destination_account_id")}
          onValueChange={(v) => form.setValue("destination_account_id", v, { shouldValidate: true })}
          disabled={!hasAccounts}
        >
          <SelectTrigger aria-label="Cuenta Destino">
            <SelectValue placeholder={hasAccounts ? "Selecciona destino" : "No hay cuentas"} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.destination_account_id && (
          <p className="text-sm text-destructive">{form.formState.errors.destination_account_id.message}</p>
        )}
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" type="number" step="0.01" inputMode="decimal" {...form.register("amount")} />
          {form.formState.errors.amount && (
            <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Moneda</Label>
          <Select
            value={selectedCurrency}
            onValueChange={(v) => form.setValue("currency_code", v as CurrencyCode, { shouldValidate: true })}
          >
            <SelectTrigger aria-label="Moneda">
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.currency_code && (
            <p className="text-sm text-destructive">{form.formState.errors.currency_code.message}</p>
          )}
        </div>
      </div>

      {/* FX */}
      {showFx && (
        <div className="grid gap-2">
          <Label htmlFor="fx_rate_to_space">Tasa FX hacia {defaultCurrency}</Label>
          <Input
            id="fx_rate_to_space"
            type="number"
            step="0.0001"
            inputMode="decimal"
            {...form.register("fx_rate_to_space")}
          />
          {form.formState.errors.fx_rate_to_space && (
            <p className="text-sm text-destructive">
              {form.formState.errors.fx_rate_to_space.message}
            </p>
          )}
        </div>
      )}

      {/* Note */}
      <div className="grid gap-2">
        <Label htmlFor="note">Nota</Label>
        <Textarea id="note" placeholder="Opcional" rows={3} {...form.register("note")} />
        {form.formState.errors.note && (
          <p className="text-sm text-destructive">{form.formState.errors.note.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending || form.formState.isSubmitting}>
          {isPending || form.formState.isSubmitting ? "Guardando..." : "Guardar transferencia"}
        </Button>
      </div>
    </form>
  );
}
