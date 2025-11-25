"use server";

import { revalidatePath } from "next/cache";
import { getRouteHandlerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ---------------------------------- Domain ---------------------------------- */

export type TransactionType = "income" | "expense" | "transfer";
export type CurrencyCode = "COP" | "USD" | "EUR";

export type UpsertTransactionInput = {
    id?: string;
    spaceId: string;
    type: TransactionType;
    date: string; // ISO date string YYYY-MM-DD
    amount: number;
    currency_code: CurrencyCode;
    category_id?: string;
    account_id: string; // For income/expense, or Source for transfer
    destination_account_id?: string; // Only for transfer
    description?: string;
    payee?: string;
};

export type TransactionResult =
    | { ok: true; id?: string }
    | { ok: false; message: string };

/* --------------------------------- Guards ----------------------------------- */

function guardInput(v: UpsertTransactionInput): string | null {
    if (!v.spaceId) return "No hay un espacio activo.";
    if (!v.date) return "La fecha es obligatoria.";
    if (v.amount <= 0) return "El monto debe ser mayor a 0.";
    if (!v.account_id) return "La cuenta es obligatoria.";

    if (v.type === "transfer" && !v.destination_account_id) {
        return "La cuenta destino es obligatoria para transferencias.";
    }

    if (v.type === "transfer" && v.account_id === v.destination_account_id) {
        return "La cuenta origen y destino no pueden ser la misma.";
    }

    return null;
}

/* --------------------------------- Actions ---------------------------------- */

export async function upsertTransactionAction(
    values: UpsertTransactionInput
): Promise<TransactionResult> {
    const msg = guardInput(values);
    if (msg) return { ok: false, message: msg };

    const supabase = (await getRouteHandlerClient()) as SupabaseClient;

    try {
        const payload = {
            space_id: values.spaceId,
            type: values.type,
            date: values.date,
            amount: values.amount,
            // currency_code: values.currency_code, // Note: transactions table might not have currency_code yet based on setup.sql
            account_id: values.account_id,
            category_id: values.category_id || null,
            description: values.description?.trim() || null,
            payee: values.payee?.trim() || null,
        };

        // Handle Transfer: Create two records (Expense + Income)
        if (values.type === "transfer") {
            // 1. Outflow from Source
            const { error: err1 } = await supabase.from("transactions").insert({
                ...payload,
                type: "expense", // It's an expense for the source account
                description: values.description?.trim() || `Transferencia a cuenta destino (Auto)`,
                category_id: null, // Transfers usually don't have category
            });
            if (err1) throw err1;

            // 2. Inflow to Destination
            const { error: err2 } = await supabase.from("transactions").insert({
                ...payload,
                account_id: values.destination_account_id,
                type: "income", // It's an income for the destination account
                description: values.description?.trim() || `Transferencia desde cuenta origen (Auto)`,
                category_id: null,
            });
            if (err2) throw err2;

            revalidatePath("/dashboard");
            return { ok: true };
        }

        // Normal Income/Expense
        const { data, error } = await supabase
            .from("transactions")
            .insert(payload)
            .select("id")
            .single();

        if (error) {
            logError("transaction_insert_failed", { feature: "transactions" }, error);
            return { ok: false, message: "Error al guardar la transacción." };
        }

        revalidatePath("/dashboard");
        return { ok: true, id: (data as { id: string }).id };

    } catch (e) {
        logError("transaction_upsert_exception", { feature: "transactions" }, e);
        return { ok: false, message: "Error inesperado." };
    }
}
