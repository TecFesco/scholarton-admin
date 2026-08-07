/**
 * Difficulty badge styling, shared by the project card and the project list so
 * the three-tier vocabulary reads identically in both. Same tiers as the main
 * app's ChooseProjectCard, restated with our tokens so it tracks dark mode.
 */
export const difficultyStyles: Record<string, string> = {
  Beginner: "bg-success/10 text-success border-success/20 dark:bg-success/15",
  Intermediate:
    "bg-warning/10 text-warning border-warning/20 dark:bg-warning/15",
  Advanced:
    "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15",
};
