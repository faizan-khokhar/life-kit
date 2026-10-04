"use client";

import { Bell } from "lucide-react";
import { usePushNotifications } from "@/features/settings/data/use-push-notifications";
import { Switch } from "@/components/ui/switch";

function statusDescription(
  status: ReturnType<typeof usePushNotifications>["status"],
  error: string | null,
): string {
  if (error) return error;
  switch (status) {
    case "loading":
      return "Checking notification support…";
    case "unsupported":
      return "Not supported in this browser";
    case "denied":
      return "Blocked — enable notifications in browser settings";
    case "enabled":
      return "Expense and goal reminders on";
    case "disabled":
      return "Reminders for expenses and weekly goals";
    case "default":
      return "Tap to allow reminders for expenses and goals";
    default:
      return "Reminders for expenses and weekly goals";
  }
}

export function NotificationsRow() {
  const { status, busy, error, enabled, enable, disable } =
    usePushNotifications();

  const unsupported = status === "unsupported" || status === "denied";
  const loading = status === "loading";

  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Bell className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Notifications</p>
        <p
          className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {statusDescription(status, error)}
        </p>
      </div>
      <Switch
        checked={enabled}
        disabled={busy || unsupported || loading}
        aria-label="Enable push notifications"
        onCheckedChange={(checked) => {
          void (checked ? enable() : disable());
        }}
      />
    </div>
  );
}
