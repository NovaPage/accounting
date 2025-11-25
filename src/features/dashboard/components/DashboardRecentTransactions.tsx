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
            <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback
                                    className={
                                        transaction.type === "income"
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "bg-rose-100 text-rose-600"
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
                                className={`ml-auto font-medium ${transaction.type === "income"
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                    }`}
                            >
                                {transaction.type === "income" ? "+" : "-"}
                                {formatCurrency(transaction.amount, transaction.currencyCode)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
