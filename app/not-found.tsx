import Link from "next/link";
import { Home } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
          <Home className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          That route is not part of LifeKit yet. Head back home and try another
          module.
        </p>
        <Button asChild className="mt-8 rounded-xl" size="lg">
          <Link href="/">Back to LifeKit</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
