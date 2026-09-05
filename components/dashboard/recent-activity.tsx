import Link from "next/link";
import {
  CheckSquare,
  FileText,
  Receipt,
  Wallet,
} from "lucide-react";
import { formatSignedPKR } from "@/lib/format";
import { recentActivity, type ActivityItem } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeIcons = {
  expense: Receipt,
  income: Wallet,
  task: CheckSquare,
  note: FileText,
} as const;

export function ActivityListItem({ item }: { item: ActivityItem }) {
  const Icon = typeIcons[item.type];
  const amountClass =
    item.amount === undefined
      ? ""
      : item.amount >= 0
        ? "text-positive"
        : "text-negative";

  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.subtitle} · {item.time}
        </p>
      </div>
      {item.amount !== undefined ? (
        <p className={cn("shrink-0 text-sm font-semibold tabular-nums", amountClass)}>
          {formatSignedPKR(item.amount)}
        </p>
      ) : null}
    </li>
  );
}

type RecentActivityProps = {
  limit?: number;
  showHeader?: boolean;
};

export function RecentActivity({
  limit = 4,
  showHeader = true,
}: RecentActivityProps) {
  const items = recentActivity.slice(0, limit);

  return (
    <section className="space-y-3">
      {showHeader ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Recent activity
          </h2>
          <Badge variant="outline" className="font-normal">
            Demo data
          </Badge>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/80 bg-card px-4 shadow-sm">
        <ul className="divide-y divide-border/70">
          {items.map((item) => (
            <ActivityListItem key={item.id} item={item} />
          ))}
        </ul>
      </div>

      {showHeader ? (
        <div className="text-center">
          <Link
            href="/activity"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all activity
          </Link>
        </div>
      ) : null}
    </section>
  );
}
