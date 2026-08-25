// Seed table for the Dashboard's Time section: the owner's weekly time
// allocation. Doesn't map 1:1 to the 11 silo areas (Fairview splits into
// two categories; ministry/planning/surge are non-silo). `planned` here is
// the create-time default for a new (week, categoryId) TimeWeek row — the
// allocation is provisional and editable in-app afterward, never
// overwritten by the import.
export type TimeCategory = {
  id: string;
  label: string;
  planned: number;
  accent: string; // areaId to reuse for accent color, or "neutral"
};

export const TIME_CATEGORIES: TimeCategory[] = [
  { id: "fairview-ops", label: "Fairview — GM operational", planned: 14, accent: "fairview" },
  { id: "fairview-sales", label: "Fairview — Sales & demand", planned: 14, accent: "fairview" },
  { id: "mbe", label: "MBE", planned: 6, accent: "mbe" },
  { id: "4ever", label: "4ever", planned: 4, accent: "4ever" },
  { id: "properties", label: "Properties", planned: 4, accent: "properties" },
  { id: "personal-fin", label: "Personal finance & BHAG", planned: 3, accent: "personal" },
  { id: "planning", label: "Planning & review", planned: 3, accent: "neutral" },
  { id: "jcb", label: "JCB & BDaaS", planned: 3, accent: "jcb" },
  { id: "pembroke", label: "Pembroke", planned: 2, accent: "pembroke" },
  { id: "surge", label: "Unallocated surge", planned: 2, accent: "neutral" },
  { id: "pbcc", label: "PBCC (outside hours)", planned: 4, accent: "pbcc-properties" },
  { id: "ministry", label: "Scripture & ministry", planned: 14, accent: "neutral" },
];

export const TIME_CATEGORY_IDS = TIME_CATEGORIES.map((c) => c.id);

export const TOTAL_PLANNED_HOURS = TIME_CATEGORIES.reduce((sum, c) => sum + c.planned, 0);

export function getTimeCategory(categoryId: string): TimeCategory | undefined {
  return TIME_CATEGORIES.find((c) => c.id === categoryId);
}
