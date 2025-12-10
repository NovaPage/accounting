"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, PieChart } from "lucide-react";

export function NavTabs() {
    const pathname = usePathname();

    const tabs = [
        { name: "Principal", href: "/dashboard", icon: LayoutDashboard },
        { name: "Reportes", href: "/dashboard/reports", icon: PieChart },
        { name: "Espacio", href: "/dashboard/settings/space", icon: Settings },
    ];

    return (
        <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== "/dashboard");

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-secondary text-secondary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <span className="hidden lg:inline">{tab.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
