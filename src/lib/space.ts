// File: src/lib/space.ts
"use server";

/**
 * Space utilities (server-only).
 * - Read/write active space id via secure cookies.
 * - Fetch first space id for the current user as fallback.
 * - Ensure a valid active space id exists.
 *
 * Notes:
 * - Next 15 forbids writing cookies during RSC render. Only Server Actions/Route Handlers can set cookies.
 * - Therefore, this module never writes cookies during SSR guards. It only returns a valid space id.
 * - Persisting the cookie is done in Server Actions / Route Handlers (e.g., Space Switcher).
 * - Listing spaces uses a SECURITY DEFINER RPC to avoid recursive RLS and stack depth issues.
 */

import { cookies } from "next/headers";
import { getServerComponentClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY, SPACE_COOKIE, SPACE_COOKIE_MAX_AGE_DAYS } from "@/lib/constants";
import { ensureOnboarded } from "@/lib/onboarding";
import { logError, logInfo, logWarn } from "@/lib/logging";

type SpaceRow = {
  id: string;
  name: string | null;
  currency_code: string | null;
};

const cookieMaxAgeSeconds = SPACE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

/** Read active space id from secure server cookies (Next 15: cookies() is async). */
export async function readActiveSpaceIdCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(SPACE_COOKIE)?.value ?? null;
  return value && value.length > 0 ? value : null;
}

/**
 * Best-effort cookie setter.
 * - In RSC context, Next will throw if we try to set cookies.
 * - Use ONLY from Server Actions or Route Handlers.
 */
export async function writeActiveSpaceIdCookieSafe(spaceId: string): Promise<boolean> {
  try {
    const jar = await cookies();
    jar.set(SPACE_COOKIE, spaceId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAgeSeconds,
    });
    return true;
  } catch (e) {
    logWarn("space_cookie_write_blocked", { feature: "spaces", spaceId }, e);
    return false;
  }
}

/** Best-effort cookie clear; same behavior as write. */
export async function clearActiveSpaceIdCookieSafe(): Promise<boolean> {
  try {
    const jar = await cookies();
    jar.set(SPACE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return true;
  } catch (e) {
    logWarn("space_cookie_clear_blocked", { feature: "spaces" }, e);
    return false;
  }
}

/** Fetch a single space by id (minimal shape). */
async function fetchSpaceById(id: string): Promise<SpaceRow | null> {
  const supabase = await getServerComponentClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("id, name, currency_code")
    .eq("id", id)
    .limit(1)
    .maybeSingle<{ id: string; name: string | null; currency_code: string | null }>();

  if (error || !data) return null;
  return { id: data.id, name: data.name ?? null, currency_code: data.currency_code ?? null };
}

/**
 * Fetch the user's spaces via SECURITY DEFINER RPC to avoid recursive RLS.
 * - Returns minimal shape for UI.
 * - Orders by membership joined_at then by creation date (handled in the RPC).
 */
export async function fetchUserSpaces(): Promise<SpaceRow[]> {
  const supabase = await getServerComponentClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    logError("fetch_spaces_no_user", { feature: "spaces" }, userErr);
    return [];
  }

  type RpcRow = { id: string; name: string | null; currency_code: string | null };

  // The generated Database types may not include the RPC yet; scope suppression to this call.
  // @ts-expect-error - typed Database does not yet surface get_user_spaces signature
  const { data, error } = await supabase.rpc("get_user_spaces", { p_user_id: user.id });

  if (error) {
    logWarn(
      "fetch_spaces_rpc_failed",
      { feature: "spaces", userId: user.id },
      {
        code: (error as { code?: string } | null)?.code,
        message: (error as { message?: string } | null)?.message,
        cause: error,
      },
    );

    // Fallback: try active cookie space (single-row read) to keep UI functional.
    const activeId = await readActiveSpaceIdCookie();
    if (activeId) {
      const active = await fetchSpaceById(activeId);
      if (active) return [active];
    }
    return [];
  }

  const rows = (data ?? []) as RpcRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? null,
    currency_code: r.currency_code ?? null,
  }));
}

/** Get the first available space id for the current user (by RPC order). */
export async function getFirstSpaceId(): Promise<string | null> {
  const spaces = await fetchUserSpaces();
  return spaces.length > 0 ? spaces[0].id : null;
}

/**
 * Ensure there is an active space id (SSR-safe).
 * - Tries cookie; if missing, runs onboarding (idempotent) and returns the space id.
 * - DOES NOT write cookies here (to avoid RSC write restrictions/warnings).
 * - Persist cookie later from a Server Action / Route Handler if you need to.
 */
export async function ensureActiveSpaceId(currencyCode?: string): Promise<string> {
  const cookieSpace = await readActiveSpaceIdCookie();
  if (cookieSpace) {
    logInfo("space_cookie_ok", { feature: "spaces", spaceId: cookieSpace });
    return cookieSpace;
  }

  const spaceId = await ensureOnboarded({
    currencyCode: (currencyCode ?? DEFAULT_CURRENCY).toUpperCase(),
  });

  // Do not attempt to write cookies here (SSR render). Let callers persist if needed.
  logInfo("space_resolved_without_cookie_write", { feature: "spaces", spaceId });

  return spaceId;
}

/**
 * Persist the active space id cookie (Server Action / Route Handler ONLY).
 * - Use this if you want to store the resolved spaceId for subsequent requests.
 */
export async function persistActiveSpaceId(spaceId: string): Promise<boolean> {
  const ok = await writeActiveSpaceIdCookieSafe(spaceId);
  if (ok) logInfo("space_cookie_set", { feature: "spaces", spaceId });
  return ok;
}

/**
 * Replace the active space id cookie if the given id belongs to the current user.
 * - Use from Server Actions / Route Handlers (e.g., Space Switcher).
 * - Falls back to a valid id if the requested one is not allowed.
 */
export async function selectActiveSpaceId(nextSpaceId: string): Promise<string> {
  try {
    const spaces = await fetchUserSpaces();
    const allowed = new Set(spaces.map((s: SpaceRow) => s.id));

    if (!allowed.has(nextSpaceId)) {
      logError("space_select_not_allowed", { feature: "spaces", spaceId: nextSpaceId });
      const fallback = spaces[0]?.id ?? (await getFirstSpaceId()) ?? (await ensureActiveSpaceId());
      await writeActiveSpaceIdCookieSafe(fallback);
      return fallback;
    }

    await writeActiveSpaceIdCookieSafe(nextSpaceId);
    return nextSpaceId;
  } catch (e) {
    logError("space_select_failed", { feature: "spaces" }, e);
    const fallback = (await getFirstSpaceId()) ?? (await ensureActiveSpaceId());
    await writeActiveSpaceIdCookieSafe(fallback);
    return fallback;
  }
}
