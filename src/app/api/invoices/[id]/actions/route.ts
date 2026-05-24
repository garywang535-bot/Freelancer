import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { cancelInvoice, duplicateInvoice } from "@/lib/services/invoice.service";
import { sendInvoiceEmail } from "@/lib/services/email.service";
import { scheduleRemindersForInvoice } from "@/lib/services/reminder.service";
import { markInvoicePaid } from "@/lib/services/payment.service";
import { sendInvoiceActionSchema } from "@/lib/validators/email";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const markPaidSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  fee: z.coerce.number().min(0).optional(),
  paymentMethod: z
    .enum(["WISE", "STRIPE", "PAYPAL", "BANK_TRANSFER", "CRYPTO", "OTHER"])
    .optional(),
  notes: z.string().optional().nullable(),
});

/** Invoice 操作：send | cancel | duplicate | markPaid */
export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401, "UNAUTHORIZED");

  const { id } = await context.params;

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "send") {
      const parsed = sendInvoiceActionSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? "参数无效", 400);
      }
      const invoice = await sendInvoiceEmail(user.id, id, {
        clientId: parsed.data.clientId,
        message: parsed.data.message,
      });
      if (!invoice) return fail("Invoice 不存在", 404, "NOT_FOUND");
      await scheduleRemindersForInvoice(user.id, id).catch(console.error);
      return ok(invoice);
    }

    if (action === "markPaid") {
      const parsed = markPaidSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? "参数无效", 400);
      }
      const result = await markInvoicePaid(user.id, id, parsed.data);
      if (!result) return fail("Invoice 不存在", 404, "NOT_FOUND");
      return ok(result);
    }

    if (action === "cancel") {
      const invoice = await cancelInvoice(user.id, id);
      if (!invoice) return fail("Invoice 不存在", 404, "NOT_FOUND");
      return ok(invoice);
    }

    if (action === "duplicate") {
      const invoice = await duplicateInvoice(user.id, id);
      if (!invoice) return fail("Invoice 不存在", 404, "NOT_FOUND");
      return ok(invoice, { status: 201 });
    }

    return fail("未知操作", 400);
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, [string, number, string]> = {
        INVOICE_NOT_SENDABLE: ["当前状态不可发送", 409, "INVOICE_NOT_SENDABLE"],
        INVOICE_NOT_CANCELLABLE: ["当前状态不可取消", 409, "INVOICE_NOT_CANCELLABLE"],
        INVOICE_LIMIT_REACHED: ["Free 计划每月最多 10 张 Invoice", 403, "INVOICE_LIMIT_REACHED"],
        INVOICE_ALREADY_PAID: ["Invoice 已付款", 409, "INVOICE_ALREADY_PAID"],
        INVOICE_CANCELLED: ["Invoice 已取消", 409, "INVOICE_CANCELLED"],
        EMAIL_NOT_CONFIGURED: [
          "平台邮件未配置，请在 .env.local 设置 RESEND_API_KEY 和 RESEND_FROM_EMAIL",
          503,
          "EMAIL_NOT_CONFIGURED",
        ],
        CLIENT_NOT_FOUND: ["收件客户不存在", 404, "CLIENT_NOT_FOUND"],
        PDF_GENERATION_FAILED: ["PDF 生成失败", 500, "PDF_GENERATION_FAILED"],
      };
      const mapped = map[error.message];
      if (mapped) return fail(mapped[0], mapped[1], mapped[2]);
    }
    console.error("[invoices action POST]", error);
    return fail("操作失败", 500);
  }
}
