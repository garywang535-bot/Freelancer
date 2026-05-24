import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { listPayments } from "@/lib/services/payment.service";
import { PaymentsPageClient } from "@/components/payments/payments-page-client";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await listPayments(session.user.id);

  return (
    <PaymentsPageClient
      initialItems={result.items.map((p) => ({
        ...p,
        paidAt: p.paidAt.toISOString(),
      }))}
    />
  );
}
