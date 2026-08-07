import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/hooks/useViewMode";

/**
 * A small purpose-built segmented control for the card/list switch — there's no
 * tabs/toggle-group primitive in the app. Pair it with useViewMode to persist
 * the choice.
 */
export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-border p-0.5"
      role="group"
      aria-label="View mode"
    >
      {(
        [
          { mode: "card", icon: LayoutGrid, label: "Card view" },
          { mode: "list", icon: List, label: "List view" },
        ] as const
      ).map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-label={label}
          aria-pressed={value === mode}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
