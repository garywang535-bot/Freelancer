import { prisma } from "@/lib/db";
import { isEmailConfigured, sendEmail, buildResendFrom } from "@/lib/email/mail-client";
import {
  buildDefaultInvoiceMessage,
  buildInvoiceEmailHtml,
} from "@/lib/email/invoice-message";
import { generatePdfBuffer } from "@/lib/services/pdf.service";
import { SENDABLE_STATUSES } from "@/lib/constants/invoice-status";
import type { Prisma } from "@prisma/client";

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

export type SendInvoiceEmailOptions = {
  /** 收件客户 ID（从 Clients 选择，默认使用 Invoice 关联客户） */
  clientId?: string;
  /** 邮件正文（纯文本） */
  message?: string;
};

/** 发送 Invoice 邮件（含 PDF 附件）并更新状态 */
export async function sendInvoiceEmail(
  userId: string,
  invoiceId: string,
  options: SendInvoiceEmailOptions = {}
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: {
      client: true,
      user: { select: { companyName: true, name: true, email: true } },
    },
  });

  if (!invoice) return null;
  if (!SENDABLE_STATUSES.includes(invoice.status)) {
    throw new Error("INVOICE_NOT_SENDABLE");
  }

  const recipientClient = await resolveRecipientClient(
    userId,
    options.clientId ?? invoice.clientId
  );
  if (!recipientClient) {
    throw new Error("CLIENT_NOT_FOUND");
  }

  if (!isEmailConfigured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const pdfBuffer = await generatePdfBuffer(userId, invoiceId);
  if (!pdfBuffer) throw new Error("PDF_GENERATION_FAILED");

  const sellerName = invoice.user.companyName || invoice.user.name || "Freelancer";
  const totalAmount = decimalToNumber(invoice.totalAmount);
  const message =
    options.message?.trim() ||
    buildDefaultInvoiceMessage({
      contactName: recipientClient.contactName,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      sellerName,
    });

  const subject = `Invoice ${invoice.invoiceNumber} from ${sellerName}`;
  const html = buildInvoiceEmailHtml({
    invoiceNumber: invoice.invoiceNumber,
    clientName: recipientClient.contactName,
    sellerName,
    totalAmount,
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    message,
  });

  const emailJob = await prisma.emailJob.create({
    data: {
      userId,
      invoiceId,
      type: "INVOICE_SEND",
      status: "PENDING",
      toEmail: recipientClient.email,
      subject,
      body: message,
    },
  });

  try {
    const result = await sendEmail({
      to: recipientClient.email,
      subject,
      html,
      from: buildResendFrom(sellerName),
      replyTo: invoice.user.email ?? undefined,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: "SENT",
        resendId: result?.id ?? null,
      },
    });

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        activities: {
          create: {
            userId,
            type: "SENT",
            message: `Invoice emailed to ${recipientClient.companyName} (${recipientClient.email}) via Resend`,
          },
        },
      },
    });

    return updated;
  } catch (error) {
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Send failed",
      },
    });
    throw error;
  }
}

async function resolveRecipientClient(userId: string, clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });
}

/** 发送催款邮件 */
export async function sendReminderEmail(
  userId: string,
  invoiceId: string,
  reminderId: string,
  subject: string,
  body: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: {
      client: true,
      user: { select: { email: true, companyName: true, name: true } },
    },
  });
  if (!invoice) return null;

  if (!isEmailConfigured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const sellerName = invoice.user.companyName || invoice.user.name || "Freelancer";

  const emailJob = await prisma.emailJob.create({
    data: {
      userId,
      invoiceId,
      type: "REMINDER",
      status: "PENDING",
      toEmail: invoice.client.email,
      subject,
      body,
    },
  });

  try {
    const result = await sendEmail({
      to: invoice.client.email,
      subject,
      html: body,
      from: buildResendFrom(sellerName),
      replyTo: invoice.user.email ?? undefined,
    });

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { status: "SENT", resendId: result?.id ?? null },
    });

    await prisma.reminder.update({
      where: { id: reminderId },
      data: { status: "SENT", sentAt: new Date(), subject, body },
    });

    await prisma.invoiceActivity.create({
      data: {
        userId,
        invoiceId,
        type: "REMINDER_SENT",
        message: `Reminder sent to ${invoice.client.email}`,
      },
    });

    return true;
  } catch (error) {
    await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Failed",
      },
    });
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Failed",
      },
    });
    throw error;
  }
}
