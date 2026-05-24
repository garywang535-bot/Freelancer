import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Dashboard KPI 概览 */
export async function getAnalyticsOverview(userId: string) {
  const now = new Date();
  const thisMonthStart = monthStart(now);

  const [paidThisMonth, unpaidAgg, invoiceCount, overdueCount, recentInvoices] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { userId, paidAt: { gte: thisMonthStart } },
        _sum: { netAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          userId,
          deletedAt: null,
          status: { in: ["SENT", "VIEWED", "OVERDUE", "DRAFT"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.count({
        where: { userId, deletedAt: null },
      }),
      prisma.invoice.count({
        where: { userId, deletedAt: null, status: "OVERDUE" },
      }),
      prisma.invoice.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { client: { select: { companyName: true } } },
      }),
    ]);

  return {
    revenueThisMonth: decimalToNumber(paidThisMonth._sum.netAmount),
    unpaidTotal: decimalToNumber(unpaidAgg._sum.totalAmount),
    invoiceCount,
    overdueCount,
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.companyName,
      totalAmount: decimalToNumber(inv.totalAmount),
      currency: inv.currency,
      status: inv.status,
      createdAt: inv.createdAt,
    })),
  };
}

/** 收入趋势（近 N 个月） */
export async function getRevenueTrend(userId: string, months = 6) {
  const results: Array<{ month: string; revenue: number }> = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const agg = await prisma.payment.aggregate({
      where: { userId, paidAt: { gte: start, lt: end } },
      _sum: { netAmount: true },
    });

    results.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      revenue: decimalToNumber(agg._sum.netAmount),
    });
  }

  return results;
}

/** 客户收入排行 */
export async function getClientsRanking(userId: string, limit = 10) {
  const paid = await prisma.invoice.groupBy({
    by: ["clientId"],
    where: { userId, deletedAt: null, status: "PAID" },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  const clientIds = paid.map((p) => p.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, companyName: true, country: true },
  });

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  return paid.map((p) => ({
    clientId: p.clientId,
    companyName: clientMap[p.clientId]?.companyName ?? "Unknown",
    country: clientMap[p.clientId]?.country ?? "",
    revenue: decimalToNumber(p._sum.totalAmount),
    invoiceCount: p._count.id,
  }));
}

/** 客户国家分布 */
export async function getCountryDistribution(userId: string) {
  const clients = await prisma.client.findMany({
    where: { userId, deletedAt: null },
    select: { country: true },
  });

  const counts: Record<string, number> = {};
  for (const c of clients) {
    counts[c.country] = (counts[c.country] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}
