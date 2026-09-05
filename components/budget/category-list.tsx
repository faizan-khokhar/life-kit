import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPKR, formatPercent } from "@/lib/format";
import { categories } from "@/lib/mock-data";

export function CategoryList() {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Categories</CardTitle>
        <p className="text-sm text-muted-foreground">
          Spent vs budget this month
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {categories.map((category) => {
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
        })}
      </CardContent>
    </Card>
  );
}
