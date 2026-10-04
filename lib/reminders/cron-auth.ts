import { NextResponse } from "next/server";

/**
 * Shared auth for external cron callers (e.g. cron-job.org).
 * Expects Authorization: Bearer <CRON_SECRET> or x-cron-secret header.
 */
export function assertCronAuthorized(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  const bearer = request.headers.get("authorization");
  const fromBearer =
    bearer?.startsWith("Bearer ") ? bearer.slice("Bearer ".length).trim() : null;
  const fromHeader = request.headers.get("x-cron-secret")?.trim() ?? null;
  const provided = fromBearer || fromHeader;

  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
