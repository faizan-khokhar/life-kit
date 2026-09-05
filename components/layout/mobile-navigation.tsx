"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Grid2X2, Home, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickActionMenu } from "@/components/quick-action/quick-action-menu";

const tabs = [
  { href: "/" as const, label: "Home", icon: Home },
  { href: "/budget" as const, label: "Budget", icon: Wallet },
  { href: "/activity" as const, label: "Activity", icon: Activity },
  { href: "/more" as const, label: "More", icon: Grid2X2 },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pt-1">
        {tabs.slice(0, 2).map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className={cn(active && "font-semibold")}>{tab.label}</span>
            </Link>
          );
        })}

        <div className="relative flex min-h-14 items-start justify-center">
          <QuickActionMenu
            trigger={
              <button
                type="button"
                aria-label="Quick actions"
                className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Plus className="size-7" strokeWidth={2.25} aria-hidden />
              </button>
            }
          />
        </div>

        {tabs.slice(2).map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className={cn(active && "font-semibold")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
