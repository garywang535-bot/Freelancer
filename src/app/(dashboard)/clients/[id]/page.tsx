import { auth } from "../../../../../auth";
import { redirect, notFound } from "next/navigation";
import { getClientDetail } from "@/lib/services/client.service";
import { ClientDetailClient } from "@/components/clients/client-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const detail = await getClientDetail(session.user.id, id);

  if (!detail) notFound();

  return (
    <ClientDetailClient
      client={detail.client}
      invoices={detail.invoices}
      payments={detail.payments}
    />
  );
}
