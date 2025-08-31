// File: src/lib/queryKeys.ts

/**
 * Centralized React Query keys.
 * Keep these pure and stable. No fetch logic here.
 */

export const spaceKeys = {
  all: ["spaces"] as const,
  list: (userId: string) => [...spaceKeys.all, "list", { userId }] as const,
  detail: (spaceId: string) => [...spaceKeys.all, "detail", { spaceId }] as const,
};

export const accountKeys = {
  all: (spaceId: string) => ["accounts", { spaceId }] as const,
  list: (spaceId: string) => [...accountKeys.all(spaceId), "list"] as const,
  balances: (spaceId: string) => [...accountKeys.all(spaceId), "balances"] as const,
};

export const categoryKeys = {
  all: (spaceId: string) => ["categories", { spaceId }] as const,
  list: (spaceId: string) => [...categoryKeys.all(spaceId), "list"] as const,
};

export const budgetKeys = {
  all: (spaceId: string) => ["budgets", { spaceId }] as const,
  month: (spaceId: string, monthISO: string) =>
    [...budgetKeys.all(spaceId), "month", { monthISO }] as const,
};

export const journalKeys = {
  all: (spaceId: string) => ["journals", { spaceId }] as const,
  list: (spaceId: string, filters?: Record<string, unknown>) =>
    [...journalKeys.all(spaceId), "list", { ...(filters ?? {}) }] as const,
  detail: (spaceId: string, journalId: string) =>
    [...journalKeys.all(spaceId), "detail", { journalId }] as const,
};
