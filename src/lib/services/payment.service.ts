import { prisma } from "@/lib/db";
import type { PaymentMethodType, Prisma } from "@prisma/client";

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

export type MarkPaidInput = {
  amount?: number;
  fee?: number;
  paymentMethod?: PaymentMethodType;
  paidAt?: Date;
  notes?: string | null;
};

/** 收款列表 */
export async function listPayments(
  userId: string,
  options: { page?: number; limit?: number } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = { userId };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip,
      take: limit,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            client: { select: { companyName: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items: payments.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoiceNumber: p.invoice.invoiceNumber,
      clientName: p.invoice.client.companyName,
      amount: decimalToNumber(p.amount),
      fee: decimalToNumber(p.fee),
      netAmount: decimalToNumber(p.netAmount),
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      paidAt: p.paidAt,
      notes: p.notes,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/** 手动标记 Invoice 为已付款 */
export async function markInvoicePaid(
  userId: string,
  invoiceId: string,
  input: MarkPaidInput = {}
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
  });

  if (!invoice) return null;
  if (invoice.status === "PAID") throw new Error("INVOICE_ALREADY_PAID");
  if (invoice.status === "CANCELLED") throw new Error("INVOICE_CANCELLED");

  const amount = input.amount ?? decimalToNumber(invoice.totalAmount);
  const fee = input.fee ?? 0;
  const netAmount = amount - fee;
  const paidAt = input.paidAt ?? new Date();
  const paymentMethod = input.paymentMethod ?? "OTHER";

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId,
        invoiceId,
        amount,
        currency: invoice.currency,
        fee,
        netAmount,
        paymentMethod,
        paidAt,
        notes: input.notes ?? null,
      },
    });

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt,
        activities: {
          create: {
            userId,
            type: "PAID",
            message: `Payment received: ${amount} ${invoice.currency}`,
            metadata: { paymentId: payment.id },
          },
        },
      },
    });

    return { invoice: updated, payment };
  });
}
