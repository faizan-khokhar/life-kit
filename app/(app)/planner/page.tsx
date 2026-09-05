import type { Metadata } from "next";
import { ComingSoon } from "@/components/modules/coming-soon";
import { getModule } from "@/lib/modules";

const mod = getModule("planner");

export const metadata: Metadata = {
  title: mod.title,
};

export default function PlannerPage() {
  return <ComingSoon module={mod} />;
}
