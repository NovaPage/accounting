"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SpaceSettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: "General", href: "/dashboard/settings/space" },
        { name: "Miembros", href: "/dashboard/settings/space/members" },
    ];

    return (
        <div className="space-y-6">
            <div className="border-b">
                <nav className="flex items-center gap-4">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div>{children}</div>
        </div>
    );
}
