import type { PaperSize, PaymentMethodType, InvoiceTemplate } from "@prisma/client";

export type InvoiceDocItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceDocParty = {
  name: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  addressLines: string[];
};

export type InvoiceDocPaymentMethod = {
  type: PaymentMethodType;
  label: string;
  details: string[];
};

export type InvoiceDocumentData = {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentTerms?: string | null;
  notes?: string | null;
  currency: string;
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  paperSize: PaperSize;
  template: InvoiceTemplate;
  brandPrimaryColor?: string | null;
  brandLogoUrl?: string | null;
  footerSignature?: string | null;
  seller: InvoiceDocParty;
  client: InvoiceDocParty;
  items: InvoiceDocItem[];
  paymentMethods: InvoiceDocPaymentMethod[];
};

/** PDF 页面尺寸（pt） */
export function getPageSize(paperSize: PaperSize): [number, number] {
  return paperSize === "LETTER" ? [612, 792] : [595.28, 841.89];
}

/** 格式化金额 */
export function formatDocMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** 格式化日期 */
export function formatDocDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
