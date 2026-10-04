import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/reminders/cron-auth";
import { sendReminderToAll } from "@/lib/reminders/send-to-all";

/**
 * Weekly goal review reminder (intended for Sundays via external cron).
 *
 * cron-job.org example:
 *   Method: POST
 *   URL: https://<host>/api/reminders/goals
 *   Header: Authorization: Bearer <CRON_SECRET>
 *   Schedule: every Sunday at 10:00
 */
export async function POST(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await sendReminderToAll({
      title: "LifeKit",
      body: "Time to log what you achieved toward your goals this week!",
      url: "/goals",
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send goal reminders.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
