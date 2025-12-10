// File: src/lib/logging.ts

/**
 * Minimal, centralized logging utility.
 * - Keep PII out of logs.
 * - Use structured objects to keep logs easy to parse/ship later.
 */

type LogLevel = "info" | "warn" | "error";

type LogContext = {
  feature?: string; // e.g., "onboarding", "spaces"
  userId?: string; // avoid email or other PII
  spaceId?: string;
};

function log(level: LogLevel, message: string, ctx?: LogContext, extra?: unknown) {
  // Switchable sink in the future: console → remote collector
  const payload = {
    level,
    message,
    ctx: ctx ?? {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extra: extra instanceof Error ? { message: extra.message, stack: extra.stack, ...(extra as any) } : (extra ?? null),
    at: new Date().toISOString(),
  };

  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

export function logInfo(message: string, ctx?: LogContext, extra?: unknown) {
  log("info", message, ctx, extra);
}

export function logWarn(message: string, ctx?: LogContext, extra?: unknown) {
  log("warn", message, ctx, extra);
}

export function logError(message: string, ctx?: LogContext, extra?: unknown) {
  log("error", message, ctx, extra);
}
