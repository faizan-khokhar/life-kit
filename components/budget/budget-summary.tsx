import { Card, CardContent } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";
import type { BudgetSummaryView } from "@/lib/data/types";

type BudgetSummaryProps = {
  summary: BudgetSummaryView;
};

export function BudgetSummary({ summary }: BudgetSummaryProps) {
  const { monthLabel, income, expenses, remaining } = summary;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Budget</h2>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
        </div>
      </div>

      <Card className="border-border/80 bg-primary text-primary-foreground shadow-sm">
        <CardContent className="space-y-1 pt-6">
          <p className="text-sm text-primary-foreground/80">Remaining</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatPKR(remaining)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-lg font-semibold tracking-tight text-positive tabular-nums">
              +{formatPKR(income)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-semibold tracking-tight text-negative tabular-nums">
              -{formatPKR(expenses)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
