"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountCard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignOut() {
    setError(null);
    setSubmitting(true);
    try {
      await signOut();
      router.replace("/sign-in" as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Signed in with email and password.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Email</span>
          <span className="truncate font-medium">{user?.email ?? "—"}</span>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleSignOut}
          disabled={submitting}
        >
          <LogOut className="size-4" aria-hidden />
          {submitting ? "Signing out…" : "Sign out"}
        </Button>
      </CardContent>
    </Card>
  );
}
