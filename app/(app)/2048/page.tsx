import type { Metadata } from "next";
import { Game2048View } from "@/features/game-2048";
import { PageContainer } from "@/components/layout/page-container";
import { getModule } from "@/lib/modules";

const mod = getModule("game-2048");

export const metadata: Metadata = {
  title: mod.title,
};

export default function Game2048Page() {
  return (
    <PageContainer>
      <Game2048View />
    </PageContainer>
  );
}
