"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { DjonSelect } from "@/components/djon-select";

const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [15, 30, 60];

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function visiblePages(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  if (page >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "ellipsis-start",
    page - 1,
    page,
    page + 1,
    "ellipsis-end",
    totalPages,
  ];
}

export function useListPagination<T>(items: readonly T[], resetKey = "") {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    page: safePage,
    pageSize,
    totalPages,
    paginatedItems,
    setPage,
    setPageSize,
  };
}

type ListPaginationProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function ListPagination({
  totalItems,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  if (totalItems === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const buttonClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-xl border text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-25";

  return (
    <nav
      aria-label="Paginação da lista"
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-4 sm:justify-start">
        <span className="whitespace-nowrap text-djon-micro font-black uppercase tracking-wider text-djon-text/30">
          Por página
        </span>
        <DjonSelect
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          options={PAGE_SIZE_OPTIONS.map((size) => ({
            value: String(size),
            label: String(size),
          }))}
          ariaLabel="Itens por página"
          className="h-9 w-20 px-3"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-djon-text/40">
          Mostrando{" "}
          <span className="text-djon-text/70">
            {firstItem}–{lastItem}
          </span>{" "}
          de {totalItems}
        </p>

        <div className="flex items-center justify-center gap-1 sm:justify-end">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className={`${buttonClass} border-djon-text/10 text-djon-text/50 hover:border-djon-accent/40 hover:text-djon-accent`}
          >
            <ChevronLeft size={15} />
          </button>

          <span className="min-w-24 px-2 text-center text-xs font-black text-djon-text/50 sm:hidden">
            Página {page} de {totalPages}
          </span>

          <div className="hidden items-center gap-1 sm:flex">
            {visiblePages(page, totalPages).map((item) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  type="button"
                  aria-label={`Ir para a página ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                  className={`${buttonClass} ${
                    item === page
                      ? "border-djon-accent bg-djon-accent text-djon-ink"
                      : "border-djon-text/10 text-djon-text/50 hover:border-djon-accent/40 hover:text-djon-accent"
                  }`}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={item}
                  className="flex size-8 items-center justify-center text-djon-text/25"
                  aria-hidden="true"
                >
                  <MoreHorizontal size={15} />
                </span>
              ),
            )}
          </div>

          <button
            type="button"
            aria-label="Próxima página"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className={`${buttonClass} border-djon-text/10 text-djon-text/50 hover:border-djon-accent/40 hover:text-djon-accent`}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
