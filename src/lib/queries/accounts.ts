"use server";

import { getServerComponentClient } from "@/lib/supabase/server";
import { logError, logWarn } from "@/lib/logging";
import { MONEY_ACCOUNT_TYPES } from "@/lib/constants";

export type AccountBalanceRow = {
  account_id: string;
  account_name: string;
  type: "cash" | "bank" | "card" | "other";
  currency_code: string;
  balance: number;
  is_archived?: boolean | null;
  order_index?: number | null;
  space_id?: string;
};

// Tipos estructurales para llamar RPC sin any
type GetBalancesArgs = { p_space_id: string; p_account_ids: string[] };
type GetBalancesRow = { account_id: string; balance: number | string | null };
type RpcCaller = (
  fn: string,
  args: GetBalancesArgs
) => Promise<{ data: GetBalancesRow[] | null; error: { message?: string } | null }>;

export async function fetchAccounts(spaceId: string): Promise<AccountBalanceRow[]> {
  const supabase = await getServerComponentClient();

  try {
    // 1) Trae todas las cuentas del espacio (metadata)
    const { data: accounts, error: accErr } = await supabase
      .from("accounts")
      .select("id, name, type, currency_code, is_archived, order_index")
      .eq("space_id", spaceId)
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (accErr) throw accErr;

    const moneySet = new Set<string>(MONEY_ACCOUNT_TYPES as readonly string[]);
    const activeMoney = (accounts ?? []).filter((a) => {
      const t = (a as { type: string }).type;
      const archived = (a as { is_archived: boolean | null }).is_archived ?? false;
      return moneySet.has(t) && !archived;
    }) as Array<{
      id: string;
      name: string;
      type: "cash" | "bank" | "card" | "other" | string;
      currency_code: string;
      is_archived: boolean | null;
      order_index: number | null;
    }>;

    if (activeMoney.length === 0) return [];

    const ids = activeMoney.map((a) => a.id);

    // 2) Saldos por RPC (JOIN journals -> space_id)
    const balanceMap = new Map<string, number>();

    try {
      const rpc = (supabase as unknown as { rpc: RpcCaller }).rpc;
      const { data: rpcRows, error: rpcErr } = await rpc("get_balances_for_accounts", {
        p_space_id: spaceId,
        p_account_ids: ids,
      });
      if (rpcErr) throw rpcErr;

      for (const r of rpcRows ?? []) {
        const n = typeof r.balance === "number" ? r.balance : Number(r.balance ?? 0);
        if (!Number.isNaN(n)) balanceMap.set(r.account_id, n);
      }
    } catch (rpcErr: unknown) {
      const msg = (rpcErr as { message?: string } | null)?.message ?? "rpc_error";
      logWarn("accounts_balances_rpc_failed", { feature: "accounts" }, { spaceId, message: msg });
      // Sin fallback a la vista ni a journal_lines.space_id (no existe); muestra 0
    }

    // 3) Construye resultado ordenado
    const rows: AccountBalanceRow[] = activeMoney.map((a) => ({
      account_id: a.id,
      account_name: a.name,
      type: (moneySet.has(a.type) ? (a.type as "cash" | "bank" | "card") : "other"),
      currency_code: a.currency_code,
      balance: balanceMap.get(a.id) ?? 0,
      is_archived: a.is_archived ?? null,
      order_index: a.order_index ?? null,
      space_id: spaceId,
    }));

    rows.sort((x, y) => {
      const xi = x.order_index ?? 0;
      const yi = y.order_index ?? 0;
      if (xi !== yi) return xi - yi;
      return x.account_name.localeCompare(y.account_name, "es");
    });

    return rows;
  } catch (e: unknown) {
    logError(
      "fetch_accounts_failed",
      { feature: "accounts" },
      { spaceId, message: (e as { message?: string } | null)?.message ?? "unknown_error" }
    );
    return [];
  }
}
