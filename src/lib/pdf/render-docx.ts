import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";
import type { InvoiceDocumentData } from "./types";
import { formatDocDate, formatDocMoney } from "./types";

/** 生成 Invoice DOCX */
export async function renderInvoiceDocx(data: InvoiceDocumentData): Promise<Buffer> {
  const itemRows = data.items.map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(item.description)] }),
          new TableCell({
            children: [new Paragraph({ text: String(item.quantity), alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatDocMoney(item.unitPrice, data.currency),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatDocMoney(item.lineTotal, data.currency),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: `Invoice ${data.invoiceNumber} (${data.template})`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun(`Date: ${formatDocDate(data.invoiceDate)}`)] }),
          new Paragraph({ children: [new TextRun(`Due: ${formatDocDate(data.dueDate)}`)] }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "From", bold: true })] }),
          new Paragraph(data.seller.name),
          ...data.seller.addressLines.map((l) => new Paragraph(l)),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "Bill To", bold: true })] }),
          new Paragraph(data.client.name),
          ...data.client.addressLines.map((l) => new Paragraph(l)),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Description", "Qty", "Price", "Amount"].map(
                  (h) =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                    })
                ),
              }),
              ...itemRows,
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun(`Subtotal: ${formatDocMoney(data.subtotal, data.currency)}`),
            ],
          }),
          ...(data.taxRatePercent > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun(
                      `Tax (${data.taxRatePercent}%): ${formatDocMoney(data.taxAmount, data.currency)}`
                    ),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total: ${formatDocMoney(data.totalAmount, data.currency)}`,
                bold: true,
              }),
            ],
          }),
          ...(data.notes
            ? [
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Notes", bold: true })] }),
                new Paragraph(data.notes),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
