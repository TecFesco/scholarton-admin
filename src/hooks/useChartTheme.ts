import { useThemeStore } from "@/Store/useThemeStore";

/**
 * Recharts writes these onto SVG presentation attributes, where `var()`
 * substitution is unreliable across browsers — so resolve the tokens to
 * literal colors here instead of passing `hsl(var(--primary))` through.
 *
 * The dark values are *chosen* steps, not an automatic inversion: #0179C8 is
 * the main app's dark-mode blue, and both steps were validated against their
 * own surface (lightness band, chroma floor, 3:1 contrast).
 */
export function useChartTheme() {
  const theme = useThemeStore((s) => s.theme);
  const dark = theme === "dark";

  return {
    /** Series hue — brand blue, one step per surface. */
    series: dark ? "#0179C8" : "#3b82f6",
    /** Hairline grid, one step off the surface. Solid, never dashed. */
    grid: dark ? "#334155" : "#e2e8f0",
    /** Axis tick text — a text token, never the series color. */
    axis: dark ? "#94A3B8" : "#64748b",
    surface: dark ? "#1E293B" : "#ffffff",
    border: dark ? "#334155" : "#e2e8f0",
    foreground: dark ? "#F1F5F9" : "#0f172a",
  };
}
