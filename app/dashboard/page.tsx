import { currentIsoWeek } from "@/lib/dates";
import { getAvailableWeeks, getBhagTrend, getCompletionsTrend, getSiloHealth, getTimeSection } from "@/lib/dashboardQueries";
import RankingBar from "@/components/charts/RankingBar";
import HealthTable from "@/components/charts/HealthTable";
import CompositionChart, { CompositionSlice } from "@/components/charts/CompositionChart";
import BhagLineChart from "@/components/charts/BhagLineChart";
import CompletionsStackedBar from "@/components/charts/CompletionsStackedBar";
import VarianceBar from "@/components/charts/VarianceBar";
import PlanVsActualGroupedBar from "@/components/charts/PlanVsActualGroupedBar";
import WeekSelector from "@/components/charts/WeekSelector";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { week?: string } }) {
  const week = searchParams.week && /^\d{4}-W\d{2}$/.test(searchParams.week) ? searchParams.week : currentIsoWeek();

  const [health, bhagTrend, completions, timeSection] = await Promise.all([
    getSiloHealth(),
    getBhagTrend(),
    getCompletionsTrend(),
    getTimeSection(week),
    getAvailableWeeks(),
  ]);

  const areaNames = Object.fromEntries(health.map((h) => [h.areaId, h.areaName]));

  const rankingItems = health
    .filter((h) => h.oldestUntouchedAgeDays !== null)
    .map((h) => ({ areaId: h.areaId, areaName: h.areaName, days: h.oldestUntouchedAgeDays as number }));

  const openSlices: CompositionSlice[] = health
    .filter((h) => h.openCount > 0)
    .map((h) => ({ key: h.areaId, label: h.areaName, value: h.openCount, accentId: h.areaId }));

  const timeSlices: CompositionSlice[] = timeSection.categories
    .filter((c) => c.actual !== null && c.actual > 0)
    .map((c) => ({ key: c.categoryId, label: c.label, value: c.actual as number, accentId: c.accent }));

  return (
    <div className="space-y-10 pb-8">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Dashboard</h1>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Silo health
        </h2>
        {rankingItems.length === 0 ? (
          <p className="text-sm text-neutral-500">No open follow-ups yet.</p>
        ) : (
          <RankingBar items={rankingItems} />
        )}
        <HealthTable rows={health} />
        <CompositionChart storageId="dash-open-by-silo" title="Open items by silo" slices={openSlices} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Trends</h2>
        <BhagLineChart points={bhagTrend} />
        <CompletionsStackedBar weeks={completions.weeks} seriesOrder={completions.seriesOrder} areaNames={areaNames} />
      </section>

      <section id="time" className="space-y-4 scroll-mt-16">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Time</h2>
          <span className="viz-tabular text-xs text-neutral-500 dark:text-neutral-400">
            Days uploaded this week: {timeSection.daysUploaded}/7
          </span>
        </div>
        <WeekSelector week={week} />
        <VarianceBar categories={timeSection.categories} />
        <PlanVsActualGroupedBar categories={timeSection.categories} />
        <CompositionChart storageId="dash-time-by-category" title="This week by category" slices={timeSlices} unit="hours" />
      </section>
    </div>
  );
}
