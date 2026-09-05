import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPKR, formatPercent } from "@/lib/format";
import { dashboardOverview } from "@/lib/mock-data";

export function FinancialOverview() {
  const { thisMonth, spending, remaining } = dashboardOverview;
  const spentPercent = formatPercent(spending, thisMonth);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Financial overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">This month · Demo data</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-sm font-semibold tracking-tight sm:text-base">
              {formatPKR(thisMonth)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spending</p>
            <p className="text-sm font-semibold tracking-tight text-negative sm:text-base">
              -{formatPKR(spending)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-sm font-semibold tracking-tight text-positive sm:text-base">
              {formatPKR(remaining)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Budget used</span>
            <span>{spentPercent}%</span>
          </div>
          <Progress value={spentPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
