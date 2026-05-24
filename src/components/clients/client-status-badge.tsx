import type { ClientStatus } from "@/lib/services/client.service";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; className: string }
> = {
  NEW: { label: "New", className: "bg-slate-100 text-slate-700" },
  ACTIVE: { label: "Active", className: "bg-green-50 text-green-700" },
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  OVERDUE: { label: "Overdue", className: "bg-red-50 text-red-700" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = STATUS_CONFIG[status];
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
