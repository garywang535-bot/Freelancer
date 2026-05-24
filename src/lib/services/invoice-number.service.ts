import { prisma } from "@/lib/db";

/**
 * 原子生成 Invoice 编号：INV-{year}-{4位序号}
 * 同一用户同一年份内递增，并发安全（事务 + 唯一约束）
 */
export async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoiceSequence.findUnique({
      where: { userId_year: { userId, year } },
    });

    if (existing) {
      return tx.invoiceSequence.update({
        where: { userId_year: { userId, year } },
        data: { lastNumber: { increment: 1 } },
      });
    }

    return tx.invoiceSequence.create({
      data: { userId, year, lastNumber: 1 },
    });
  });

  const padded = String(sequence.lastNumber).padStart(4, "0");
  return `INV-${year}-${padded}`;
}
