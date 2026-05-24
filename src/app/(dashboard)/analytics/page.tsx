import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import {
  getAnalyticsOverview,
  getRevenueTrend,
  getClientsRanking,
  getCountryDistribution,
} from "@/lib/services/analytics.service";
import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const [overview, revenueTrend, clientsRanking, countryDistribution] =
    await Promise.all([
      getAnalyticsOverview(userId),
      getRevenueTrend(userId, 6),
      getClientsRanking(userId, 10),
      getCountryDistribution(userId),
    ]);

  return (
    <AnalyticsPageClient
      overview={overview}
      revenueTrend={revenueTrend}
      clientsRanking={clientsRanking}
      countryDistribution={countryDistribution}
    />
  );
}
