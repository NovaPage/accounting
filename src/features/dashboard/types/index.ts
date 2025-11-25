export interface DashboardMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeChangePct: number;
  expensesChangePct: number;
  savingsRate: number;
  currencyCode: string;
}

export interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  currencyCode: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentTransactions: RecentTransaction[];
}
