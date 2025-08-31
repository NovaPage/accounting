// File: src/components/settings/SpaceForm.tsx
"use client";

/**
 * SpaceForm (Client)
 * - Presents a minimal form to change the base currency of the current space.
 * - Delegates write operation to a Server Action `onSubmitAction`.
 * - Uses react-hook-form + zod for client validation.
 *
 * UI strings are in Spanish; code and comments are in English.
 */

import * as React from "react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// ui
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Props = {
  spaceId: string;
  currentName: string;
  currentCurrency: string;
  supportedCurrencies: readonly string[];
  onSubmitAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
};

const Schema = (currencies: readonly string[]) =>
  z.object({
    space_id: z.string().uuid(),
    currency_code: z.enum(currencies as [string, ...string[]]), // enforce selection from allowed set
  });

type FormValues = z.infer<ReturnType<typeof Schema>>;

export default function SpaceForm({
  spaceId,
  currentName,
  currentCurrency,
  supportedCurrencies,
  onSubmitAction,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema(supportedCurrencies)),
    defaultValues: {
      space_id: spaceId,
      currency_code: currentCurrency.toUpperCase(),
    },
    mode: "onChange",
  });

  async function handleSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("space_id", values.space_id);
    fd.set("currency_code", values.currency_code.toUpperCase());

    startTransition(async () => {
      const res = await onSubmitAction(fd);
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  const selected = form.watch("currency_code");

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label className="text-sm">Espacio</Label>
          <div className="text-sm text-muted-foreground">{currentName}</div>
        </div>

        {/* Hidden space id field (kept in react-hook-form state) */}
        <input type="hidden" {...form.register("space_id")} />

        <div className="space-y-1.5">
          <Label htmlFor="currency_code" className="text-sm">
            Moneda base
          </Label>
          <Select
            value={selected}
            onValueChange={(v) => form.setValue("currency_code", v, { shouldValidate: true })}
          >
            <SelectTrigger id="currency_code" className="w-56" aria-label="Seleccionar moneda">
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {supportedCurrencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Este cambio afectará únicamente los registros futuros. El histórico no se recalcula.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isPending || !form.formState.isValid || selected === currentCurrency.toUpperCase()}
          >
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
