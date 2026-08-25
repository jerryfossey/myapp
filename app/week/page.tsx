import { prisma } from "@/lib/prisma";
import { getAllFollowUps } from "@/lib/queries";
import { getReferenceToday } from "@/lib/meta";
import { addDays, dateOnlyISO } from "@/lib/dates";
import WeekView from "@/components/WeekView";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 7;

export default async function WeekPage() {
  const [{ followUps }, today, areas] = await Promise.all([
    getAllFollowUps(),
    getReferenceToday(),
    prisma.area.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const open = followUps.filter((f) => f.status !== "done");
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => dateOnlyISO(addDays(today, i)));

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Week</h1>
      <WeekView followUps={open} days={days} areas={areas} />
    </div>
  );
}
