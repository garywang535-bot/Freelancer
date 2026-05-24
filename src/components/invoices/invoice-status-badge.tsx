import type { InvoiceStatus } from "@prisma/client";
import { INVOICE_STATUS_CONFIG } from "@/lib/constants/invoice-status";
import { cn } from "@/lib/utils/cn";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = INVOICE_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
