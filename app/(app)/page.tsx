import { FeaturedModules } from "@/components/dashboard/featured-modules";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { Greeting } from "@/components/dashboard/greeting";
import { QuickActionsRow } from "@/components/dashboard/quick-actions-row";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PageContainer } from "@/components/layout/page-container";

export default function HomePage() {
  return (
    <PageContainer>
      <div className="space-y-8">
        <Greeting />
        <FinancialOverview />
        <QuickActionsRow />
        <FeaturedModules />
        <RecentActivity />
      </div>
    </PageContainer>
  );
}
