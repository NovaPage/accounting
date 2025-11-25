"use server";

import { getServerComponentClient } from "@/lib/supabase/server";
import { DashboardMetrics, RecentTransaction } from "@/features/dashboard/types";
import { logError } from "@/lib/logging";

export async function fetchDashboardMetrics(spaceId: string): Promise<DashboardMetrics> {
    const supabase = await getServerComponentClient();

    try {
        const { data, error } = await supabase.rpc("get_dashboard_metrics", {
            p_space_id: spaceId,
        });

        if (error) throw error;

        // Ensure default values if RPC returns null or partial data
        return {
            totalBalance: Number(data?.totalBalance ?? 0),
            monthlyIncome: Number(data?.monthlyIncome ?? 0),
            monthlyExpenses: Number(data?.monthlyExpenses ?? 0),
            incomeChangePct: Number(data?.incomeChangePct ?? 0),
            expensesChangePct: Number(data?.expensesChangePct ?? 0),
            savingsRate: Number(data?.savingsRate ?? 0),
            currencyCode: data?.currencyCode ?? "COP",
        };
    } catch (e) {
        logError("fetch_dashboard_metrics_failed", { feature: "dashboard", spaceId }, e);
        // Fallback to zeros on error
        return {
            totalBalance: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            savingsRate: 0,
            currencyCode: "COP",
        };
    }
}

export async function fetchRecentTransactions(spaceId: string): Promise<RecentTransaction[]> {
    const supabase = await getServerComponentClient();

    try {
        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("space_id", spaceId)
            .order("date", { ascending: false })
            .limit(5);

        if (error) throw error;

        // Map DB rows to UI type
        // Note: We are using a hardcoded currency for now as it's not on the transaction row usually
        // Ideally, we fetch the space currency or account currency.
        // For this MVP, we assume the space currency (or COP default).

        return (data ?? []).map((t) => ({
            id: t.id,
            description: t.description ?? "Sin descripción",
            amount: Number(t.amount),
            date: t.date,
            category: "General", // Placeholder until we join with categories
            type: t.type as "income" | "expense",
            currencyCode: "COP", // TODO: Fetch from account or space
        }));
    } catch (e) {
        logError("fetch_recent_transactions_failed", { feature: "dashboard", spaceId }, e);
        return [];
    }
}
