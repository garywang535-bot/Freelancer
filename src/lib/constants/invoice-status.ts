import type { InvoiceStatus } from "@prisma/client";

/** Invoice 状态展示配置（设计文档 4.4） */
export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  SENT: { label: "Sent", className: "bg-blue-50 text-blue-700" },
  VIEWED: { label: "Viewed", className: "bg-purple-50 text-purple-700" },
  PAID: { label: "Paid", className: "bg-green-50 text-green-700" },
  OVERDUE: { label: "Overdue", className: "bg-red-50 text-red-700" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-800 text-white" },
};

/** 可编辑的状态 */
export const EDITABLE_STATUSES: InvoiceStatus[] = ["DRAFT"];

/** 可发送的状态 */
export const SENDABLE_STATUSES: InvoiceStatus[] = ["DRAFT"];

/** 可取消的状态 */
export const CANCELLABLE_STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "OVERDUE",
];
