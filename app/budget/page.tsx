import type { Metadata } from "next";
import { BudgetSummary } from "@/components/budget/budget-summary";
import { CategoryList } from "@/components/budget/category-list";
import { ExpenseList } from "@/components/budget/expense-list";
import { SpendingChart } from "@/components/budget/spending-chart";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Budget",
};

export default function BudgetPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <BudgetSummary />
        <SpendingChart />
        <CategoryList />
        <ExpenseList />
        <p className="text-center text-xs text-muted-foreground">
          This is a visual placeholder. Real budgeting logic will come later.
        </p>
      </div>
    </PageContainer>
  );
}
