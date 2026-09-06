import type { Metadata } from "next";
import { ManageCategories } from "@/components/budget/manage-categories";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Manage categories",
};

export default function ManageBudgetPage() {
  return (
    <PageContainer>
      <ManageCategories />
    </PageContainer>
  );
}
