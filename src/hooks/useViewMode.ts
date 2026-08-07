import { useEffect, useState } from "react";

export type ViewMode = "card" | "list";

/**
 * Remembers a card/list choice across visits, per storage key. Kept out of the
 * ViewToggle component file so that file only exports a component (Fast Refresh).
 */
export function useViewMode(
  storageKey: string,
  fallback: ViewMode = "card"
): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(storageKey);
    return saved === "card" || saved === "list" ? saved : fallback;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, mode);
  }, [storageKey, mode]);

  return [mode, setMode];
}
