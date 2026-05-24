import { auth } from "../../../../../auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInvoiceById } from "@/lib/services/invoice.service";
import { isEmailConfigured } from "@/lib/email/mail-client";
import { InvoiceDetailClient } from "@/components/invoices/invoice-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ send?: string }>;
};

export default async function InvoiceDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { send } = await searchParams;

  const [invoice, clients] = await Promise.all([
    getInvoiceById(session.user.id, id),
    prisma.client.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { companyName: "asc" },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
      },
    }),
  ]);

  if (!invoice) notFound();

  const sellerName =
    invoice.user.companyName || invoice.user.name || "Freelancer";

  return (
    <InvoiceDetailClient
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        currency: invoice.currency,
        totalAmount: invoice.totalAmount,
        taxRatePercent: invoice.taxRatePercent,
        dueDate: invoice.dueDate,
        invoiceDate: invoice.invoiceDate,
        paymentTerms: invoice.paymentTerms,
        notes: invoice.notes,
        client: invoice.client,
        user: invoice.user,
        items: invoice.items,
        activities: invoice.activities,
      }}
      clients={clients}
      sellerName={sellerName}
      emailConfigured={isEmailConfigured()}
      openSendDialog={send === "1"}
    />
  );
}
