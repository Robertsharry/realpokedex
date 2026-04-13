"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { ShinyToggle } from "./ShinyToggle";
import { Swords, Grid3X3, GitCompareArrows, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Pokedex", icon: Zap },
  { href: "/team-builder", label: "Team Builder", icon: Swords },
  { href: "/types", label: "Types", icon: Grid3X3 },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/favorites", label: "Favorites", icon: Heart },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        {/* Red Pokedex accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            {/* Scanner lens - the iconic blue circle from the Pokedex */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 animate-scanner-pulse" />
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
              <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-white/80 to-cyan-200/60" />
              <div className="absolute left-[8px] top-[8px] h-2.5 w-2.5 rounded-full bg-white/90" />
            </div>
            {/* Indicator lights */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
              <div className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.4)]" />
              <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.4)]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Real<span className="text-primary">Pokedex</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <ShinyToggle />
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
