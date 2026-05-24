import PDFDocument from "pdfkit";
import type { InvoiceDocumentData } from "./types";
import { getPageSize } from "./types";
import { renderPdfByTemplate } from "./templates";

/** 使用 PDFKit 生成 Invoice PDF（支持多模板） */
export function renderInvoicePdf(data: InvoiceDocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const [width, height] = getPageSize(data.paperSize);
    const doc = new PDFDocument({ size: [width, height], margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderPdfByTemplate(doc, data);
    doc.end();
  });
}
