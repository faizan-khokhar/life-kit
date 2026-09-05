import type { Metadata } from "next";
import { Bell, Cloud, Download, Shield } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Settings",
};

const comingSoonRows = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Reminders for bills and tasks",
  },
  {
    icon: Cloud,
    title: "Sync",
    description: "Optional cloud backup later",
  },
  {
    icon: Download,
    title: "Export",
    description: "Download your data",
  },
  {
    icon: Shield,
    title: "Privacy",
    description: "Local-first by default",
  },
];

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Appearance and app preferences.
          </p>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appearance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose light, dark, or follow your system.
            </p>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">App</span>
              <span className="font-medium">LifeKit</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">0.1.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Tagline</span>
              <span className="font-medium">One app. Many useful things.</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm opacity-70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Coming later</CardTitle>
            <p className="text-sm text-muted-foreground">
              These settings are placeholders for future work.
            </p>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {comingSoonRows.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                aria-disabled="true"
                className="flex items-center gap-3 px-6 py-4"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
