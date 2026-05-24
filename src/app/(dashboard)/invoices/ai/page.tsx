import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AiInvoiceClient } from "@/components/ai/ai-invoice-client";

export default async function AiInvoicePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id, deletedAt: null },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });

  return <AiInvoiceClient clients={clients} />;
}
