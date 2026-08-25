"use client";

import { useEffect, useState } from "react";

// The app currently drives theme purely off prefers-color-scheme (no
// in-app toggle yet), but the CSS already supports a future data-theme
// override — mirror both here so chart colors stay in sync with whichever
// mechanism is actually driving the page's theme.
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function compute() {
      const stamp = document.documentElement.getAttribute("data-theme");
      if (stamp === "light") return setDark(false);
      if (stamp === "dark") return setDark(true);
      setDark(mq.matches);
    }

    compute();
    mq.addEventListener("change", compute);
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", compute);
      observer.disconnect();
    };
  }, []);

  return dark;
}
