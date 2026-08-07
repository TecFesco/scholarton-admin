import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Range summary inputs — from usePagination. */
  from: number;
  to: number;
  total: number;
  /** Singular/plural noun for the range summary, e.g. "project". */
  noun?: string;
  className?: string;
}

/**
 * A windowed page window centred on the current page: at most WINDOW numbers,
 * always including first and last with a gap marker when they fall outside.
 */
const WINDOW = 5;

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= WINDOW + 2) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const half = Math.floor(WINDOW / 2);
  let start = Math.max(2, page - half);
  const end = Math.min(pageCount - 1, start + WINDOW - 1);
  start = Math.max(2, end - WINDOW + 1);

  const out: (number | "gap")[] = [1];
  if (start > 2) out.push("gap");
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < pageCount - 1) out.push("gap");
  out.push(pageCount);
  return out;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  from,
  to,
  total,
  noun = "item",
  className,
}: PaginationProps) {
  // Nothing to page through — a single page of results needs no controls.
  if (pageCount <= 1) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {total} {total === 1 ? noun : `${noun}s`}
      </div>
    );
  }

  const windowed = pageWindow(page, pageCount);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of {total}{" "}
        {total === 1 ? noun : `${noun}s`}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {windowed.map((entry, index) =>
          entry === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={entry}
              variant={entry === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 tabular-nums"
              onClick={() => onPageChange(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? "page" : undefined}
            >
              {entry}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
