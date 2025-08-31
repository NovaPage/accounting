// File: src/components/accounts/AccountForm.tsx
"use client";

/**
 * AccountForm
 * - Create/Edit account form using React Hook Form + Zod (v4 API).
 * - Calls a Server Action (passed via props) to insert/update in `accounts`.
 * - Spanish UI; code and comments in English as requested.
 *
 * Server Action wiring example:
 * --------------------------------
 * // File: src/app/dashboard/accounts/actions.ts
 * "use server";
 * import { getServerComponentClient } from "@/lib/supabase/server";
 * import type { AccountUpsertInput, AccountUpsertResult } from "@/components/accounts/AccountForm";
 *
 * export async function upsertAccountAction(input: AccountUpsertInput): Promise<AccountUpsertResult> {
 *   const supabase = await getServerComponentClient();
 *   const payload = {
 *     space_id: input.space_id,
 *     name: input.name,
 *     type: input.type,
 *     currency_code: input.currency_code,
 *     allow_negative: input.allow_negative,
 *     opening_balance: input.opening_balance,
 *   };
 *
 *   if (input.id) {
 *     const { error } = await supabase.from("accounts").update(payload).eq("id", input.id);
 *     if (error) return { ok: false, message: error.message ?? "No fue posible actualizar la cuenta." };
 *     return { ok: true, id: input.id };
 *   }
 *
 *   const { data, error } = await supabase.from("accounts").insert(payload).select("id").single();
 *   if (error) return { ok: false, message: error.message ?? "No fue posible crear la cuenta." };
 *   return { ok: true, id: (data?.id as string) ?? undefined };
 * }
 */

import * as React from "react";
import { useTransition } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

/** Literal unions to feed Zod enums (as const to satisfy readonly tuple requirement) */
const ACCOUNT_TYPES = ["cash", "bank", "card", "other"] as const;
const CURRENCIES = ["COP", "USD", "EUR"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type CurrencyCode = (typeof CURRENCIES)[number];

/** Payload contract for the Server Action */
export type AccountUpsertInput = {
  id?: string;
  space_id: string;
  name: string;
  type: AccountType;
  currency_code: CurrencyCode;
  allow_negative: boolean;
  opening_balance: number;
};

export type AccountUpsertResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

/** Zod schema (Zod v4) */
const AccountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, { message: "Escribe un nombre." })
    .max(80, { message: "Máximo 80 caracteres." }),
  type: z.enum(ACCOUNT_TYPES, { message: "Selecciona un tipo." }),
  currency_code: z.enum(CURRENCIES, { message: "Selecciona una moneda." }),
  allow_negative: z.boolean(),
  opening_balance: z
    .coerce.number()
    .refine((n) => Number.isFinite(n), { message: "Ingresa un número válido." })
    .min(0, { message: "No puede ser negativo." }),
});

export type AccountFormValues = z.infer<typeof AccountSchema>;

type Props = {
  /** Active space id (SSR). */
  spaceId: string;
  /** Optional initial values for edit flows. */
  initial?: Partial<AccountFormValues> & { id?: string };
  /** Server Action: insert/update in `accounts`. Must be defined in a server file. */
  onSubmitAction: (input: AccountUpsertInput) => Promise<AccountUpsertResult>;
  /** Optional callback after success (e.g., close modal, refetch parent). */
  onSuccess?: (createdOrUpdatedId?: string) => void;
  /** Optional cancel callback to close a modal/drawer. */
  onCancel?: () => void;
};

/** Helper: map RHF values to the server action input payload */
function toUpsertInput(spaceId: string, values: AccountFormValues): AccountUpsertInput {
  return {
    id: values.id,
    space_id: spaceId,
    name: values.name.trim(),
    type: values.type,
    currency_code: values.currency_code,
    allow_negative: values.allow_negative,
    opening_balance: values.opening_balance,
  };
}

