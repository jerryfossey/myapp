"use client";

import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "./clientStorage";
import type { ListMode } from "@/components/SiloGroupedList";

// Shared Flat/By-silo view-mode + collapsed-sections state, persisted per
// view (Today vs Week) so the choice sticks across visits. Defaults match
// what a fresh server render produces (flat, nothing collapsed) so there's
// no hydration mismatch; localStorage is only consulted after mount.
export function useSiloViewState(viewKey: string) {
  const modeStorageKey = `silos:${viewKey}:mode`;
  const collapsedStorageKey = `silos:${viewKey}:collapsed`;

  const [mode, setModeState] = useState<ListMode>("flat");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setModeState(readJSON<ListMode>(modeStorageKey, "flat"));
    setCollapsed(new Set(readJSON<string[]>(collapsedStorageKey, [])));
    // Only re-read on a genuine view change, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey]);

  function setMode(next: ListMode) {
    setModeState(next);
    writeJSON(modeStorageKey, next);
  }

  function toggleSection(areaId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      writeJSON(collapsedStorageKey, Array.from(next));
      return next;
    });
  }

  function expandAll() {
    setCollapsed(new Set());
    writeJSON(collapsedStorageKey, []);
  }

  function collapseAll(areaIds: string[]) {
    const next = new Set(areaIds);
    setCollapsed(next);
    writeJSON(collapsedStorageKey, Array.from(next));
  }

  return { mode, setMode, collapsed, toggleSection, expandAll, collapseAll };
}
