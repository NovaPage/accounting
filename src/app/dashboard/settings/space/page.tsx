// File: src/app/dashboard/settings/space/page.tsx
/**
 * Settings → Space (Server Component)
 * - Loads current space (id, name, currency_code) using the active space cookie.
 * - Exposes a Server Action to update the base currency for the space.
 * - Validates server input with Zod and respects RLS via authenticated user session.
 * - Revalidates dashboard routes after successful update.
 *
 * UI strings are in Spanish; code and comments are in English.
 */

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getServerComponentClient } from "@/lib/supabase/server";
import { readActiveSpaceIdCookie } from "@/lib/space";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { logError, logInfo } from "@/lib/logging";

import SpaceForm from "@/components/settings/SpaceForm";

type SpaceRow = {
  id: string;
  name: string | null;
  currency_code: string;
};

const UpdateCurrencySchema = z.object({
  space_id: z.string().uuid(),
  currency_code: z.enum(SUPPORTED_CURRENCIES),
});

/**
 * Narrow helper to satisfy generated types that mark `.update(...)` as `never`.
 * We intentionally scope the cast to THIS call only, avoiding `any`.
 */
function asUpdate<T extends object>(payload: T): never {
  return payload as unknown as never;
}

/**
 * Server Action: update the base currency for a space.
 * - RLS should ensure the current user can update this space row.
 * - Only updates the `currency_code` field.
 */
async function updateSpaceCurrency(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  "use server";

  try {
    const parsed = UpdateCurrencySchema.safeParse({
      space_id: String(formData.get("space_id") ?? ""),
      currency_code: String(formData.get("currency_code") ?? "").toUpperCase(),
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Datos inválidos. Verifica la moneda seleccionada.",
      };
    }

    const { space_id, currency_code } = parsed.data;

    const supabase = await getServerComponentClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { ok: false, message: "No hay un usuario autenticado." };
    }

    // Perform the update with a scoped cast to satisfy TS without altering generated types.
    const { error: updErr } = await supabase
      .from("spaces")
      .update(asUpdate({ currency_code: currency_code as string }))
      .eq("id", space_id)
      .limit(1);

    if (updErr) {
      logError(
        "space_currency_update_failed",
        { feature: "spaces", userId: user.id, spaceId: space_id },
        updErr,
      );
      return {
        ok: false,
        message: "No fue posible cambiar la moneda. Intenta de nuevo.",
      };
    }

    logInfo("space_currency_update_ok", {
      feature: "spaces",
      userId: user.id,
      spaceId: space_id,
    });

    // Revalidate key dashboard routes
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/settings/space");

    return {
      ok: true,
      message: "Moneda base actualizada. Afectará registros futuros.",
    };
  } catch (e) {
    logError("space_currency_update_exception", { feature: "spaces" }, e);
    return { ok: false, message: "Ocurrió un error inesperado." };
  }
}

export default async function SpaceSettingsPage() {
  // 1) Resolve active space id from cookie
  const activeSpaceId = await readActiveSpaceIdCookie();
  if (!activeSpaceId) {
    // If no space cookie exists here, the dashboard guard should have created it.
    // Fallback to a 404 to avoid leaking details.
    notFound();
  }

  // 2) Fetch current space row via RLS
  const supabase = await getServerComponentClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("id, name, currency_code")
    .eq("id", activeSpaceId)
    .limit(1)
    .maybeSingle<SpaceRow>();

  if (error || !data) {
    notFound();
  }

  // 3) Render form with current values and server action
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Configuración del espacio</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Cambia la moneda base de tu espacio. Este ajuste afecta solo registros futuros; el histórico no se recalcula.
      </p>

      <SpaceForm
        spaceId={data.id}
        currentName={data.name ?? "Espacio"}
        currentCurrency={data.currency_code}
        supportedCurrencies={SUPPORTED_CURRENCIES as readonly string[]}
        onSubmitAction={updateSpaceCurrency}
      />
    </main>
  );
}
