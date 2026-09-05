import type { Metadata } from "next";
import { ComingSoon } from "@/components/modules/coming-soon";
import { getModule } from "@/lib/modules";

const mod = getModule("converter");

export const metadata: Metadata = {
  title: mod.title,
};

export default function ConverterPage() {
  return <ComingSoon module={mod} />;
}
