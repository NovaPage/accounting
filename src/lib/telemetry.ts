// File: src/lib/telemetry.ts

/**
 * Minimal product telemetry (fire-and-forget).
 * - Never block the UX.
 * - Fail silently.
 * - Small, typed schema for MVP.
 */

import { TELEMETRY_ENABLED } from "@/lib/constants";
import { logWarn } from "@/lib/logging";

export type TelemetryEvent =
  | "onboarding_start"
  | "onboarding_ok"
  | "onboarding_error"
  | "transaction_drawer_opened"
  | "space_currency_changed";

export type TelemetryProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: TelemetryEvent, props?: TelemetryProps): void {
  try {
    if (!TELEMETRY_ENABLED) return;

    const payload = {
      event,
      props: props ?? {},
      at: new Date().toISOString(),
    };

    // For MVP, just log to console (server or client). Replace with a real sink later.
    console.info({ kind: "telemetry", ...payload });
  } catch (e) {
    // Never throw out; just warn internally.
    logWarn("telemetry_failed", { feature: "telemetry" }, e);
  }
}
