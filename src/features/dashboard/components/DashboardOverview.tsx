import { DashboardData } from "../types";
import { DashboardStats } from "./DashboardStats";
import { DashboardRecentTransactions } from "./DashboardRecentTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface Props {
    data: DashboardData;
}

export function DashboardOverview({ data }: Props) {
    return (
        <div className="space-y-4">
            <DashboardStats metrics={data.metrics} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Resumen Financiero</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="flex h-[350px] items-center justify-center rounded-md border border-dashed bg-muted/50">
                            <div className="flex flex-col items-center text-muted-foreground">
                                <BarChart3 className="h-10 w-10 mb-2" />
                                <p>Gráfico de Ingresos vs Gastos</p>
                                <span className="text-xs">(Próximamente con Recharts)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <DashboardRecentTransactions transactions={data.recentTransactions} />
            </div>
        </div>
    );
}
