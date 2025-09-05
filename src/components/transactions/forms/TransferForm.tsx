// File: src/components/transactions/forms/IncomeForm.tsx
"use client";

/**
 * IncomeForm (stub for Hito 1)
 * - Minimal fields + shallow validation (Zod).
 * - No persistence yet: simulates success and calls `onSubmitted`.
 * - Spanish UI; code/comments in English.
 */

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

const CURRENCIES = ["COP", "USD", "EUR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];
export type SelectOption = { value: string; label: string };

export type IncomeFormProps = {
  spaceId: string;
  onSubmitted?: () => void;
  accounts?: SelectOption[];
  categories?: SelectOption[]; // income categories
  defaultCurrency?: CurrencyCode;
};

const IncomeSchema = z.object({
  date: z.string().min(1, { message: "Selecciona una fecha." }),
  account_id: z.string().min(1, { message: "Selecciona una cuenta." }),
  amount: z.coerce.number().positive({ message: "Ingresa un monto mayor a 0." }),
  currency_code: z.enum(CURRENCIES, { message: "Selecciona una moneda." }),
  category_id: z.string().min(1, { message: "Selecciona una categoría." }),
  note: z
    .string()
    .max(140, { message: "Máximo 140 caracteres." })
    .optional()
    .or(z.literal("")),
  fx_rate_to_space: z.coerce.number().positive({ message: "Ingresa una tasa válida (> 0)." }).default(1),
});

type IncomeInput = z.input<typeof IncomeSchema>;
type IncomeValues = z.output<typeof IncomeSchema>;

export default function IncomeForm(props: IncomeFormProps): React.ReactElement {
  const {
    spaceId: _spaceId,
    onSubmitted,
    accounts = [],
    categories = [],
    defaultCurrency = "COP",
  } = props;
  void _spaceId;

  const [isPending, startTransition] = useTransition();

  const form = useForm<IncomeInput, undefined, IncomeValues>({
    resolver: zodResolver(IncomeSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      account_id: accounts[0]?.value ?? "",
      amount: 0,
      currency_code: defaultCurrency,
      category_id: categories[0]?.value ?? "",
      note: "",
      fx_rate_to_space: 1,
    },
    mode: "onChange",
  });

  const selectedCurrency = form.watch("currency_code");
  const showFx = selectedCurrency !== defaultCurrency;

  const onSubmit: SubmitHandler<IncomeValues> = () => {
    startTransition(() => {
      toast.success("Ingreso simulado guardado.");
      onSubmitted?.();
      form.reset({
        date: new Date().toISOString().slice(0, 10),
        account_id: accounts[0]?.value ?? "",
        amount: 0,
        currency_code: defaultCurrency,
        category_id: categories[0]?.value ?? "",
        note: "",
        fx_rate_to_space: 1,
      });
    });
  };

  const hasAccounts = accounts.length > 0;
  const hasCategories = categories.length > 0;

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} aria-label="Registrar ingreso">
      {/* Date */}
      <div className="grid gap-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" {...form.register("date")} />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      {/* Account */}
      <div className="grid gap-2">
        <Label>Cuenta</Label>
        <Select
          value={form.watch("account_id")}
          onValueChange={(v) => form.setValue("account_id", v, { shouldValidate: true })}
          disabled={!hasAccounts}
        >
          <SelectTrigger aria-label="Cuenta">
            <SelectValue placeholder={hasAccounts ? "Selecciona una cuenta" : "No hay cuentas"} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!hasAccounts && (
          <p className="text-sm text-muted-foreground">Crea primero una cuenta en “Cuentas”.</p>
        )}
        {form.formState.errors.account_id && (
          <p className="text-sm text-destructive">{form.formState.errors.account_id.message}</p>
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

      {/* Category */}
      <div className="grid gap-2">
        <Label>Categoría</Label>
        <Select
          value={form.watch("category_id")}
          onValueChange={(v) => form.setValue("category_id", v, { shouldValidate: true })}
          disabled={!hasCategories}
        >
          <SelectTrigger aria-label="Categoría">
            <SelectValue placeholder={hasCategories ? "Selecciona una categoría" : "No hay categorías"} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!hasCategories && (
          <p className="text-sm text-muted-foreground">Aún no hay categorías disponibles.</p>
        )}
        {form.formState.errors.category_id && (
          <p className="text-sm text-destructive">{form.formState.errors.category_id.message}</p>
        )}
      </div>

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
          {isPending || form.formState.isSubmitting ? "Guardando..." : "Guardar ingreso"}
        </Button>
      </div>
    </form>
  );
}
