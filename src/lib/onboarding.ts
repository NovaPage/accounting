// File: src/lib/onboarding.ts
"use server";

/**
 * Server-only entry point to ensure the user is onboarded.
 * - Retrieves the authenticated user from Supabase SSR client.
 * - Calls the onboarding RPC (idempotent).
 * - Returns the resulting space id.
 * - Emits minimal telemetry for product insights.
 *
 * All user-facing error messages are in Spanish.
 * All code and comments are in English.
 */

import { getServerComponentClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { track } from "@/lib/telemetry";
import { logError, logInfo } from "@/lib/logging";
import type { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";

type EnsureOnboardedOptions = {
  currencyCode?: string;
};

/** Narrow types for the RPC we call (kept local to avoid altering generated types). */
type OnboardFirstLoginArgs = {
  p_user_id: string;
  p_currency_code: string; // server has default, but we always pass an explicit code
};
type OnboardFirstLoginReturn = string;

export async function ensureOnboarded(
  opts?: EnsureOnboardedOptions,
): Promise<string> {
  // Use the Server Component client (read-only cookie store)
  const supabase = await getServerComponentClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    logError("ensure_onboarded_no_user", { feature: "onboarding" }, userErr);
    // User-facing (Spanish)
    throw new Error("No hay un usuario autenticado. Por favor inicia sesión.");
  }

  const userId = user.id;
  const currency = (opts?.currencyCode ?? DEFAULT_CURRENCY).toUpperCase();

  track("onboarding_start", { userId });
  logInfo("onboarding_rpc_call", { feature: "onboarding", userId });

  // ---------------------------------------------------------------------------
  // The generated Database type does not include this RPC signature yet.
  // We pass the real args at runtime, but narrow the static type locally:
  // 1) Cast the args value to `unknown` then to `undefined` to satisfy the
  //    (missing) generated signature without using `any`.
  // 2) Cast the rpc response to a PostgrestSingleResponse<OnboardFirstLoginReturn>.
  //    This is safe because the SQL function returns a uuid::text (space id).
  // ---------------------------------------------------------------------------
  const rpcArgs: OnboardFirstLoginArgs = {
    p_user_id: userId,
    p_currency_code: currency,
  };

  // Cast to any to bypass missing RPC definition in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcResponse = await (supabase as any).rpc(
    "onboard_first_login",
    (rpcArgs as unknown) as undefined,
  );

  const {
    data: spaceId,
    error,
  } = rpcResponse as PostgrestSingleResponse<OnboardFirstLoginReturn>;
  // ---------------------------------------------------------------------------

  if (error) {
    logError("onboarding_rpc_error", { feature: "onboarding", userId }, error as PostgrestError);
    track("onboarding_error", { userId });
    // User-facing (Spanish)
    throw new Error(
      "No pudimos finalizar tu configuración inicial. Inténtalo de nuevo o contacta soporte.",
    );
  }

  if (!spaceId || typeof spaceId !== "string") {
    logError(
      "onboarding_invalid_space_id",
      { feature: "onboarding", userId },
      { spaceId },
    );
    track("onboarding_error", { userId });
    // User-facing (Spanish)
    throw new Error(
      "No se obtuvo el espacio inicial. Vuelve a intentar o contacta soporte.",
    );
  }

  track("onboarding_ok", { userId, spaceId });
  logInfo("onboarding_done", { feature: "onboarding", userId, spaceId });

  return spaceId;
}
