import type { InvoiceTemplate } from "@prisma/client";

export const INVOICE_TEMPLATES: Array<{
  value: InvoiceTemplate;
  label: string;
  description: string;
  proOnly: boolean;
}> = [
  {
    value: "STANDARD",
    label: "Standard",
    description: "经典蓝调，适合大多数场景",
    proOnly: false,
  },
  {
    value: "MINIMAL",
    label: "Minimal",
    description: "极简黑白，干净专业",
    proOnly: true,
  },
  {
    value: "CORPORATE",
    label: "Corporate",
    description: "深色页眉，企业风格",
    proOnly: true,
  },
  {
    value: "BRANDING",
    label: "Branding",
    description: "自定义品牌色与 Logo",
    proOnly: true,
  },
];

export const PAPER_SIZES = [
  { value: "A4" as const, label: "A4（国际）" },
  { value: "LETTER" as const, label: "Letter（美国）" },
];
