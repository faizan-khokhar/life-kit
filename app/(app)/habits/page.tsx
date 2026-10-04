import type { Metadata } from "next";
import { Suspense } from "react";
import { HabitsView } from "@/features/habits";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getModule } from "@/lib/modules";

const mod = getModule("habits");

export const metadata: Metadata = {
  title: mod.title,
};

function HabitsFallback() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function HabitsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<HabitsFallback />}>
        <HabitsView />
      </Suspense>
    </PageContainer>
  );
}
