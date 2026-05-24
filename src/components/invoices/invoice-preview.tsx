import { formatDate, formatMoney } from "@/lib/utils/format";
import { getCountryName } from "@/lib/constants/countries";
import { calcInvoiceTotals } from "@/lib/utils/invoice-calc";
import type { InvoiceTemplate, PaperSize } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

export type PreviewClient = {
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  address?: string | null;
  vatNumber?: string | null;
};

export type PreviewSeller = {
  companyName?: string | null;
  name?: string | null;
  email?: string | null;
  website?: string | null;
  phone?: string | null;
  taxId?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type PreviewItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type InvoicePreviewProps = {
  invoiceNumber: string;
  invoiceDate?: Date | string;
  dueDate?: Date | string;
  currency: string;
  taxRatePercent: number;
  paymentTerms?: string | null;
  notes?: string | null;
  template?: InvoiceTemplate;
  paperSize?: PaperSize;
  brandPrimaryColor?: string | null;
  brandLogoUrl?: string | null;
  footerSignature?: string | null;
  client?: PreviewClient | null;
  seller: PreviewSeller;
  items: PreviewItem[];
};

function resolveAccent(template: InvoiceTemplate, brandColor?: string | null): string {
  if (template === "BRANDING" && brandColor) return brandColor;
  if (template === "MINIMAL") return "#111827";
  if (template === "CORPORATE") return "#1e293b";
  return "#2563EB";
}

export function InvoicePreview({
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency,
  taxRatePercent,
  paymentTerms,
  notes,
  template = "STANDARD",
  paperSize = "A4",
  brandPrimaryColor,
  brandLogoUrl,
  footerSignature,
  client,
  seller,
  items,
}: InvoicePreviewProps) {
  const totals = calcInvoiceTotals(items, taxRatePercent);
  const sellerName = seller.companyName || seller.name || "Your Company";
  const accent = resolveAccent(template, brandPrimaryColor);
  const logo = brandLogoUrl || seller.logoUrl;
  const sellerLines = [
    seller.address,
    [seller.city, seller.state, seller.postalCode].filter(Boolean).join(", "),
    seller.country ? getCountryName(seller.country) : null,
  ].filter(Boolean);

  const isCorporate = template === "CORPORATE";
  const isMinimal = template === "MINIMAL";
  const isBranding = template === "BRANDING";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white shadow-sm",
        paperSize === "LETTER" ? "aspect-[8.5/11]" : "aspect-[210/297]",
        isBranding && "border-l-4",
        isMinimal ? "border-slate-300" : "border-slate-200"
      )}
      style={isBranding ? { borderLeftColor: accent } : undefined}
    >
      {isCorporate ? (
        <div className="bg-slate-800 px-6 py-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold tracking-wide">INVOICE</p>
              <p className="text-sm text-slate-300">#{invoiceNumber}</p>
            </div>
            <div className="text-right text-xs text-slate-300">
              <p>{formatDate(invoiceDate)}</p>
              <p>Due {formatDate(dueDate)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn("p-6", isCorporate && "pt-5")}>
        {!isCorporate ? (
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <p
                className={cn(
                  "text-xs uppercase tracking-wide",
                  isMinimal ? "text-slate-700" : "text-slate-500"
                )}
              >
                {isMinimal ? "Invoice" : "Invoice"}
              </p>
              <h3 className="text-lg font-semibold text-slate-900">#{invoiceNumber}</h3>
            </div>
            <div className="text-right">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo" className="mb-2 h-10 w-auto object-contain" />
              ) : null}
              {!isBranding ? (
                <p className="text-xs text-slate-500">{paperSize === "LETTER" ? "Letter" : "A4"}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="font-medium text-slate-900">From</p>
            <p className="mt-1 font-semibold">{sellerName}</p>
            {seller.email ? <p className="text-slate-600">{seller.email}</p> : null}
            {seller.phone ? <p className="text-slate-600">{seller.phone}</p> : null}
            {seller.taxId ? <p className="text-slate-600">Tax ID: {seller.taxId}</p> : null}
            {sellerLines.map((line) => (
              <p key={line} className="text-slate-600">
                {line}
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium text-slate-900">Bill To</p>
            {client ? (
              <>
                <p className="mt-1 font-semibold">{client.companyName}</p>
                <p className="text-slate-600">{client.contactName}</p>
                <p className="text-slate-600">{client.email}</p>
                {client.address ? <p className="text-slate-600">{client.address}</p> : null}
                <p className="text-slate-600">{getCountryName(client.country)}</p>
                {client.vatNumber ? (
                  <p className="text-slate-600">VAT: {client.vatNumber}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-slate-400">Select a client</p>
            )}
          </div>
        </div>

        {!isCorporate ? (
          <div className="mt-4 flex gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-500">Invoice Date</span>
              <p className="font-medium text-slate-800">{formatDate(invoiceDate)}</p>
            </div>
            <div>
              <span className="text-slate-500">Due Date</span>
              <p className="font-medium text-slate-800">{formatDate(dueDate)}</p>
            </div>
            {paymentTerms ? (
              <div>
                <span className="text-slate-500">Terms</span>
                <p className="font-medium text-slate-800">{paymentTerms}</p>
              </div>
            ) : null}
          </div>
        ) : paymentTerms ? (
          <p className="mt-3 text-xs text-slate-600">Terms: {paymentTerms}</p>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-slate-500"
                style={{
                  borderColor: isMinimal ? "#e5e7eb" : accent,
                  backgroundColor: isCorporate ? "#f8fafc" : undefined,
                }}
              >
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 pr-4 font-medium text-right">Qty</th>
                <th className="py-2 pr-4 font-medium text-right">Price</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Add line items
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-50">
                    <td className="py-2 pr-4">{item.description || "—"}</td>
                    <td className="py-2 pr-4 text-right">{item.quantity}</td>
                    <td className="py-2 pr-4 text-right">
                      {formatMoney(item.unitPrice, currency)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatMoney(item.quantity * item.unitPrice, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal, currency)}</span>
            </div>
            {taxRatePercent > 0 ? (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({taxRatePercent}%)</span>
                <span>{formatMoney(totals.taxAmount, currency)}</span>
              </div>
            ) : null}
            <div
              className="flex justify-between border-t pt-2 text-base font-semibold text-slate-900"
              style={{ borderColor: accent }}
            >
              <span>Total</span>
              <span style={{ color: accent }}>{formatMoney(totals.totalAmount, currency)}</span>
            </div>
          </div>
        </div>

        {notes ? (
          <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
            <p className="font-medium text-slate-700">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">{notes}</p>
          </div>
        ) : null}

        {footerSignature ? (
          <p className="mt-6 text-sm text-slate-500">{footerSignature}</p>
        ) : null}
      </div>
    </div>
  );
}
