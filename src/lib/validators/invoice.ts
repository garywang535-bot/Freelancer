import { z } from "zod";
import { isValidCurrency } from "@/lib/constants/currencies";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "服务描述不能为空").max(2000),
  quantity: z.coerce.number().positive("数量必须大于 0"),
  unitPrice: z.coerce.number().min(0, "单价不能为负"),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "请选择客户"),
  currency: z.string().refine(isValidCurrency, "不支持的币种"),
  taxRatePercent: z.coerce.number().min(0).max(100).default(0),
  dueDate: z.coerce.date({ message: "请选择到期日" }),
  invoiceDate: z.coerce.date().optional(),
  paymentTerms: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  template: z
    .enum(["STANDARD", "MINIMAL", "CORPORATE", "BRANDING"])
    .optional()
    .default("STANDARD"),
  paperSize: z.enum(["A4", "LETTER"]).optional().default("A4"),
  brandPrimaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "品牌色格式应为 #RRGGBB")
    .optional()
    .nullable(),
  brandLogoUrl: z.string().trim().max(500).optional().nullable(),
  footerSignature: z.string().trim().max(500).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "至少添加一个行项目"),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const invoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"])
    .optional(),
  clientId: z.string().optional(),
  search: z.string().trim().max(100).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
