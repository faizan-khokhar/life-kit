import type { Metadata } from "next";
import { BudgetView } from "@/components/budget/budget-view";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Budget",
};

export default function BudgetPage() {
  return (
    <PageContainer>
      <BudgetView />
    </PageContainer>
  );
}
