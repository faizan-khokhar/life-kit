import type { Metadata } from "next";
import { Suspense } from "react";
import { NotesView } from "@/features/notes";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getModule } from "@/lib/modules";

const mod = getModule("notes");

export const metadata: Metadata = {
  title: mod.title,
};

function NotesFallback() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-9 w-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <PageContainer>
      <Suspense fallback={<NotesFallback />}>
        <NotesView />
      </Suspense>
    </PageContainer>
  );
}
