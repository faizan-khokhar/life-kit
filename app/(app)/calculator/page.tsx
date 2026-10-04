import type { Metadata } from "next";
import { CalculatorView } from "@/features/calculator";
import { PageContainer } from "@/components/layout/page-container";
import { getModule } from "@/lib/modules";

const mod = getModule("calculator");

export const metadata: Metadata = {
  title: mod.title,
};

export default function CalculatorPage() {
  return (
    <PageContainer>
      <CalculatorView />
    </PageContainer>
  );
}
