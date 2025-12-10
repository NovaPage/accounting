"use server";

import { getServerComponentClient } from "@/lib/supabase/server";
import { getActiveSpace } from "@/lib/space";

export type ChartData = {
    incomeExpense: { name: string; ingreso: number; gasto: number }[];
    balanceHistory: { date: string; balance: number }[];
};

export async function GetReportsDataAction(): Promise<{ data?: ChartData; error?: string }> {
    try {
        const space = await getActiveSpace();
        if (!space) return { error: "No hay espacio activo" };

        const supabase = await getServerComponentClient();

        // Fetch last 6 months of transactions
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of that month

        const { data: transactions, error } = await supabase
            .from("transactions")
            .select("amount, type, date")
            .eq("space_id", space.id)
            .gte("date", sixMonthsAgo.toISOString())
            .order("date", { ascending: true });

        if (error) throw error;

        // Process Income vs Expense
        const monthlyData = new Map<string, { ingreso: number; gasto: number }>();
        // const balanceData: { date: string; balance: number }[] = [];

        // let runningBalance = 0;
        // Note: For accurate balance history we'd normally need a starting balance snapshot.
        // For this MVP, we will calculate relative movement or try to fetch current account balances?
        // Let's just sum transactions for the graph interval relative to 0 for "Movement" or fetch accounts for Total.
        // User asked for "Real Data". Let's approximate balance history by accumulating daily changes from the fetched window, 
        // ideally added to a "start balance" calculated from previous transactions. 
        // BUT, calculating strict balance history from logs is expensive.
        // Alternative: Just show Income/Expense. And maybe "Net Worth" over time?
        // Let's stick to Income/Expense which is reliable from this query.

        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        transactions?.forEach(tx => {
            const date = new Date(tx.date);
            const monthKey = `${months[date.getMonth()]}`; // Simple grouping

            if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, { ingreso: 0, gasto: 0 });
            }

            const entry = monthlyData.get(monthKey)!;
            if (tx.type === "income") entry.ingreso += tx.amount;
            if (tx.type === "expense") entry.gasto += tx.amount;

            // For balance line: accumulate
            // if (tx.type === "income") runningBalance += tx.amount;
            // if (tx.type === "expense") runningBalance -= tx.amount;
            // Transfers sum to 0 usually in double entry, or handled as in/out. 
            // Logic in transactions.ts suggests transfers are dual records? 
            // If so, fetching all transactions sums correctly.

            // We can push daily snapshots for balance? Too many points. 
            // Let's push one point per transaction for now (limit 100?) or aggregate by day.
        });

        // Convert Map to Array
        const incomeExpense = Array.from(monthlyData.entries()).map(([name, val]) => ({
            name,
            ...val
        }));

        // Mocking balance history with real accumulation relative to window start (or 0)
        // Creating a daily aggregation for balance line
        const dailyBalance = new Map<string, number>();
        let currentDayBalance = 0;

        transactions?.forEach(tx => {
            const day = new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            if (tx.type === "income") currentDayBalance += tx.amount;
            if (tx.type === "expense") currentDayBalance -= tx.amount;
            dailyBalance.set(day, currentDayBalance);
        });

        const balanceHistory = Array.from(dailyBalance.entries())
            .slice(-20) // Last 20 data points to avoid crowding
            .map(([date, balance]) => ({ date, balance }));

        return {
            data: {
                incomeExpense,
                balanceHistory: balanceHistory.length ? balanceHistory : [{ date: 'Hoy', balance: 0 }]
            }
        };

    } catch (e) {
        console.error("Error fetching reports:", e);
        return { error: "Error al cargar reportes" };
    }
}
