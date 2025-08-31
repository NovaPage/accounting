// File: src/lib/constants.ts

/**
 * Global constants for the application.
 * Keep this file free of UI strings; only static constants and tokens.
 */

export const APP_NAME = "Orbit" as const;

/**
 * Money account types considered as "cash-like" for balances and listings.
 * Do not include "other" (nominal) types here.
 */
export const MONEY_ACCOUNT_TYPES = ["cash", "bank", "card"] as const;
export type MoneyAccountType = (typeof MONEY_ACCOUNT_TYPES)[number];

/**
 * Supported currency codes for the Space base currency selector.
 * Keep it small and opinionated for MVP.
 */
export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Cookie name used to persist the active Space id on the client.
 * This is only a pointer; security is always enforced by RLS on the server.
 */
export const SPACE_COOKIE = "orbit_space_id" as const;

/**
 * Default currency code if none is provided during onboarding.
 * It should match the backend default.
 */
export const DEFAULT_CURRENCY: SupportedCurrency = "COP";

/**
 * Telemetry toggle: keep it simple for MVP.
 * You can wire this to an env var later (e.g., process.env.NEXT_PUBLIC_TELEMETRY="on").
 */
export const TELEMETRY_ENABLED = true as const;

/**
 * Cookie lifetime for `SPACE_COOKIE` in days.
 */
export const SPACE_COOKIE_MAX_AGE_DAYS = 30 as const;
