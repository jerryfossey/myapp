import { getAllFollowUps, getAllReports, sortFollowUps } from "@/lib/queries";
import TodayView from "@/components/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [{ followUps }, { reports }] = await Promise.all([getAllFollowUps(), getAllReports()]);

  const open = sortFollowUps(followUps.filter((f) => f.status !== "done"));
  const overdueReports = reports.filter((r) => r.displayStatus === "overdue");

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Today</h1>
      <TodayView followUps={open} overdueReports={overdueReports} />
    </div>
  );
}
