import { FollowUpVM } from "@/lib/types";
import { sortFollowUps } from "@/lib/queries";
import FollowUpRow from "./FollowUpRow";
import SiloDot from "./SiloDot";
import { accentCssVars } from "@/lib/areaColors";

export type ListMode = "flat" | "silo";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Pure/controlled: no internal state. mode + collapsed live in the parent
// view (Today/Week) so a single toggle governs every section on the page,
// including across the multiple day-buckets on Week.
export default function SiloGroupedList({
  followUps,
  mode,
  collapsed,
  onToggleSection,
  emptyMessage,
}: {
  followUps: FollowUpVM[];
  mode: ListMode;
  collapsed: Set<string>;
  onToggleSection: (areaId: string) => void;
  emptyMessage?: string;
}) {
  if (followUps.length === 0) {
    return emptyMessage ? <p className="text-sm text-neutral-500">{emptyMessage}</p> : null;
  }

  if (mode === "flat") {
    return (
      <div className="space-y-3">
        {sortFollowUps(followUps).map((f) => (
          <FollowUpRow key={f.id} followUp={f} showArea />
        ))}
      </div>
    );
  }

  const groups = new Map<string, { areaId: string; areaName: string; items: FollowUpVM[] }>();
  for (const f of followUps) {
    const g = groups.get(f.areaId);
    if (g) g.items.push(f);
    else groups.set(f.areaId, { areaId: f.areaId, areaName: f.areaName, items: [f] });
  }

  const sections = Array.from(groups.values()).sort((a, b) => {
    const oldestA = Math.max(...a.items.map((i) => i.ageDays));
    const oldestB = Math.max(...b.items.map((i) => i.ageDays));
    return oldestB - oldestA; // longest-untouched silo first
  });

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const isOpen = !collapsed.has(section.areaId);
        return (
          <div key={section.areaId}>
            <button
              onClick={() => onToggleSection(section.areaId)}
              aria-expanded={isOpen}
              className="silo-accent silo-border flex w-full items-center gap-2 rounded-lg bg-neutral-100 py-2 pl-2.5 pr-3 text-left dark:bg-neutral-900"
              style={accentCssVars(section.areaId) as React.CSSProperties}
            >
              <SiloDot areaId={section.areaId} />
              <span className="flex-1 font-medium">{section.areaName}</span>
              <span className="badge bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {section.items.length}
              </span>
              <ChevronIcon open={isOpen} />
            </button>
            {isOpen && (
              <div className="mt-3 space-y-3">
                {sortFollowUps(section.items).map((f) => (
                  <FollowUpRow key={f.id} followUp={f} showArea={false} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
