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
                    <div className="h-[300px] w-full">
                        {data?.balanceHistory && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.balanceHistory}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Placeholder for Quick Actions or Recent Activity Summary if needed, or leave blank/expand chart */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Flujo de Caja</CardTitle>
                    <CardDescription>Ingresos y Gastos de este mes</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Simple text summary or mini bar chart could go here. For now, using the data we have. */}
                    <div className="space-y-4">
                        {data?.incomeExpense.slice(-3).map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                                <span className="font-medium text-sm">{item.name}</span>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-green-600">+${item.ingreso}</span>
                                    <span className="text-red-600">-${item.gasto}</span>
                                </div>
                            </div>
                        ))}
                        {!data?.incomeExpense.length && <p className="text-sm text-muted-foreground">No hay datos recientes.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
