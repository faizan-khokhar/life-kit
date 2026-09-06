"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatPKR, formatPercent } from "@/lib/format";
import type { CategorySpendView } from "@/lib/data/types";
import { ChevronRight } from "lucide-react";

type CategoryListProps = {
  categories: CategorySpendView[];
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryList({
  categories,
  onSelectCategory,
}: CategoryListProps) {
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
        ) : (
          categories.map((category) => {
            const percent = formatPercent(category.spent, category.budget);
            const remaining = category.budget - category.spent;
            const isPaid =
              category.isFixed &&
              category.budget > 0 &&
              category.spent >= category.budget;
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
                      {isPaid
                        ? "Paid this month"
                        : `${formatPKR(category.spent)} / ${formatPKR(category.budget)}`}
                      {!isPaid && remaining < 0 ? (
                        <span className="text-negative"> · over</span>
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
      </CardContent>
    </Card>
  );
}
