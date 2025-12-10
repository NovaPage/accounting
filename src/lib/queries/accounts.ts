"use server";

import { AccountService, AccountBalanceRow } from "@/lib/services/account.service";

const accountService = new AccountService();

export { type AccountBalanceRow };

export async function fetchAccounts(spaceId: string): Promise<AccountBalanceRow[]> {
  return accountService.fetchAccounts(spaceId);
}
