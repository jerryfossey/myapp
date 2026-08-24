import { formatMoney, formatDate } from "@/lib/format";

export default function BhagStrip({
  bhag,
}: {
  bhag: {
    label: string;
    cashOnHand: number;
    cashTarget: number;
    helocBalance: number;
    asOf: Date;
    note: string | null;
  } | null;
}) {
  if (!bhag) return null;

  const pct = bhag.cashTarget > 0 ? Math.min(100, (bhag.cashOnHand / bhag.cashTarget) * 100) : 0;
  const gap = Math.max(0, bhag.cashTarget - bhag.cashOnHand);

  return (
    <div className="card mb-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-500">{bhag.label}</h2>
        <span className="text-xs text-neutral-400">as of {formatDate(bhag.asOf)}</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold tabular-nums">{formatMoney(bhag.cashOnHand)}</div>
          <div className="text-xs text-neutral-500">cash on hand of {formatMoney(bhag.cashTarget)} target</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums text-neutral-600 dark:text-neutral-300">
            {formatMoney(gap)}
          </div>
          <div className="text-xs text-neutral-500">gap to goal</div>
        </div>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="h-full rounded-full bg-neutral-900 dark:bg-white" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-neutral-500">HELOC balance</span>
        <span className="font-medium tabular-nums">{formatMoney(bhag.helocBalance)}</span>
      </div>

      {bhag.note && (
        <p className="mt-2 text-xs italic text-amber-700 dark:text-amber-400">{bhag.note}</p>
      )}
    </div>
  );
}
