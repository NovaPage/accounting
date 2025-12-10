"use client";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, PieChart, Box } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMobile() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", label: "Principal", icon: LayoutDashboard },
        { href: "/dashboard/reports", label: "Reportes", icon: PieChart },
        { href: "/dashboard/settings/space", label: "Espacio", icon: Box },
    ];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle className="text-left">Menú</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-4 px-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/dashboard");

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-secondary text-secondary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        );
                    })}
                    <div className="my-4 border-t" />
                    <div className="px-4 text-sm font-medium text-muted-foreground mb-2">Cuenta</div>
                    <Link
                        href="/dashboard/settings/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Box className="h-5 w-5" />
                        Mi Perfil
                    </Link>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
