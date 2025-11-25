"use server";

import { fetchAccounts } from "@/lib/queries/accounts";
import { fetchCategories } from "@/lib/queries/categories";

export type DrawerData = {
    accounts: { value: string; label: string; currency: string }[];
    categories: { value: string; label: string }[];
};

export async function fetchDrawerData(spaceId: string): Promise<DrawerData> {
    const [accounts, categories] = await Promise.all([
        fetchAccounts(spaceId),
        fetchCategories(spaceId),
    ]);

    return {
        accounts: accounts.map((a) => ({
            value: a.account_id,
            label: a.account_name,
            currency: a.currency_code,
        })),
        categories,
    };
}
