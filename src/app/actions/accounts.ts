// File: src/app/actions/accounts.ts
"use server";

/**
 * Server Actions for Accounts (create/update/archive).
 * - Single source of truth for DB writes (server-only).
 * - UI messages in Spanish. Code/comments in English.
 */

import { revalidatePath } from "next/cache";
import { getRouteHandlerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/logging";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ---------------------------------- Domain ---------------------------------- */

export type AccountType = "cash" | "bank" | "card" | "other";
export type CurrencyCode = "COP" | "USD" | "EUR";

export type UpsertAccountInput = {
  id?: string; // insert when absent; update when present
  spaceId: string;

  name: string;
  type: AccountType;
  currency_code: CurrencyCode;

  allow_negative: boolean;
  opening_balance: number; // only used on insert in Hito 1
};

export type ArchiveAccountInput = {
  spaceId: string;
  accountId: string;
  archived?: boolean; // default true
};

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

/* --------------------------------- Guards ----------------------------------- */

function guardUpsertInput(v: UpsertAccountInput): string | null {
  const name = v.name?.trim();
  if (!name) return "El nombre es obligatorio.";
  if (name.length < 2) return "El nombre debe tener al menos 2 caracteres.";

  if (!["cash", "bank", "card", "other"].includes(v.type))
    return "Tipo de cuenta inválido.";

  if (!["COP", "USD", "EUR"].includes(v.currency_code))
    return "Moneda inválida.";

  if (typeof v.allow_negative !== "boolean")
    return "El indicador de saldo negativo es inválido.";

  if (typeof v.opening_balance !== "number" || Number.isNaN(v.opening_balance))
    return "El saldo inicial debe ser un número.";

  if (!v.spaceId) return "No hay un espacio activo.";
  return null;
}

function guardArchiveInput(v: ArchiveAccountInput): string | null {
  if (!v.spaceId) return "No hay un espacio activo.";
  if (!v.accountId) return "Falta el identificador de la cuenta.";
  return null;
}

/* --------------------------------- Actions ---------------------------------- */

/**
 * Create or update an account.
 * - Insert when `id` is not provided.
 * - Update when `id` is provided (opening_balance ignored in updates for Hito 1).
 */
export async function upsertAccountAction(
  values: UpsertAccountInput,
): Promise<ActionResult> {
  const msg = guardUpsertInput(values);
  if (msg) return { ok: false, message: msg };

  // Use non-parameterized client to avoid `never` when Database types lag behind
  const supabase = (await getRouteHandlerClient()) as SupabaseClient;

  try {
    const name = values.name.trim();

    if (!values.id) {
      // INSERT
      const insertPayload = {
        space_id: values.spaceId,
        name,
        type: values.type,
        currency_code: values.currency_code,
        allow_negative: values.allow_negative,
        opening_balance: values.opening_balance,
      };

      const { data, error } = await supabase
        .from("accounts")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) {
        logError(
          "account_insert_failed",
          { feature: "accounts" },
          { message: error.message, code: (error as { code?: string }).code },
        );

        if ((error as { code?: string }).code === "23505") {
          return {
            ok: false,
            message: "Ya existe una cuenta con ese nombre en este espacio.",
          };
        }

        return {
          ok: false,
          message:
            "No pudimos crear la cuenta. Intenta de nuevo o contacta soporte.",
        };
      }

      const newId = (data as { id?: string } | null)?.id;
      logInfo("account_insert_ok", { feature: "accounts" }, { id: newId });

      revalidatePath("/dashboard");
      return { ok: true, id: newId };
    }

    // UPDATE
    const updatePayload = {
      name,
      type: values.type,
      currency_code: values.currency_code,
      allow_negative: values.allow_negative,
      opening_balance: values.opening_balance,
    };

    const { error: upErr } = await supabase
      .from("accounts")
      .update(updatePayload)
      .eq("id", values.id)
      .eq("space_id", values.spaceId);

    if (upErr) {
      logError(
        "account_update_failed",
        { feature: "accounts" },
        { id: values.id, message: upErr.message, code: (upErr as { code?: string }).code },
      );

      if ((upErr as { code?: string }).code === "23505") {
        return {
          ok: false,
          message: "Ya existe una cuenta con ese nombre en este espacio.",
        };
      }

      return {
        ok: false,
        message:
          "No pudimos actualizar la cuenta. Intenta de nuevo o contacta soporte.",
      };
    }

    logInfo("account_update_ok", { feature: "accounts" }, { id: values.id });

    revalidatePath("/dashboard");
    return { ok: true, id: values.id };
  } catch (e: unknown) {
    logError("account_upsert_exception", { feature: "accounts" }, e);
    return {
      ok: false,
      message:
        "Ocurrió un error inesperado al guardar la cuenta. Intenta nuevamente.",
    };
  }
}

/**
 * Archive / Unarchive an account by id (scoped to space).
 * - Default: archive (set true).
 */
export async function archiveAccountAction(
  values: ArchiveAccountInput,
): Promise<ActionResult> {
  const msg = guardArchiveInput(values);
  if (msg) return { ok: false, message: msg };

  const supabase = (await getRouteHandlerClient()) as SupabaseClient;

  try {
    const { error } = await supabase
      .from("accounts")
      .update({ is_archived: values.archived ?? true })
      .eq("id", values.accountId)
      .eq("space_id", values.spaceId);

    if (error) {
      logError(
        "account_archive_failed",
        { feature: "accounts" },
        { id: values.accountId, message: error.message, code: (error as { code?: string }).code },
      );
      return {
        ok: false,
        message:
          "No pudimos actualizar el estado de la cuenta. Intenta nuevamente.",
      };
    }

    logInfo(
      "account_archive_ok",
      { feature: "accounts" },
      { id: values.accountId },
    );

    revalidatePath("/dashboard");
    return { ok: true, id: values.accountId };
  } catch (e: unknown) {
    logError("account_archive_exception", { feature: "accounts" }, e);
    return {
      ok: false,
      message:
        "Ocurrió un error inesperado al actualizar la cuenta. Intenta nuevamente.",
    };
  }
}
