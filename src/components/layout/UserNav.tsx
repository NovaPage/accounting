"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UserNav() {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = getBrowserClient();
        await supabase.auth.signOut();
        // Clear active space cookie so next user session starts clean
        document.cookie = "space_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.assign("/login");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings/profile")}>
                    Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
