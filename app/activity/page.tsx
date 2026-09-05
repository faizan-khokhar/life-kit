import type { Metadata } from "next";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { recentActivity } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return (
    <PageContainer>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
          <p className="text-sm text-muted-foreground">
            A feed of recent actions across LifeKit.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 font-normal">
          Demo data
        </Badge>
      </div>
      <RecentActivity limit={recentActivity.length} showHeader={false} />
    </PageContainer>
  );
}
