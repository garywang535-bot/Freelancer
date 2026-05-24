import { prisma } from "@/lib/db";
import { taxRateToPercent } from "@/lib/utils/invoice-calc";
import { renderInvoicePdf } from "@/lib/pdf/render-pdf";
import { renderInvoiceDocx } from "@/lib/pdf/render-docx";
import { uploadToR2, isR2Configured } from "@/lib/storage/r2";
import type { InvoiceDocumentData, InvoiceDocPaymentMethod } from "@/lib/pdf/types";
import type { PaymentMethodType, Prisma } from "@prisma/client";
import { getCountryName } from "@/lib/constants/countries";

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

function buildAddressLines(parts: (string | null | undefined)[]): string[] {
  return parts.filter(Boolean) as string[];
}

function formatPaymentMethod(pm: {
  type: PaymentMethodType;
  label: string;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  wiseTag?: string | null;
  paypalEmail?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
}): InvoiceDocPaymentMethod {
  const details: string[] = [];
  if (pm.bankName) details.push(pm.bankName);
  if (pm.accountName) details.push(pm.accountName);
  if (pm.accountNumber) details.push(pm.accountNumber);
  if (pm.iban) details.push(`IBAN: ${pm.iban}`);
  if (pm.swiftCode) details.push(`SWIFT: ${pm.swiftCode}`);
  if (pm.wiseTag) details.push(pm.wiseTag);
  if (pm.paypalEmail) details.push(pm.paypalEmail);
  return { type: pm.type, label: pm.label, details: details.length ? details : [pm.type] };
}

/** 组装 PDF/DOCX 文档数据 */
export async function getInvoiceDocumentData(
  userId: string,
  invoiceId: string
): Promise<InvoiceDocumentData | null> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
      user: {
        select: {
          name: true,
          companyName: true,
          email: true,
          phone: true,
          taxId: true,
          logoUrl: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      },
    },
  });

  if (!invoice) return null;

  const paymentMethods = await prisma.userPaymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const sellerName = invoice.user.companyName || invoice.user.name || "Seller";

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    paymentTerms: invoice.paymentTerms,
    notes: invoice.notes,
    currency: invoice.currency,
    subtotal: decimalToNumber(invoice.subtotal),
    taxRatePercent: taxRateToPercent(decimalToNumber(invoice.taxRate)),
    taxAmount: decimalToNumber(invoice.taxAmount),
    totalAmount: decimalToNumber(invoice.totalAmount),
    paperSize: invoice.paperSize,
    template: invoice.template,
    brandPrimaryColor: invoice.brandPrimaryColor,
    brandLogoUrl: invoice.brandLogoUrl ?? invoice.user.logoUrl,
    footerSignature: invoice.footerSignature,
    seller: {
      name: sellerName,
      email: invoice.user.email,
      phone: invoice.user.phone,
      taxId: invoice.user.taxId,
      addressLines: buildAddressLines([
        invoice.user.address,
        [invoice.user.city, invoice.user.state, invoice.user.postalCode]
          .filter(Boolean)
          .join(", "),
        invoice.user.country ? getCountryName(invoice.user.country) : null,
      ]),
    },
    client: {
      name: invoice.client.companyName,
      email: invoice.client.email,
      phone: null,
      taxId: invoice.client.vatNumber,
      addressLines: buildAddressLines([
        invoice.client.contactName,
        invoice.client.address,
        invoice.client.country ? getCountryName(invoice.client.country) : null,
      ]),
    },
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: decimalToNumber(item.quantity),
      unitPrice: decimalToNumber(item.unitPrice),
      lineTotal: decimalToNumber(item.lineTotal),
    })),
    paymentMethods: paymentMethods.map(formatPaymentMethod),
  };
}

/** 生成 PDF Buffer */
export async function generatePdfBuffer(userId: string, invoiceId: string) {
  const data = await getInvoiceDocumentData(userId, invoiceId);
  if (!data) return null;
  return renderInvoicePdf(data);
}

/** 生成 DOCX Buffer */
export async function generateDocxBuffer(userId: string, invoiceId: string) {
  const data = await getInvoiceDocumentData(userId, invoiceId);
  if (!data) return null;
  return renderInvoiceDocx(data);
}

/** 生成并上传 PDF/DOCX 到 R2，更新 Invoice 记录 */
export async function generateAndStoreDocuments(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    select: { invoiceNumber: true },
  });
  if (!invoice) return null;

  const [pdfBuffer, docxBuffer] = await Promise.all([
    generatePdfBuffer(userId, invoiceId),
    generateDocxBuffer(userId, invoiceId),
  ]);

  if (!pdfBuffer || !docxBuffer) return null;

  let pdfUrl: string | null = null;
  let docxUrl: string | null = null;

  if (isR2Configured()) {
    const baseKey = `invoices/${userId}/${invoiceId}`;
    [pdfUrl, docxUrl] = await Promise.all([
      uploadToR2(`${baseKey}.pdf`, pdfBuffer, "application/pdf"),
      uploadToR2(
        `${baseKey}.docx`,
        docxBuffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ),
    ]);
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl, docxUrl },
  });

  await prisma.invoiceActivity.create({
    data: {
      userId,
      invoiceId,
      type: "PDF_GENERATED",
      message: pdfUrl ? "PDF and DOCX uploaded to storage" : "PDF and DOCX generated",
    },
  });

  return { pdfBuffer, docxBuffer, pdfUrl, docxUrl };
}
