// File: src/lib/queryKeys.ts

/**
 * Centralized React Query keys.
 * Keep these pure and stable. No fetch logic here.
 */

export const queryKeys = {
  space: ["space"] as const,
  spaces: {
    all: ["spaces"] as const,
    list: (userId: string) => [...queryKeys.spaces.all, "list", { userId }] as const,
    detail: (spaceId: string) => [...queryKeys.spaces.all, "detail", { spaceId }] as const,
  },
  accounts: {
    all: (spaceId: string) => ["accounts", { spaceId }] as const,
    list: (spaceId: string) => [...queryKeys.accounts.all(spaceId), "list"] as const,
    balances: (spaceId: string) => [...queryKeys.accounts.all(spaceId), "balances"] as const,
  },
  categories: {
    all: (spaceId: string) => ["categories", { spaceId }] as const,
    list: (spaceId: string) => [...queryKeys.categories.all(spaceId), "list"] as const,
  },
  budgets: {
    all: (spaceId: string) => ["budgets", { spaceId }] as const,
    month: (spaceId: string, monthISO: string) =>
      [...queryKeys.budgets.all(spaceId), "month", { monthISO }] as const,
  },
  journals: {
    all: (spaceId: string) => ["journals", { spaceId }] as const,
    list: (spaceId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.journals.all(spaceId), "list", { ...(filters ?? {}) }] as const,
    detail: (spaceId: string, journalId: string) =>
      [...queryKeys.journals.all(spaceId), "detail", { journalId }] as const,
  },
};
