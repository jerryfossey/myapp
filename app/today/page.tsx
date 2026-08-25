import { prisma } from "@/lib/prisma";
import { getAllFollowUps, getAllReports, sortFollowUps } from "@/lib/queries";
import { getReferenceToday } from "@/lib/meta";
import { dateOnlyISO } from "@/lib/dates";
import TodayView from "@/components/TodayView";
import AddFollowUpForm from "@/components/AddFollowUpForm";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [{ followUps }, { reports }, areas, today] = await Promise.all([
    getAllFollowUps(),
    getAllReports(),
    prisma.area.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getReferenceToday(),
  ]);

  const todayISO = dateOnlyISO(today);

  // Today = due now: unscheduled backlog, anything scheduled for today, and
  // anything scheduled for a day that's already passed. A follow-up
  // scheduled for a future day belongs on the Week view instead.
  const open = sortFollowUps(
    followUps.filter((f) => f.status !== "done" && (!f.scheduledFor || f.scheduledFor <= todayISO))
  );
  const overdueReports = reports.filter((r) => r.displayStatus === "overdue");

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Today</h1>
      <div className="mb-4">
        <AddFollowUpForm areas={areas} defaultDate={todayISO} />
      </div>
      <TodayView followUps={open} overdueReports={overdueReports} />
    </div>
  );
}
