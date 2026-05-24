import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/billing/plan-limits";
import { assertFeature } from "@/lib/billing/features";
import { sendReminderEmail } from "@/lib/services/email.service";
import { getPlanFeatures } from "@/lib/billing/features";

import type { ReminderRuleType } from "@prisma/client";

const RULE_OFFSETS: Record<ReminderRuleType, number> = {
  BEFORE_7_DAYS: -7,
  BEFORE_3_DAYS: -3,
  ON_DUE_DATE: 0,
  OVERDUE_7_DAYS: 7,
  OVERDUE_14_DAYS: 14,
};

const RULE_LABELS: Record<ReminderRuleType, string> = {
  BEFORE_7_DAYS: "7 days before due",
  BEFORE_3_DAYS: "3 days before due",
  ON_DUE_DATE: "On due date",
  OVERDUE_7_DAYS: "7 days overdue",
  OVERDUE_14_DAYS: "14 days overdue",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 获取用户催款规则 */
export async function getReminderRules(userId: string) {
  const rules = await prisma.reminderRule.findMany({
    where: { userId },
    orderBy: { type: "asc" },
  });

  if (rules.length === 0) {
    const defaults = Object.keys(RULE_OFFSETS) as ReminderRuleType[];
    await prisma.reminderRule.createMany({
      data: defaults.map((type) => ({ userId, type, enabled: false })),
      skipDuplicates: true,
    });
    return prisma.reminderRule.findMany({ where: { userId } });
  }

  return rules;
}

/** 更新催款规则（Pro+） */
export async function updateReminderRules(
  userId: string,
  updates: Array<{ type: ReminderRuleType; enabled: boolean }>
) {
  const plan = await getUserPlan(userId);
  assertFeature(plan, "autoReminders");

  await Promise.all(
    updates.map((u) =>
      prisma.reminderRule.upsert({
        where: { userId_type: { userId, type: u.type } },
        update: { enabled: u.enabled },
        create: { userId, type: u.type, enabled: u.enabled },
      })
    )
  );

  return getReminderRules(userId);
}

/** 为 Invoice 预生成催款计划（发送后调用） */
export async function scheduleRemindersForInvoice(userId: string, invoiceId: string) {
  const plan = await getUserPlan(userId);
  if (!getPlanFeatures(plan).autoReminders) return;

  const [invoice, rules] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: invoiceId, userId, deletedAt: null },
      include: { client: true, user: { select: { companyName: true, name: true } } },
    }),
    prisma.reminderRule.findMany({ where: { userId, enabled: true } }),
  ]);

  if (!invoice || invoice.status === "PAID" || invoice.status === "CANCELLED") return;

  const sellerName = invoice.user.companyName || invoice.user.name || "Freelancer";

  for (const rule of rules) {
    const offset = RULE_OFFSETS[rule.type];
    const scheduledAt = addDays(invoice.dueDate, offset);

    const subject =
      offset >= 0
        ? `Payment reminder: Invoice ${invoice.invoiceNumber} is overdue`
        : `Upcoming payment: Invoice ${invoice.invoiceNumber}`;

    const body = `
      <p>Hi ${invoice.client.contactName},</p>
      <p>This is a reminder (${RULE_LABELS[rule.type]}) regarding invoice
      <strong>${invoice.invoiceNumber}</strong> from ${sellerName}.</p>
      <p>Amount due: <strong>${invoice.totalAmount} ${invoice.currency}</strong></p>
      <p>Due date: ${invoice.dueDate.toLocaleDateString("en-US")}</p>
    `;

    await prisma.reminder.upsert({
      where: { invoiceId_type: { invoiceId, type: rule.type } },
      update: { scheduledAt, subject, body, status: "SCHEDULED" },
      create: {
        invoiceId,
        type: rule.type,
        scheduledAt,
        subject,
        body,
        status: "SCHEDULED",
      },
    });
  }
}

/** Cron：处理到期催款 */
export async function processDueReminders() {
  const now = new Date();
  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
      invoice: {
        deletedAt: null,
        status: { in: ["SENT", "VIEWED", "OVERDUE"] },
      },
    },
    include: {
      invoice: {
        include: { user: { select: { id: true, companyName: true, name: true } } },
      },
    },
    take: 50,
  });

  let processed = 0;

  for (const reminder of dueReminders) {
    const userId = reminder.invoice.userId;
    try {
      await sendReminderEmail(
        userId,
        reminder.invoiceId,
        reminder.id,
        reminder.subject ?? `Reminder: ${reminder.invoice.invoiceNumber}`,
        reminder.body ?? ""
      );
      processed++;
    } catch (e) {
      console.error("[reminder]", reminder.id, e);
    }
  }

  return { processed, total: dueReminders.length };
}

/** Cron：标记逾期 Invoice */
export async function markOverdueInvoices() {
  const today = startOfDay(new Date());

  const overdue = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      status: { in: ["SENT", "VIEWED"] },
      dueDate: { lt: today },
    },
    select: { id: true, userId: true, invoiceNumber: true },
  });

  for (const inv of overdue) {
    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        status: "OVERDUE",
        overdueAt: new Date(),
        activities: {
          create: {
            userId: inv.userId,
            type: "OVERDUE",
            message: `Invoice ${inv.invoiceNumber} is overdue`,
          },
        },
      },
    });
  }

  return { count: overdue.length };
}
