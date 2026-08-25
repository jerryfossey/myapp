import { ListMode } from "./SiloGroupedList";

export default function ViewModeToggle({
  mode,
  onModeChange,
  onExpandAll,
  onCollapseAll,
}: {
  mode: ListMode;
  onModeChange: (mode: ListMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
        {(
          [
            ["flat", "Flat"],
            ["silo", "By silo"],
          ] as [ListMode, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === key
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                : "text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "silo" && (
        <div className="flex gap-1 text-xs">
          <button onClick={onExpandAll} className="px-2 py-1 font-medium text-neutral-500 underline underline-offset-2">
            Expand all
          </button>
          <button onClick={onCollapseAll} className="px-2 py-1 font-medium text-neutral-500 underline underline-offset-2">
            Collapse all
          </button>
        </div>
      )}
    </div>
  );
}
