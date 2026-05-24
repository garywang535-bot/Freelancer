import { Resend } from "resend";
import type { SendEmailParams } from "./types";

let resend: Resend | null = null;

/** Resend 平台发信是否已配置 */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/** 构建平台发件人（显示名 + 平台邮箱） */
export function buildResendFrom(sellerName?: string): string {
  const address = process.env.RESEND_FROM_EMAIL!;
  const platformName = process.env.RESEND_FROM_NAME || "Freelancer Billing";
  const displayName = sellerName?.trim() || platformName;
  return `${displayName} <${address}>`;
}

/** 通过 Resend 平台统一发信 */
export async function sendViaResend(params: SendEmailParams) {
  const client = getResend();

  if (!client || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const { data, error } = await client.emails.send({
    from: params.from ?? buildResendFrom(),
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) throw new Error(error.message);
  return { id: data?.id ?? null, provider: "resend" as const };
}
