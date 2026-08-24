import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { derivedReportStatus } from "@/lib/derived";
import BhagStrip from "@/components/BhagStrip";
import AreaCard from "@/components/AreaCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bhag, areas, today] = await Promise.all([
    prisma.bhag.findUnique({ where: { id: 1 } }),
    prisma.area.findMany({
      where: { archived: false },
      orderBy: { createdAt: "asc" },
      include: { reports: true, followUps: true },
    }),
    getReferenceToday(),
  ]);

  const cards = areas.map((area) => ({
    id: area.id,
    name: area.name,
    state: area.state,
    metricLabel: area.metricLabel,
    metricValue: area.metricValue,
    constraint: area.constraint,
    openFollowUps: area.followUps.filter((f) => f.status !== "done").length,
    overdueReports: area.reports.filter((r) => derivedReportStatus(r, today) === "overdue").length,
  }));

  return (
    <div>
      <BhagStrip bhag={bhag} />
      <div className="space-y-3">
        {cards.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
