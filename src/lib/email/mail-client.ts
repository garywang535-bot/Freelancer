import { isResendConfigured, sendViaResend, buildResendFrom } from "./resend-client";
import type { EmailProvider, SendEmailParams } from "./types";

export type { SendEmailParams, EmailProvider };
export { buildResendFrom };

/** 平台邮件服务（Resend）是否可用 */
export function getEmailProvider(): EmailProvider {
  return isResendConfigured() ? "resend" : "none";
}

/** 平台 Resend 是否已配置 */
export function isEmailConfigured(): boolean {
  return isResendConfigured();
}

/** 统一发信入口：平台 Resend */
export async function sendEmail(params: SendEmailParams) {
  if (!isResendConfigured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  return sendViaResend(params);
}
