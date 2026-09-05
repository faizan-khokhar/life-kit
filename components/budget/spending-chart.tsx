import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";
import type { SpendingDayView } from "@/lib/data/types";

type SpendingChartProps = {
  days: SpendingDayView[];
};

export function SpendingChart({ days }: SpendingChartProps) {
  const max = Math.max(...days.map((d) => d.amount), 1);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Spending overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">Last 7 days</p>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-40 items-end justify-between gap-2"
          role="img"
          aria-label="Weekly spending bar chart"
        >
          {days.map((day) => {
            const height = Math.max(8, Math.round((day.amount / max) * 100));
            return (
              <div
                key={day.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="sr-only">
                  {day.label}: {formatPKR(day.amount)}
                </span>
                <div
                  className="w-full max-w-10 rounded-t-lg bg-primary/80 transition-colors hover:bg-primary"
                  style={{ height: `${height}%` }}
                  title={formatPKR(day.amount)}
                />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
