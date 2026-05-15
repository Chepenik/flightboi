"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/flight/store";

const unlockCode = "tron";

export function useEasterEggActivation(enabled = true) {
  const easterEggMode = useGameStore((state) => state.easterEggMode);
  const enterGridRun = useGameStore((state) => state.enterGridRun);
  const exitEasterEgg = useGameStore((state) => state.exitEasterEgg);
  const bufferRef = useRef("");

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "escape" && easterEggMode !== "none") {
        event.preventDefault();
        exitEasterEgg();
        bufferRef.current = "";
        return;
      }

      if (easterEggMode !== "none" || shouldIgnoreEasterEggTarget(event.target)) return;
      if (key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;

      bufferRef.current = `${bufferRef.current}${key}`.slice(-unlockCode.length);
      if (bufferRef.current === unlockCode) {
        event.preventDefault();
        enterGridRun();
        bufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [easterEggMode, enabled, enterGridRun, exitEasterEgg]);
}

function shouldIgnoreEasterEggTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button, input, select, textarea, [contenteditable='true'], [data-flight-ui='true']",
    ),
  );
}
