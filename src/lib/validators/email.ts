import { z } from "zod";

export const sendInvoiceActionSchema = z.object({
  action: z.literal("send"),
  clientId: z.string().min(1, "请选择收件客户").optional(),
  message: z.string().trim().min(1, "请填写邮件正文").max(5000).optional(),
});
