export type DonutArc = { path: string; midAngle: number };

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(cx: number, cy: number, r: number, ir: number, start: number, end: number, largeArc: number): string {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const [x3, y3] = polar(cx, cy, ir, end);
  const [x4, y4] = polar(cx, cy, ir, start);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

// Donut slice geometry, starting at 12 o'clock, sweeping clockwise.
// Caller supplies values already sorted largest-first.
export function computeDonutArcs(values: number[], radius: number, innerRadius: number, cx: number, cy: number): DonutArc[] {
  const total = values.reduce((s, v) => s + v, 0) || 1;
  let angle = -Math.PI / 2;
  return values.map((v) => {
    const start = angle;
    const sweep = (v / total) * Math.PI * 2;
    const end = start + sweep;
    angle = end;
    const largeArc = sweep > Math.PI ? 1 : 0;
    return { path: arcPath(cx, cy, radius, innerRadius, start, end, largeArc), midAngle: (start + end) / 2 };
  });
}

export function labelPoint(cx: number, cy: number, r: number, angle: number): [number, number] {
  return polar(cx, cy, r, angle);
}

// Relative luminance (sRGB, WCAG formula) so an in-fill label can pick
// white or ink by the fill's own luminance rather than a fixed color.
export function textColorForFill(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return "#ffffff";
  const [r, g, b] = m.slice(1).map((c) => parseInt(c, 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.5 ? "#0b0b0b" : "#ffffff";
}
