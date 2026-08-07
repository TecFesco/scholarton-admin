import logoLight from "@/assets/Logo.png";
import logoDark from "@/assets/LogoDark.png";
import { cn } from "@/lib/utils";

/**
 * The Scholarton wordmark, theme-aware. The blue logo reads on light surfaces
 * but disappears on dark ones, so we swap to the white variant under `.dark`.
 * Both are rendered and CSS-toggled (rather than reading the theme store) so
 * there's no flash on first paint or during hydration.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      <img
        src={logoLight}
        alt="Scholarton"
        className={cn("w-auto object-contain dark:hidden", className)}
      />
      <img
        src={logoDark}
        alt="Scholarton"
        className={cn("hidden w-auto object-contain dark:block", className)}
      />
    </>
  );
}
