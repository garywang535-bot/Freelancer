import { prisma } from "@/lib/db";
import type { CreateClientInput, UpdateClientInput } from "@/lib/validators/client";
import { normalizeClientInput } from "@/lib/validators/client";
import type { InvoiceStatus, Prisma } from "@prisma/client";

export type ClientStatus = "NEW" | "ACTIVE" | "PENDING" | "OVERDUE";

export type ClientListItem = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  totalRevenue: number;
  unpaidAmount: number;
  invoiceCount: number;
  lastCollaborationAt: Date | null;
  status: ClientStatus;
  createdAt: Date;
};

const UNPAID_STATUSES: InvoiceStatus[] = ["SENT", "VIEWED", "OVERDUE", "DRAFT"];
const PAID_STATUS: InvoiceStatus = "PAID";

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

function deriveStatus(
  invoiceCount: number,
  hasOverdue: boolean,
  unpaidAmount: number
): ClientStatus {
  if (invoiceCount === 0) return "NEW";
  if (hasOverdue) return "OVERDUE";
  if (unpaidAmount > 0) return "PENDING";
  return "ACTIVE";
}

/** 批量计算客户列表统计 */
async function buildClientStats(userId: string, clientIds: string[]) {
  if (clientIds.length === 0) {
    return new Map<
      string,
      {
        totalRevenue: number;
        unpaidAmount: number;
        invoiceCount: number;
        lastCollaborationAt: Date | null;
        hasOverdue: boolean;
      }
    >();
  }

  const baseWhere = {
    userId,
    clientId: { in: clientIds },
    deletedAt: null,
  };

  const [paidGroups, unpaidGroups, countGroups, lastGroups, overdueGroups] =
    await Promise.all([
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { ...baseWhere, status: PAID_STATUS },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { ...baseWhere, status: { in: UNPAID_STATUSES } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: baseWhere,
        _count: { id: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: baseWhere,
        _max: { createdAt: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { ...baseWhere, status: "OVERDUE" },
        _count: { id: true },
      }),
    ]);

  const stats = new Map<
    string,
    {
      totalRevenue: number;
      unpaidAmount: number;
      invoiceCount: number;
      lastCollaborationAt: Date | null;
      hasOverdue: boolean;
    }
  >();

  for (const id of clientIds) {
    stats.set(id, {
      totalRevenue: 0,
      unpaidAmount: 0,
      invoiceCount: 0,
      lastCollaborationAt: null,
      hasOverdue: false,
    });
  }

  for (const row of paidGroups) {
    const item = stats.get(row.clientId)!;
    item.totalRevenue = decimalToNumber(row._sum.totalAmount);
  }
  for (const row of unpaidGroups) {
    const item = stats.get(row.clientId)!;
    item.unpaidAmount = decimalToNumber(row._sum.totalAmount);
  }
  for (const row of countGroups) {
    const item = stats.get(row.clientId)!;
    item.invoiceCount = row._count.id;
  }
  for (const row of lastGroups) {
    const item = stats.get(row.clientId)!;
    item.lastCollaborationAt = row._max.createdAt;
  }
  for (const row of overdueGroups) {
    const item = stats.get(row.clientId)!;
    item.hasOverdue = row._count.id > 0;
  }

  return stats;
}

/** 客户列表（分页 + 搜索） */
export async function listClients(
  userId: string,
  options: { page?: number; limit?: number; search?: string } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.ClientWhereInput = {
    userId,
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { companyName: { contains: options.search, mode: "insensitive" } },
            { contactName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { companyName: "asc" },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  const stats = await buildClientStats(
    userId,
    clients.map((c) => c.id)
  );

  const items: ClientListItem[] = clients.map((client) => {
    const s = stats.get(client.id)!;
    return {
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      email: client.email,
      country: client.country,
      totalRevenue: s.totalRevenue,
      unpaidAmount: s.unpaidAmount,
      invoiceCount: s.invoiceCount,
      lastCollaborationAt: s.lastCollaborationAt,
      status: deriveStatus(s.invoiceCount, s.hasOverdue, s.unpaidAmount),
      createdAt: client.createdAt,
    };
  });

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** 获取单个客户（含详情统计） */
export async function getClientById(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });

  if (!client) return null;

  const stats = await buildClientStats(userId, [clientId]);
  const s = stats.get(clientId)!;

  return {
    ...client,
    totalRevenue: s.totalRevenue,
    unpaidAmount: s.unpaidAmount,
    invoiceCount: s.invoiceCount,
    lastCollaborationAt: s.lastCollaborationAt,
    status: deriveStatus(s.invoiceCount, s.hasOverdue, s.unpaidAmount),
  };
}

/** 客户详情：历史 Invoice + 收款记录 */
export async function getClientDetail(userId: string, clientId: string) {
  const client = await getClientById(userId, clientId);
  if (!client) return null;

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId, clientId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        currency: true,
        totalAmount: true,
        dueDate: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        userId,
        invoice: { clientId, deletedAt: null },
      },
      orderBy: { paidAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        paidAt: true,
        invoice: {
          select: { invoiceNumber: true },
        },
      },
    }),
  ]);

  return {
    client,
    invoices: invoices.map((inv) => ({
      ...inv,
      totalAmount: decimalToNumber(inv.totalAmount),
    })),
    payments: payments.map((pay) => ({
      ...pay,
      amount: decimalToNumber(pay.amount),
    })),
  };
}

/** 创建客户 */
export async function createClient(userId: string, input: CreateClientInput) {
  const data = normalizeClientInput(input);

  return prisma.client.create({
    data: {
      userId,
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      country: data.country,
      address: data.address ?? null,
      vatNumber: data.vatNumber ?? null,
      notes: data.notes ?? null,
    },
  });
}

/** 更新客户 */
export async function updateClient(
  userId: string,
  clientId: string,
  input: UpdateClientInput
) {
  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });
  if (!existing) return null;

  const data = normalizeClientInput(input);

  return prisma.client.update({
    where: { id: clientId },
    data: {
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      country: data.country,
      address: data.address,
      vatNumber: data.vatNumber,
      notes: data.notes,
    },
  });
}

/** 软删除客户 */
export async function deleteClient(userId: string, clientId: string) {
  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });

  if (!existing) return null;

  const activeInvoiceCount = await prisma.invoice.count({
    where: {
      clientId,
      userId,
      deletedAt: null,
      status: { not: "CANCELLED" },
    },
  });

  if (activeInvoiceCount > 0) {
    throw new Error("CLIENT_HAS_INVOICES");
  }

  return prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });
}
