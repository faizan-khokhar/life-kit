import type { Metadata } from "next";
import { ModuleGrid } from "@/components/modules/module-grid";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "More",
};

export default function MorePage() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">All modules</h2>
        <p className="text-sm text-muted-foreground">
          Every tool in LifeKit, organized by category.
        </p>
      </div>
      <ModuleGrid />
    </PageContainer>
  );
}
