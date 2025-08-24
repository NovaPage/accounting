"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <Button variant="outline" size="icon" onClick={toggle}>
      {/* Render a stable placeholder before hydration to avoid mismatches */}
      {!mounted ? (
        <Sun className="h-4 w-4 opacity-0" />
      ) : resolvedTheme === "dark" ? (
        // Show the opposite icon to indicate what you switch to (keep your preference if you want)
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

