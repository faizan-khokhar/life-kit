import type { Metadata } from "next";
import { Suspense } from "react";
import { BudgetView } from "@/features/budget";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Budget",
};

function BudgetFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function BudgetPage() {
  return (
    <PageContainer>
      <Suspense fallback={<BudgetFallback />}>
        <BudgetView />
      </Suspense>
    </PageContainer>
  );
}
