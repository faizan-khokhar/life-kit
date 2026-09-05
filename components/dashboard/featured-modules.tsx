import Link from "next/link";
import { getFeaturedModules } from "@/lib/modules";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FeaturedModules() {
  const featured = getFeaturedModules();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Modules
        </h2>
        <Link
          href="/more"
          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {featured.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className={cn(
                "group flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-colors",
                "hover:bg-accent/30 active:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:scale-105">
                  <Icon className="size-5" aria-hidden />
                </span>
                {mod.status === "coming-soon" ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Soon
                  </Badge>
                ) : null}
              </div>
              <div>
                <p className="font-semibold text-foreground">{mod.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {mod.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
