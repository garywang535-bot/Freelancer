import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { processDueReminders, markOverdueInvoices } from "@/lib/services/reminder.service";

function verifyCron(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return auth === `Bearer ${secret}`;
}

/** Cron：催款 + 逾期状态 */
export async function GET(request: NextRequest) {
  if (!verifyCron(request)) {
    return fail("Unauthorized", 401, "UNAUTHORIZED");
  }

  const [reminders, overdue] = await Promise.all([
    processDueReminders(),
    markOverdueInvoices(),
  ]);

  return ok({ reminders, overdue });
}