export default function AccountForm(props: Props): React.ReactElement {
  const { spaceId, initial, onSubmitAction, onSuccess, onCancel } = props;
  const [isPending, startTransition] = useTransition();

  /** Explicitly type the resolver to avoid unknown/number mismatches */
  const accountResolver: Resolver<AccountFormValues> =
    // `as unknown as` is a narrow, localized cast to align versions across deps.
    (zodResolver(AccountSchema) as unknown as Resolver<AccountFormValues>);

  const form = useForm<AccountFormValues>({
    resolver: accountResolver,
    mode: "onChange",
    defaultValues: {
      id: initial?.id ?? undefined,
      name: initial?.name ?? "",
      type: (initial?.type as AccountType) ?? "cash",
      currency_code: (initial?.currency_code as CurrencyCode) ?? "COP",
      allow_negative: initial?.allow_negative ?? false,
      opening_balance:
        typeof initial?.opening_balance === "number" ? initial.opening_balance : 0,
    },
  });

  const isEdit = Boolean(initial?.id);

  /** Submit handler typed with RHF to satisfy TS */
  const onSubmit: SubmitHandler<AccountFormValues> = (values) => {
    const payload = toUpsertInput(spaceId, values);

    // `startTransition` expects a sync callback; wrap async work inside.
    startTransition(() => {
      (async () => {
        const res = await onSubmitAction(payload);
        if (!res.ok) {
          toast.error(res.message || "No pudimos guardar la cuenta. Inténtalo de nuevo.");
          return;
        }
        toast.success(isEdit ? "Cuenta actualizada." : "Cuenta creada.");
        onSuccess?.(res.id);

        // Optional: reset after create
        if (!isEdit) {
          form.reset({
            id: undefined,
            name: "",
            type: "cash",
            currency_code: "COP",
            allow_negative: false,
            opening_balance: 0,
          });
        }
      })();
    });
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
      aria-label={isEdit ? "Editar cuenta" : "Crear cuenta"}
    >
      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          placeholder="Ej. Bancolombia"
          {...form.register("name")}
          aria-invalid={!!form.formState.errors.name}
          aria-errormessage={form.formState.errors.name ? "name-error" : undefined}
        />
        {form.formState.errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Type */}
      <div className="grid gap-2">
        <Label>Tipo</Label>
        <Select
          value={form.watch("type")}
          onValueChange={(v) => form.setValue("type", v as AccountType, { shouldValidate: true })}
        >
          <SelectTrigger aria-label="Tipo de cuenta">
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="bank">Banco</SelectItem>
            <SelectItem value="card">Tarjeta</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.type && (
          <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
        )}
      </div>

      {/* Currency */}
      <div className="grid gap-2">
        <Label>Moneda</Label>
        <Select
          value={form.watch("currency_code")}
          onValueChange={(v) =>
            form.setValue("currency_code", v as CurrencyCode, { shouldValidate: true })
          }
        >
          <SelectTrigger aria-label="Moneda">
            <SelectValue placeholder="Selecciona una moneda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COP">COP — Peso Colombiano</SelectItem>
            <SelectItem value="USD">USD — Dólar</SelectItem>
            <SelectItem value="EUR">EUR — Euro</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.currency_code && (
          <p className="text-sm text-destructive">{form.formState.errors.currency_code.message}</p>
        )}
      </div>

      {/* Opening balance */}
      <div className="grid gap-2">
        <Label htmlFor="opening_balance">Saldo inicial</Label>
        <Input
          id="opening_balance"
          type="number"
          step="0.01"
          inputMode="decimal"
          {...form.register("opening_balance")}
          aria-invalid={!!form.formState.errors.opening_balance}
          aria-errormessage={
            form.formState.errors.opening_balance ? "opening-balance-error" : undefined
          }
        />
        {form.formState.errors.opening_balance && (
          <p id="opening-balance-error" className="text-sm text-destructive">
            {form.formState.errors.opening_balance.message}
          </p>
        )}
      </div>

      {/* Allow negative */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="allow_negative"
          checked={form.watch("allow_negative")}
          onCheckedChange={(v) => form.setValue("allow_negative", Boolean(v))}
          aria-describedby="allow-negative-hint"
        />
        <Label htmlFor="allow_negative">Permitir saldo negativo</Label>
      </div>
      <p id="allow-negative-hint" className="text-xs text-muted-foreground -mt-2">
        Útil para tarjetas o descubiertos pactados.
      </p>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending || form.formState.isSubmitting}>
          {isPending || form.formState.isSubmitting
            ? isEdit
              ? "Guardando..."
              : "Creando..."
            : isEdit
            ? "Guardar cambios"
            : "Crear cuenta"}
        </Button>
      </div>
    </form>
  );
}
