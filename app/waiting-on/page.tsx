import { getAllFollowUps } from "@/lib/queries";
import { needsDelegationNudge, DELEGATED_NUDGE_DAYS } from "@/lib/derived";
import FollowUpRow from "@/components/FollowUpRow";

export const dynamic = "force-dynamic";

export default async function WaitingOnPage() {
  const { followUps } = await getAllFollowUps();
  const delegated = followUps.filter((f) => f.status === "delegated");

  const groups = new Map<string, typeof delegated>();
  for (const f of delegated) {
    const key = f.waitingOn || "someone";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const sortedGroups = [...groups.entries()]
    .map(([person, items]) => ({
      person,
      items: [...items].sort((a, b) => b.ageDays - a.ageDays),
      oldestAge: Math.max(...items.map((i) => i.ageDays)),
      nudge: items.some((i) => needsDelegationNudge(i.ageDays)),
    }))
    .sort((a, b) => b.oldestAge - a.oldestAge);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Waiting on someone</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Everything you've delegated, grouped by who has it. Flagged once it's been {DELEGATED_NUDGE_DAYS}+ days
        since you last touched it.
      </p>

      {sortedGroups.length === 0 && (
        <p className="text-sm text-neutral-500">Nothing delegated right now.</p>
      )}

      <div className="space-y-4">
        {sortedGroups.map((group) => (
          <section key={group.person}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              {group.person}
              <span className="viz-tabular rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-500 dark:bg-neutral-800">
                {group.items.length}
              </span>
              {group.nudge && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                  chase them — {group.oldestAge}d
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {group.items.map((f) => (
                <FollowUpRow key={f.id} followUp={f} showArea />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
