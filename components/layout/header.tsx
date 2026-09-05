"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { getModuleByHref } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { QuickActionMenu } from "@/components/quick-action/quick-action-menu";

function titleForPath(pathname: string): string {
  if (pathname === "/") return "LifeKit";
  if (pathname === "/more") return "More";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/activity") return "Activity";
  return getModuleByHref(pathname)?.title ?? "LifeKit";
}

export function Header() {
  const pathname = usePathname();
  const title = titleForPath(pathname);
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md lg:px-8">
      <div className="min-w-0">
        {isHome ? (
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            LifeKit
          </Link>
        ) : (
          <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        )}
      </div>

      <div className="hidden lg:block">
        <QuickActionMenu
          variant="dropdown"
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" aria-hidden />
              New
            </Button>
          }
        />
      </div>
    </header>
  );
}
