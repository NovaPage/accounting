"use client";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Orbit</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/forms">Forms</Link>
          <Link href="/theme">Theme</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
