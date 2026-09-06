"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPKR, formatPercent } from "@/lib/format";
import { deriveBudgetSummary } from "@/lib/data/budget";
import { filterEntriesForMonth, formatMonthLabel } from "@/lib/data/month";
import { useBudgetData } from "@/lib/data/use-budget-data";

export function FinancialOverview() {
  const { entries, loading, error } = useBudgetData();

  const summary = useMemo(() => {
    const month = new Date();
    const monthEntries = filterEntriesForMonth(entries, month);
    return deriveBudgetSummary(monthEntries, formatMonthLabel(month));
  }, [entries]);

  const { income, expenses, remaining } = summary;
  const spentPercent = formatPercent(expenses, income);

  if (loading) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Financial overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {error ? "Could not load data" : "This month"}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-sm font-semibold tracking-tight sm:text-base">
              {formatPKR(income)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spending</p>
            <p className="text-sm font-semibold tracking-tight text-negative sm:text-base">
              -{formatPKR(expenses)}
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
