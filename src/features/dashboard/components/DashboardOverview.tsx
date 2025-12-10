import { DashboardData } from "../types";
import { DashboardStats } from "./DashboardStats";
import { DashboardRecentTransactions } from "./DashboardRecentTransactions";


interface Props {
    data: DashboardData;
}

export function DashboardOverview({ data }: Props) {
    return (
        <div className="space-y-4">
            <DashboardStats metrics={data.metrics} />

            <DashboardRecentTransactions transactions={data.recentTransactions} />
        </div>
    );
}
