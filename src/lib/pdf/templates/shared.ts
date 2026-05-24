import type PDFKit from "pdfkit";
import type { InvoiceDocumentData } from "../types";
import { formatDocDate, formatDocMoney } from "../types";

export type PdfRenderContext = {
  doc: PDFKit.PDFDocument;
  data: InvoiceDocumentData;
  width: number;
  height: number;
  primary: string;
  margin: number;
};

/** 绘制行项目表格 */
export function drawItemsTable(ctx: PdfRenderContext, startY: number): number {
  const { doc, data, width, primary } = ctx;
  const tableTop = startY;
  const contentWidth = width - ctx.margin * 2;

  doc.fillColor("#f8fafc").rect(ctx.margin, tableTop, contentWidth, 22).fill();
  doc.fillColor("#475569").fontSize(9);
  doc.text("Description", ctx.margin + 8, tableTop + 6);
  doc.text("Qty", ctx.margin + 270, tableTop + 6);
  doc.text("Price", ctx.margin + 330, tableTop + 6);
  doc.text("Amount", ctx.margin + 430, tableTop + 6, { width: 70, align: "right" });

  let rowY = tableTop + 28;
  doc.fillColor("#111").fontSize(10);
  for (const item of data.items) {
    doc.text(item.description, ctx.margin + 8, rowY, { width: 250 });
    doc.text(String(item.quantity), ctx.margin + 270, rowY);
    doc.text(formatDocMoney(item.unitPrice, data.currency), ctx.margin + 330, rowY);
    doc.text(formatDocMoney(item.lineTotal, data.currency), ctx.margin + 430, rowY, {
      width: 70,
      align: "right",
    });
    rowY += 22;
  }

  rowY += 10;
  doc.text("Subtotal", ctx.margin + 330, rowY);
  doc.text(formatDocMoney(data.subtotal, data.currency), ctx.margin + 430, rowY, {
    width: 70,
    align: "right",
  });
  rowY += 16;
  if (data.taxRatePercent > 0) {
    doc.text(`Tax (${data.taxRatePercent}%)`, ctx.margin + 330, rowY);
    doc.text(formatDocMoney(data.taxAmount, data.currency), ctx.margin + 430, rowY, {
      width: 70,
      align: "right",
    });
    rowY += 16;
  }
  doc.fontSize(12).fillColor(primary);
  doc.text("Total", ctx.margin + 330, rowY);
  doc.text(formatDocMoney(data.totalAmount, data.currency), ctx.margin + 430, rowY, {
    width: 70,
    align: "right",
  });

  return rowY + 24;
}

/** 绘制收款信息与备注 */
export function drawPaymentAndNotes(ctx: PdfRenderContext, startY: number): void {
  const { doc, data, width } = ctx;
  let rowY = startY;

  if (data.paymentMethods.length > 0) {
    doc.fillColor("#111").fontSize(11).text("Payment Information", ctx.margin, rowY);
    rowY += 18;
    doc.fontSize(10);
    for (const pm of data.paymentMethods) {
      doc.text(`${pm.label}: ${pm.details.join(" · ")}`, ctx.margin, rowY);
      rowY += 14;
    }
  }

  if (data.notes) {
    rowY += 20;
    doc.fontSize(11).fillColor("#111").text("Notes", ctx.margin, rowY);
    doc.fontSize(10).fillColor("#475569").text(data.notes, ctx.margin, rowY + 16, {
      width: width - ctx.margin * 2,
    });
  }

  if (data.footerSignature) {
    rowY += 60;
    doc.fontSize(10).fillColor("#475569").text(data.footerSignature, ctx.margin, rowY);
  }
}

