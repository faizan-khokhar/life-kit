import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-border/80 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
