import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { listClients } from "@/lib/services/client.service";
import { ClientsPageClient } from "@/components/clients/clients-page-client";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await listClients(session.user.id);

  return (
    <ClientsPageClient
      initialItems={result.items}
      initialMeta={result.meta}
    />
  );
}
