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

type CategoryListProps = {
  categories: CategorySpendView[];
};

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Categories</CardTitle>
        <p className="text-sm text-muted-foreground">
          Spent vs budget this period
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {categories.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>
                Add a budget category to track spending limits.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          categories.map((category) => {
            const percent = formatPercent(category.spent, category.budget);
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {category.name}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatPKR(category.spent)} / {formatPKR(category.budget)}
                  </p>
                </div>
                <Progress value={percent} className="h-2" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
