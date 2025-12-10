"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { GetReportsDataAction, type ChartData } from "@/app/actions/reports";

export default function ReportsPage() {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await GetReportsDataAction();
                if (res.data) {
                    setData(res.data);
                } else {
                    toast.error(res.error || "Error al cargar datos");
                }
            } catch (e) {
                console.error(e)
                toast.error("Error de conexión");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleDownload = () => {
        if (!data) return;
        const csvContent = "data:text/csv;charset=utf-8,Mes,Ingreso,Gasto\n" +
            data.incomeExpense.map(e => `${e.name},${e.ingreso},${e.gasto}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_financiero.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Reporte descargado correctamente");
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!data) return <div className="p-4">No hay datos disponibles</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
                    <p className="text-muted-foreground">Análisis detallado de tus finanzas (Últimos 6 meses).</p>
                </div>
                <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Descargar
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Income vs Expense */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos vs Gastos</CardTitle>
                        <CardDescription>Comparativa mensual.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.incomeExpense}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="ingreso" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="gasto" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Balance History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia</CardTitle>
                        <CardDescription>Flujo de caja acumulado recientes.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.balanceHistory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
