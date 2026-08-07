import { useEffect, useMemo, useState } from "react";

export interface Pagination<T> {
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  pageItems: T[];
  total: number;
  /** 1-based index of the first item on the page (0 when the list is empty). */
  from: number;
  /** 1-based index of the last item on the page. */
  to: number;
}

/**
 * Client-side pagination over an already-filtered array. All three list pages
 * load their full dataset in one query, so paging is a pure slice — no extra
 * requests.
 *
 * Clamps the current page when the list shrinks (e.g. after a search narrows
 * results) so the user is never stranded on an empty page past the end.
 */
export function usePagination<T>(items: T[], pageSize: number): Pagination<T> {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const from = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, items.length);

  return {
    page: safePage,
    setPage,
    pageCount,
    pageItems,
    total: items.length,
    from,
    to,
  };
}
