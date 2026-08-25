export function fmtSigned(n: number, unit = ""): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(1)}${unit}`;
}

export function fmtHours(n: number): string {
  return `${n.toFixed(1)}h`;
}

export function fmtDollars(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function fmtPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}
