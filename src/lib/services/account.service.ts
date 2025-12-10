import { BaseService } from "./base.service";
import { MONEY_ACCOUNT_TYPES } from "@/lib/constants";
import { logError, logWarn } from "@/lib/logging";

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

type GetBalancesRow = { account_id: string; balance: number | string | null };

export class AccountService extends BaseService {
    async fetchAccounts(spaceId: string): Promise<AccountBalanceRow[]> {
        const supabase = await this.getClient();

        try {
            // 0) Verify user session
            const { data: { user }, error: userErr } = await supabase.auth.getUser();
            if (userErr || !user) {
                return [];
            }

            // 1) Fetch accounts metadata
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

            // 2) Fetch balances via RPC
            const balanceMap = new Map<string, number>();

            try {
                const { data: rpcRows, error: rpcErr } = await supabase.rpc("get_balances_for_accounts", {
                    p_space_id: spaceId,
                    p_account_ids: ids,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);
                if (rpcErr) throw rpcErr;

                for (const r of (rpcRows as unknown as GetBalancesRow[]) ?? []) {
                    const n = typeof r.balance === "number" ? r.balance : Number(r.balance ?? 0);
                    if (!Number.isNaN(n)) balanceMap.set(r.account_id, n);
                }
            } catch (rpcErr: unknown) {
                const msg = (rpcErr as { message?: string } | null)?.message ?? "rpc_error";
                logWarn("accounts_balances_rpc_failed", { feature: "accounts" }, { spaceId, message: msg });
            }

            // 3) Construct result
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
}
