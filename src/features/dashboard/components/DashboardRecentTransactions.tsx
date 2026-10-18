import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentTransaction } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Props {
    transactions: RecentTransaction[];
}

export function DashboardRecentTransactions({ transactions }: Props) {
    return (
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                            <ArrowDownLeft className="h-5 w-5 text-muted-foreground/70" />
                        </div>
                        <p className="text-sm font-medium">No hay transacciones registradas</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                            Comienza agregando un ingreso o gasto usando el botón (+) en la barra superior.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback
                                        className={
                                            transaction.type === "income"
                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                        }
                                    >
                                        {transaction.type === "income" ? (
                                            <ArrowUpRight className="h-4 w-4" />
                                        ) : (
                                            <ArrowDownLeft className="h-4 w-4" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {transaction.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {transaction.category} • {formatDate(transaction.date)}
                                    </p>
                                </div>
                                <div
                                    className={`ml-auto font-medium text-sm ${transaction.type === "income"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                        }`}
                                >
                                    {transaction.type === "income" ? "+" : "-"}
                                    {formatCurrency(transaction.amount, transaction.currencyCode)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
