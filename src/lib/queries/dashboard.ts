"use server";

import { DashboardService } from "@/lib/services/dashboard.service";
import { DashboardMetrics, RecentTransaction } from "@/features/dashboard/types";

const dashboardService = new DashboardService();

export async function fetchDashboardMetrics(spaceId: string): Promise<DashboardMetrics> {
    return dashboardService.fetchDashboardMetrics(spaceId);
}

export async function fetchRecentTransactions(spaceId: string): Promise<RecentTransaction[]> {
    return dashboardService.fetchRecentTransactions(spaceId);
}
