import { prisma } from "@/lib/prisma";
import { getAllFollowUps, getAllReports, sortFollowUps } from "@/lib/queries";
import TodayView from "@/components/TodayView";
import AddFollowUpForm from "@/components/AddFollowUpForm";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [{ followUps }, { reports }, areas] = await Promise.all([
    getAllFollowUps(),
    getAllReports(),
    prisma.area.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const open = sortFollowUps(followUps.filter((f) => f.status !== "done"));
  const overdueReports = reports.filter((r) => r.displayStatus === "overdue");

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Today</h1>
      <div className="mb-4">
        <AddFollowUpForm areas={areas} />
      </div>
      <TodayView followUps={open} overdueReports={overdueReports} />
    </div>
  );
}
