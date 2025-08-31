// File: src/lib/space.ts
"use server";

/**
 * Space utilities (server-only).
 * - Read/write active space id via secure cookies.
 * - Fetch first space id for the current user as fallback.
 * - Ensure a valid active space id exists.
 *
 * Separation of concerns:
 * - Cookie IO lives here.
 * - Onboarding logic is delegated to the onboarding entry point.
 * - No UI or framework components.
 */

import { cookies } from "next/headers";
import { getServerComponentClient } from "@/lib/supabase/server";
import {
  DEFAULT_CURRENCY,
  SPACE_COOKIE,
  SPACE_COOKIE_MAX_AGE_DAYS,
} from "@/lib/constants";
import { ensureOnboarded } from "@/lib/onboarding";
import { logError, logInfo } from "@/lib/logging";

type SpaceRow = {
  id: string;
  name: string | null;
  currency_code: string | null;
};

type MembershipJoinRow = {
  space_id: string;
  joined_at: string | null;
  spaces: SpaceRow | null;
};

const cookieMaxAgeSeconds = SPACE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

/** Read active space id from secure server cookies (Next 15: cookies() is async). */
export async function readActiveSpaceIdCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(SPACE_COOKIE)?.value ?? null;
  return value && value.length > 0 ? value : null;
}

/** Write active space id to secure server cookies. */
export async function writeActiveSpaceIdCookie(spaceId: string): Promise<void> {
  const jar = await cookies();
  // In production, Next.js will mark this as secure automatically on HTTPS deployments.
  jar.set(SPACE_COOKIE, spaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAgeSeconds,
  });
}

/** Clear the active space id cookie. */
export async function clearActiveSpaceIdCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SPACE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Fetch the user's spaces (minimal shape) ordered by join time.
 * This respects RLS and only returns spaces the user belongs to.
 */
export async function fetchUserSpaces(): Promise<SpaceRow[]> {
  const supabase = await getServerComponentClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    // User-facing message is not thrown here; keep it internal.
    logError("fetch_spaces_no_user", { feature: "spaces" }, userErr);
    return [];
  }

  // Query through membership to include spaces where the user is not the owner.
  // Uses an inner join on FK: space_members.space_id -> spaces.id
  const { data, error } = await supabase
    .from("space_members")
    .select("space_id, joined_at, spaces:spaces!inner(id, name, currency_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) {
    logError(
      "fetch_spaces_query_failed",
      { feature: "spaces", userId: user.id },
      error,
    );
    return [];
  }

  // Normalize and type results safely
  const rows = (data ?? []) as MembershipJoinRow[];
  const spaces: SpaceRow[] = rows
    .map((row: MembershipJoinRow) => {
      const s = row.spaces;
      return s && s.id
        ? {
            id: s.id,
            name: s.name ?? null,
            currency_code: s.currency_code ?? null,
          }
        : null;
    })
    .filter((x: SpaceRow | null): x is SpaceRow => x !== null);

  return spaces;
}

/**
 * Get the first available space id for the current user (by join order).
 * Returns null if none exists or user is not authenticated.
 */
export async function getFirstSpaceId(): Promise<string | null> {
  const spaces = await fetchUserSpaces();
  return spaces.length > 0 ? spaces[0].id : null;
}

/**
 * Ensure there is an active space id:
 * 1) Try cookie (server).
 * 2) If missing, run onboarding (idempotent) which returns a space id.
 * 3) Persist cookie and return.
 *
 * You can optionally enforce a preferred currency on first onboarding.
 */
export async function ensureActiveSpaceId(
  currencyCode?: string,
): Promise<string> {
  const cookieSpace = await readActiveSpaceIdCookie();
  if (cookieSpace) {
    logInfo("space_cookie_ok", { feature: "spaces", spaceId: cookieSpace });
    return cookieSpace;
  }

  // Run onboarding (idempotent). It will return the first existing space or create one.
  const spaceId = await ensureOnboarded({
    currencyCode: (currencyCode ?? DEFAULT_CURRENCY).toUpperCase(),
  });

  await writeActiveSpaceIdCookie(spaceId);
  logInfo("space_cookie_set", { feature: "spaces", spaceId });

  return spaceId;
}

/**
 * Replace the active space id cookie if the given id belongs to the current user.
 * Falls back to first/ensure if invalid.
 */
export async function selectActiveSpaceId(
  nextSpaceId: string,
): Promise<string> {
  try {
    const spaces = await fetchUserSpaces();
    const allowed = new Set(spaces.map((s: SpaceRow) => s.id));

    if (!allowed.has(nextSpaceId)) {
      logError("space_select_not_allowed", {
        feature: "spaces",
        spaceId: nextSpaceId,
      });
      const first =
        spaces[0]?.id ??
        (await getFirstSpaceId()) ??
        (await ensureActiveSpaceId());
      await writeActiveSpaceIdCookie(first);
      return first;
    }

    await writeActiveSpaceIdCookie(nextSpaceId);
    return nextSpaceId;
  } catch (e) {
    logError("space_select_failed", { feature: "spaces" }, e);
    const fallback =
      (await getFirstSpaceId()) ?? (await ensureActiveSpaceId());
    await writeActiveSpaceIdCookie(fallback);
    return fallback;
  }
}
