import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";
import { recentExpenses } from "@/lib/mock-data";

export function ExpenseList() {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Recent expenses
        </CardTitle>
        <p className="text-sm text-muted-foreground">Static demo entries</p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/70">
          {recentExpenses.map((expense) => (
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
      </CardContent>
    </Card>
  );
}
