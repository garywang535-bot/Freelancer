import type PDFKit from "pdfkit";
import type { InvoiceDocumentData } from "../types";
import { getPageSize } from "../types";
import {
  drawBrandingHeader,
  drawItemsTable,
  drawPartyBlocks,
  drawPaymentAndNotes,
  type PdfRenderContext,
} from "./shared";

function resolvePrimary(data: InvoiceDocumentData): string {
  if (data.template === "BRANDING" && data.brandPrimaryColor) {
    return data.brandPrimaryColor;
  }
  if (data.template === "MINIMAL") return "#111827";
  if (data.template === "CORPORATE") return "#1e293b";
  return "#2563EB";
}

function renderStandardLayout(ctx: PdfRenderContext): void {
  const y = drawPartyBlocks(ctx, 130, "default");
  const tableEnd = drawItemsTable(ctx, y);
  drawPaymentAndNotes(ctx, tableEnd);
}

function renderMinimalLayout(ctx: PdfRenderContext): void {
  const y = drawPartyBlocks(ctx, 120, "minimal");
  const tableEnd = drawItemsTable(ctx, y);
  drawPaymentAndNotes(ctx, tableEnd);
}

function renderCorporateLayout(ctx: PdfRenderContext): void {
  const y = drawPartyBlocks(ctx, 90, "corporate");
  const tableEnd = drawItemsTable(ctx, y);
  drawPaymentAndNotes(ctx, tableEnd);
}

function renderBrandingLayout(ctx: PdfRenderContext): void {
  const { doc, data, margin } = ctx;
  const headerBottom = drawBrandingHeader(ctx);

  doc.fontSize(10).fillColor("#666").text("FROM", margin + 8, headerBottom);
  doc.fillColor("#111").fontSize(11).text(data.seller.name, margin + 8, headerBottom + 14);
  let sellerY = headerBottom + 28;
  data.seller.addressLines.forEach((line) => {
    doc.text(line, margin + 8, sellerY);
    sellerY += 14;
  });

  const billX = ctx.width / 2 + 20;
  doc.fontSize(10).fillColor("#666").text("BILL TO", billX, headerBottom);
  doc.fillColor("#111").fontSize(11).text(data.client.name, billX, headerBottom + 14);
  let clientY = headerBottom + 28;
  data.client.addressLines.forEach((line) => {
    doc.text(line, billX, clientY);
    clientY += 14;
  });

  if (data.paymentTerms) {
    doc.fontSize(10).fillColor("#666").text(`Terms: ${data.paymentTerms}`, margin + 8, Math.max(sellerY, clientY) + 10);
  }

  const tableEnd = drawItemsTable(ctx, Math.max(sellerY, clientY) + 36);
  drawPaymentAndNotes(ctx, tableEnd);
}

/** 按模板渲染 PDF 内容 */
export function renderPdfByTemplate(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
  const [width, height] = getPageSize(data.paperSize);
  const ctx: PdfRenderContext = {
    doc,
    data,
    width,
    height,
    primary: resolvePrimary(data),
    margin: 50,
  };

  switch (data.template) {
    case "MINIMAL":
      renderMinimalLayout(ctx);
      break;
    case "CORPORATE":
      renderCorporateLayout(ctx);
      break;
    case "BRANDING":
      renderBrandingLayout(ctx);
      break;
    default:
      renderStandardLayout(ctx);
  }
}
