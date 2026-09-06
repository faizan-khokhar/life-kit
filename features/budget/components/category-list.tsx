"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatPKR, formatPercent } from "@/lib/format";
import type { CategorySpendView } from "@/features/budget/data/types";
import { ChevronRight } from "lucide-react";

type CategoryListProps = {
  categories: CategorySpendView[];
  onSelectCategory: (categoryId: string) => void;
};

function isPaidFixed(category: CategorySpendView): boolean {
  return (
    category.isFixed &&
    category.budget > 0 &&
    category.spent >= category.budget
  );
}

export function CategoryList({
  categories,
  onSelectCategory,
}: CategoryListProps) {
  const [showPaid, setShowPaid] = useState(false);

  const { visible, paidHidden } = useMemo(() => {
    const paid = categories.filter(isPaidFixed);
    const active = categories.filter((c) => !isPaidFixed(c));
    return {
      visible: showPaid ? [...active, ...paid] : active,
      paidHidden: paid,
    };
  }, [categories, showPaid]);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Categories</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tap a category to log a spend
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>
                Add categories in Manage to start tracking.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : visible.length === 0 && paidHidden.length > 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            All fixed payments are marked paid this month.
          </p>
        ) : (
          visible.map((category) => {
            const percent = formatPercent(category.spent, category.budget);
            const remaining = category.budget - category.spent;
            const paid = isPaidFixed(category);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="flex w-full flex-col gap-2 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {category.name}
                      {category.isFixed ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Fixed
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {paid
                        ? "Paid this month"
                        : `${formatPKR(category.spent)} / ${formatPKR(category.budget)}`}
                      {!paid && remaining < 0 ? (
                        <span className="text-negative"> Â· over</span>
                      ) : null}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <Progress value={percent} className="h-2" />
              </button>
            );
          })
        )}

        {paidHidden.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowPaid((v) => !v)}
          >
            {showPaid
              ? "Hide paid"
              : `Show paid (${paidHidden.length})`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
