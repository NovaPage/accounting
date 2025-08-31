// File: src/app/dashboard/guards/requireSpace.ts
"use server";

/**
 * SSR guard to ensure there is always an active space for the user.
 * - Calls ensureActiveSpaceId() to either reuse the first existing space or create "Casa".
 * - If onboarding fails, throws an error with a Spanish user-facing message.
 *
 * Usage:
 *   const spaceId = await requireSpace();
 *   // pass spaceId down to your Server Component tree
 */

import { ensureActiveSpaceId } from "@/lib/space";
import { logError } from "@/lib/logging";

export async function requireSpace(): Promise<string> {
  try {
    const spaceId = await ensureActiveSpaceId();
    return spaceId;
  } catch (err) {
    logError("require_space_failed", { feature: "spaces" }, err);
    // User-facing error (Spanish)
    throw new Error(
      "No fue posible obtener tu espacio activo. Intenta de nuevo o contacta soporte."
    );
  }
}
