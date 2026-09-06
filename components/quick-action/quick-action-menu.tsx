import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { quickActions } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type QuickActionMenuProps = {
  trigger: React.ReactNode;
  /** sheet = mobile bottom sheet; dropdown = desktop menu */
  variant?: "sheet" | "dropdown";
};

function hrefForAction(
  id: string,
  href: (typeof quickActions)[number]["href"],
): Route {
  if (id === "add-expense") return "/budget?action=spend" as Route;
  return href;
}

export function QuickActionMenu({
  trigger,
  variant = "sheet",
}: QuickActionMenuProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {quickActions.map((action) => {
            const Icon = action.icon;
            const href = hrefForAction(action.id, action.href);
            return (
              <DropdownMenuItem key={action.id} asChild>
                <Link href={href} className="gap-3 py-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-medium">{action.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Quick actions</SheetTitle>
          <SheetDescription>
            Start something new. These open the matching module.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4 pb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto justify-start gap-3 rounded-2xl px-4 py-3.5 text-left"
                onClick={() => {
                  setSheetOpen(false);
                  router.push(hrefForAction(action.id, action.href));
                }}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {action.title}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
