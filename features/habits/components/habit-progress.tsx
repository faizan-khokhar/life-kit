import { Progress } from "@/components/ui/progress";

type HabitProgressProps = {
  done: number;
  total: number;
  percent: number;
  dateLabel: string;
};

export function HabitProgress({
  done,
  total,
  percent,
  dateLabel,
}: HabitProgressProps) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{dateLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {total === 0
              ? "Add a habit to start tracking"
              : done === total
                ? "All done for today"
                : `${done} of ${total} completed`}
          </p>
        </div>
        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
          {percent}%
        </p>
      </div>
      <Progress value={percent} className="h-1.5" aria-label="Daily progress" />
    </div>
  );
}
