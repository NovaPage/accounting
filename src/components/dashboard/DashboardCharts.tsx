"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";
import { GetReportsDataAction, type ChartData } from "@/app/actions/reports";
import { Loader2 } from "lucide-react";

export function DashboardCharts() {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GetReportsDataAction().then(res => {
            if (res.data) setData(res.data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    const hasBalanceData = Boolean(
        data?.balanceHistory &&
        data.balanceHistory.length > 0 &&
        data.balanceHistory.some((d) => d.balance !== 0)
    );
    const hasIncomeExpenseData = Boolean(
        data?.incomeExpense &&
        data.incomeExpense.length > 0 &&
        data.incomeExpense.some((d) => d.ingreso > 0 || d.gasto > 0)
    );

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Resumen Financiero</CardTitle>
                    <CardDescription>
                        Comportamiento de tu balance en los últimos días.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    {hasBalanceData ? (
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data!.balanceHistory}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }} />
                                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorBalance)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                            <p className="text-sm font-medium">Aún no hay movimientos para graficar</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                                A medida que registres ingresos y gastos, aquí verás la evolución de tu patrimonio.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Flujo de Caja</CardTitle>
                    <CardDescription>Ingresos y Gastos recientes</CardDescription>
                </CardHeader>
                <CardContent>
                    {hasIncomeExpenseData ? (
                        <div className="space-y-4">
                            {data!.incomeExpense.slice(-3).map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{item.name}</span>
                                    <div className="flex gap-4 text-sm font-medium">
                                        <span className="text-emerald-600 dark:text-emerald-400">+${item.ingreso}</span>
                                        <span className="text-rose-600 dark:text-rose-400">-${item.gasto}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                            <p className="text-sm font-medium">Sin datos de flujo este mes</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                                Los totales comparativos de ingresos y gastos aparecerán aquí automáticamente.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
