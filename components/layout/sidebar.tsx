"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Home, Settings } from "lucide-react";
import {
  getSidebarPrimaryModules,
  getSidebarToolModules,
} from "@/lib/modules";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: Route;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const primary = getSidebarPrimaryModules();
  const tools = getSidebarToolModules();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 items-center px-5">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          LifeKit
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          <NavLink
            href="/"
            label="Home"
            icon={Home}
            active={pathname === "/"}
          />
          {primary.map((mod) => (
            <NavLink
              key={mod.id}
              href={mod.href}
              label={mod.title}
              icon={mod.icon}
              active={pathname === mod.href}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Tools
          </p>
          {tools.map((mod) => (
            <NavLink
              key={mod.id}
              href={mod.href}
              label={mod.title}
              icon={mod.icon}
              active={pathname === mod.href}
            />
          ))}
        </div>

        <div className="mt-auto space-y-1 pb-2">
          <Separator className="mb-3" />
          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            active={pathname === "/settings"}
          />
          <div className="px-1 pt-3">
            <ThemeToggle size="sm" className="w-full justify-between" />
          </div>
        </div>
      </nav>
    </aside>
  );
}
