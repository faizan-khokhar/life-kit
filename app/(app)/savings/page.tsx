import type { Metadata } from "next";
import { ComingSoon } from "@/components/modules/coming-soon";
import { getModule } from "@/lib/modules";

const mod = getModule("savings");

export const metadata: Metadata = {
  title: mod.title,
};

export default function SavingsPage() {
  return <ComingSoon module={mod} />;
}
