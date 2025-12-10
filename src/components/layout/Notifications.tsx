"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Notifications() {
    return (
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
        </Button>
    );
}
