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
        <nav className="flex items-center gap-1" aria-label="Navegación principal">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== "/dashboard");

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-label={tab.name}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-secondary text-secondary-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <span className="hidden lg:inline">{tab.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
