"use client";

import Link from "next/link";
import type { Route } from "next";
import { quickActions } from "@/lib/modules";
import { cn } from "@/lib/utils";

function hrefForAction(
  id: string,
  href: (typeof quickActions)[number]["href"],
): Route {
  if (id === "add-expense") return "/budget?action=spend" as Route;
  if (id === "add-note") return "/notes?action=new" as Route;
  return href;
}

export function QuickActionsRow() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Quick actions
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        {quickActions.slice(0, 3).map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={hrefForAction(action.id, action.href)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-card px-2 py-3.5 text-center shadow-sm transition-colors",
                "hover:bg-accent/40 active:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-xs font-medium text-foreground">
                {action.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
