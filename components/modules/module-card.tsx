import Link from "next/link";
import type { Module } from "@/lib/modules";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ModuleCardProps = {
  module: Module;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <Link
      href={module.href}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-colors",
        "hover:bg-accent/30 active:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:scale-105">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{module.title}</p>
          {module.status === "coming-soon" ? (
            <Badge variant="secondary" className="text-[10px]">
              Soon
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          {module.description}
        </p>
      </div>
    </Link>
  );
}
