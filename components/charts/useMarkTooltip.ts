"use client";

import { useRef, useState } from "react";

// Shared hover/focus tooltip positioning for mark-based charts (bars, dots,
// segments). Position is computed relative to a `position: relative`
// container so the tooltip can be placed with a plain absolute div.
export function useMarkTooltip<T>() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ key: string; x: number; y: number; data: T } | null>(null);

  function showAt(e: React.SyntheticEvent, key: string, data: T) {
    const target = e.currentTarget as Element;
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!containerRect) return;
    setHover({
      key,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
      data,
    });
  }

  function hide() {
    setHover(null);
  }

  return { containerRef, hover, showAt, hide };
}
