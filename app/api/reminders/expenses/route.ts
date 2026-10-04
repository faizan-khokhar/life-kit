import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/reminders/cron-auth";
import { sendReminderToAll } from "@/lib/reminders/send-to-all";

/**
 * Daily expense reminder (intended for ~23:00 local via external cron).
 *
 * cron-job.org example:
 *   Method: POST
 *   URL: https://<host>/api/reminders/expenses
 *   Header: Authorization: Bearer <CRON_SECRET>
 *   Schedule: every day at 23:00
 */
export async function POST(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await sendReminderToAll({
      title: "LifeKit",
      body: "Don't forget to log today's expenses!",
      url: "/budget",
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send expense reminders.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
