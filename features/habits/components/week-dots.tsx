import { cn } from "@/lib/utils";

const DEFAULT_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type WeekDotsProps = {
  week: boolean[];
  labels?: string[];
  /** Index of today within the week (0–6), highlighted. */
  todayIndex?: number;
  className?: string;
};

export function WeekDots({
  week,
  labels = DEFAULT_LABELS,
  todayIndex,
  className,
}: WeekDotsProps) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label="This week's completions"
    >
      {week.map((done, i) => {
        const isToday = todayIndex === i;
        return (
          <div key={i} className="flex w-4 flex-col items-center gap-0.5">
            <span
              className={cn(
                "size-2 rounded-full transition-colors",
                done
                  ? "bg-primary"
                  : isToday
                    ? "bg-muted-foreground/40 ring-1 ring-primary/40"
                    : "bg-muted-foreground/20",
              )}
              title={`${labels[i] ?? ""}: ${done ? "done" : "missed"}`}
            />
          </div>
        );
      })}
    </div>
  );
}