/** 绘制双方地址块 */
export function drawPartyBlocks(
  ctx: PdfRenderContext,
  billToY: number,
  headerStyle: "default" | "minimal" | "corporate"
): number {
  const { doc, data, width, primary, margin } = ctx;

  if (headerStyle === "corporate") {
    doc.fillColor("#1e293b").rect(0, 0, width, 72).fill();
    doc.fillColor("#fff").fontSize(20).text("INVOICE", margin, 24);
    doc.fontSize(11).text(`#${data.invoiceNumber}`, margin, 48);
    doc.fillColor("#cbd5e1").fontSize(10).text(formatDocDate(data.invoiceDate), width - margin - 120, 28, {
      width: 120,
      align: "right",
    });
    doc.text(`Due: ${formatDocDate(data.dueDate)}`, width - margin - 120, 44, {
      width: 120,
      align: "right",
    });
    doc.y = 90;
  } else if (headerStyle === "minimal") {
    doc.fillColor("#111").fontSize(18).text("Invoice", margin, margin);
    doc.fontSize(10).fillColor("#666").text(data.invoiceNumber, margin, margin + 24);
    doc.y = margin + 50;
  } else {
    doc.fillColor(primary).fontSize(22).text("INVOICE", { align: "right" });
    doc.fillColor("#111").fontSize(11).text(`#${data.invoiceNumber}`, { align: "right" });
    doc.moveDown(1.5);
  }

  const fromY = headerStyle === "corporate" ? 90 : doc.y;
  doc.fontSize(10).fillColor("#666").text("FROM", margin, fromY);
  doc.fillColor("#111").fontSize(11).text(data.seller.name, margin, fromY + 14);
  let sellerY = fromY + 28;
  data.seller.addressLines.forEach((line) => {
    doc.text(line, margin, sellerY);
    sellerY += 14;
  });
  if (data.seller.email) {
    doc.text(data.seller.email, margin, sellerY);
    sellerY += 14;
  }
  if (data.seller.taxId) {
    doc.text(`Tax ID: ${data.seller.taxId}`, margin, sellerY);
    sellerY += 14;
  }

  const billX = width / 2 + 20;
  doc.fontSize(10).fillColor("#666").text("BILL TO", billX, billToY);
  doc.fillColor("#111").fontSize(11).text(data.client.name, billX, billToY + 14);
  let clientY = billToY + 28;
  data.client.addressLines.forEach((line) => {
    doc.text(line, billX, clientY);
    clientY += 14;
  });
  if (data.client.email) {
    doc.text(data.client.email, billX, clientY);
    clientY += 14;
  }

  if (headerStyle !== "corporate") {
    doc.fontSize(10).fillColor("#666");
    doc.text(`Invoice Date: ${formatDocDate(data.invoiceDate)}`, margin, Math.max(sellerY, clientY) + 10);
    doc.text(`Due Date: ${formatDocDate(data.dueDate)}`);
    if (data.paymentTerms) doc.text(`Terms: ${data.paymentTerms}`);
  } else if (data.paymentTerms) {
    doc.fontSize(10).fillColor("#666").text(`Terms: ${data.paymentTerms}`, margin, Math.max(sellerY, clientY) + 10);
  }

  return Math.max(sellerY, clientY) + 40;
}

/** Branding 模板：左侧品牌色条 + Logo 区 */
export function drawBrandingHeader(ctx: PdfRenderContext): number {
  const { doc, data, width, margin, primary } = ctx;

  doc.fillColor(primary).rect(0, 0, 8, ctx.height).fill();
  doc.fillColor(primary).fontSize(24).text("INVOICE", margin + 8, margin);
  doc.fillColor("#111").fontSize(11).text(`#${data.invoiceNumber}`, margin + 8, margin + 30);

  if (data.brandLogoUrl) {
    doc.fontSize(9).fillColor("#666").text("[Logo]", width - margin - 60, margin);
  }

  doc.fontSize(10).fillColor("#666").text(formatDocDate(data.invoiceDate), width - margin - 100, margin + 8, {
    width: 100,
    align: "right",
  });
  doc.text(`Due: ${formatDocDate(data.dueDate)}`, width - margin - 100, margin + 22, {
    width: 100,
    align: "right",
  });

  return margin + 60;
}
