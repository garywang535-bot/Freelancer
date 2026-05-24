export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  /** 平台发信地址，可带显示名：`Name <email@domain.com>` */
  from?: string;
  /** 客户回复时转到登录用户邮箱 */
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
};

export type EmailProvider = "resend" | "none";
