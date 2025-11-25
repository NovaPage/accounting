import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "../types";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, PiggyBank } from "lucide-react";
import { formatCurrency } from "../utils";

interface Props {
    metrics: DashboardMetrics;
}

export function DashboardStats({ metrics }: Props) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(metrics.totalBalance, metrics.currencyCode)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Disponible en todas las cuentas
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                    <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(metrics.monthlyIncome, metrics.currencyCode)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.incomeChangePct > 0 ? "+" : ""}
                        {metrics.incomeChangePct}% respecto al mes anterior
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos (Mes)</CardTitle>
                    <ArrowDownIcon className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600">
                        {formatCurrency(metrics.monthlyExpenses, metrics.currencyCode)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.expensesChangePct > 0 ? "+" : ""}
                        {metrics.expensesChangePct}% respecto al mes anterior
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ahorro</CardTitle>
                    <PiggyBank className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {metrics.savingsRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Tasa de ahorro mensual
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
