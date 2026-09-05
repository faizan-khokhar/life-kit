import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatPKR } from "@/lib/format";
import type { ExpenseListItemView } from "@/lib/data/types";

type ExpenseListProps = {
  expenses: ExpenseListItemView[];
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Recent expenses
        </CardTitle>
        <p className="text-sm text-muted-foreground">Newest first</p>
      </CardHeader>
      <CardContent className="p-0">
        {expenses.length === 0 ? (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyTitle>No expenses yet</EmptyTitle>
              <EmptyDescription>
                Log an expense or income entry to see it here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y divide-border/70">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {expense.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {expense.category} · {expense.date}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-negative">
                  -{formatPKR(expense.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
