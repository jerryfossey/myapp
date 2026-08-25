// Presentation-only per-silo accent. Keyed by area id, NOT part of the
// import payload or the database — this is app-side styling, so an area
// added via import with an id not listed here just gets the neutral
// fallback until this map is updated.
export type AreaAccent = { light: string; dark: string };

export const AREA_ACCENTS: Record<string, AreaAccent> = {
  fairview: { light: "#2a78d6", dark: "#3987e5" }, // blue
  properties: { light: "#eb6834", dark: "#d95926" }, // orange
  mbe: { light: "#1baf7a", dark: "#199e70" }, // aqua
  pembroke: { light: "#e87ba4", dark: "#d55181" }, // magenta
  jcb: { light: "#eda100", dark: "#c98500" }, // yellow
  "4ever": { light: "#008300", dark: "#008300" }, // green
  personal: { light: "#4a3aa7", dark: "#9085e9" }, // violet
  rrt: { light: "#2a8f9c", dark: "#3aa7b5" }, // teal
  "ubt-coaching": { light: "#6470a0", dark: "#8b96c4" }, // slate blue
  "pbcc-properties": { light: "#9c6b3f", dark: "#b5824f" }, // clay
  family: { light: "#8a7f6d", dark: "#a89c86" }, // taupe
};

const FALLBACK_ACCENT: AreaAccent = { light: "#737373", dark: "#a3a3a3" }; // neutral

export function getAreaAccent(areaId: string): AreaAccent {
  return AREA_ACCENTS[areaId] ?? FALLBACK_ACCENT;
}

// CSS custom properties consumed by the .silo-accent / .silo-dot /
// .silo-border rules in globals.css.
export function accentCssVars(areaId: string): Record<string, string> {
  const { light, dark } = getAreaAccent(areaId);
  return { "--accent-light": light, "--accent-dark": dark };
}
