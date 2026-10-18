"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, Settings, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionDrawer } from "@/hooks/useTransactionDrawer";

type Space = {
  id: string;
  name: string | null;
  currency_code: string | null;
};

interface MobileBottomNavProps {
  space: Space | null;
}

export function MobileBottomNav({}: MobileBottomNavProps) {
  const pathname = usePathname();
  const openTransaction = useTransactionDrawer((s) => s.open);

  const navItems = [
    {
      label: "Inicio",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Reportes",
      href: "/dashboard/reports",
      icon: PieChart,
      isActive: pathname.startsWith("/dashboard/reports"),
    },
    {
      label: "Espacio",
      href: "/dashboard/settings/space",
      icon: Settings,
      isActive: pathname.startsWith("/dashboard/settings/space"),
    },
    {
      label: "Perfil",
      href: "/dashboard/settings/profile",
      icon: User,
      isActive: pathname.startsWith("/dashboard/settings/profile"),
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-border/80 px-2 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {/* First two navigation tabs */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 transition-colors group",
                item.isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-xl transition-all",
                  item.isActive && "bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Primary Action (FAB - Nueva Transacción) */}
        <div className="flex items-center justify-center flex-1">
          <button
            type="button"
            onClick={() => openTransaction("expense")}
            aria-label="Registrar nueva transacción"
            className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Next two navigation tabs */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 transition-colors group",
                item.isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-xl transition-all",
                  item.isActive && "bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
