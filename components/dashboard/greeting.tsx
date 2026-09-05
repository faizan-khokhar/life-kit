"use client";

import { useSyncExternalStore } from "react";
import { getGreeting } from "@/lib/format";

const emptySubscribe = () => () => {};

export function Greeting() {
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const greeting = hydrated ? getGreeting() : "Hello";

  return (
    <div className="space-y-1">
      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {greeting}
      </p>
      <p className="text-base text-muted-foreground">Here&apos;s your LifeKit</p>
    </div>
  );
}
