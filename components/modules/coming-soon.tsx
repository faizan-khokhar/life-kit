import Link from "next/link";
import type { Module } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

type ComingSoonProps = {
  module: Module;
};

export function ComingSoon({ module }: ComingSoonProps) {
  const Icon = module.icon;

  return (
    <PageContainer className="flex flex-1">
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-sm">
          <Icon className="size-8" aria-hidden />
        </span>
        <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {module.title}
        </p>
        <p className="mt-2 text-sm font-medium text-primary">Coming Soon</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {module.description} This part of LifeKit is currently being built.
        </p>
        <Button asChild className="mt-8 rounded-xl" size="lg">
          <Link href="/">Back to LifeKit</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
