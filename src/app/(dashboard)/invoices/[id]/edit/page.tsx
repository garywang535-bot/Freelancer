import { auth } from "../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInvoiceById } from "@/lib/services/invoice.service";
import { InvoiceEditorClient } from "@/components/invoices/invoice-editor-client";
import { toDateInputValue } from "@/lib/utils/date-input";
import type { PreviewClient } from "@/components/invoices/invoice-preview";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditInvoicePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const invoice = await getInvoiceById(session.user.id, id);

  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") redirect(`/invoices/${id}`);

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { companyName: "asc" },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      email: true,
      country: true,
      address: true,
      vatNumber: true,
    },
  });

  const clientsMap = Object.fromEntries(
    clients.map((c) => [c.id, c as PreviewClient])
  ) as Record<string, PreviewClient>;

  return (
    <InvoiceEditorClient
      mode="edit"
      invoiceId={id}
      previewNumber={invoice.invoiceNumber}
      seller={invoice.user}
      userPlan={session.user.plan ?? "FREE"}
      clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
      clientsMap={clientsMap}
      initial={{
        clientId: invoice.clientId,
        currency: invoice.currency,
        taxRatePercent: invoice.taxRatePercent,
        dueDate: toDateInputValue(invoice.dueDate),
        paymentTerms: invoice.paymentTerms,
        notes: invoice.notes,
        template: invoice.template,
        paperSize: invoice.paperSize,
        brandPrimaryColor: invoice.brandPrimaryColor,
        brandLogoUrl: invoice.brandLogoUrl,
        footerSignature: invoice.footerSignature,
        items: invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      }}
    />
  );
}
