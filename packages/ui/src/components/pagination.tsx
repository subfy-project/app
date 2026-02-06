"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────── */

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when user clicks a page number or nav arrow */
  onPageChange?: (page: number) => void;
  className?: string;
}

/* ──────────────────────────────────────────────────────────
 * Pagination
 *
 * Figma: Dashboard/Pagination
 *
 * Active page: bg-main-500, rounded-lg, text-text-primary
 * Inactive:    bg-transparent, text-text-primary
 * Arrows:      chevron-left / chevron-right, size-4
 * Font:        Outfit Regular 12px
 * Each item:   w-[44px], px-4 py-3
 * ──────────────────────────────────────────────────────── */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="inline-flex items-start rounded-lg">
        {/* Previous */}
        <button
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="flex h-[39px] w-[44px] items-center justify-center rounded-l px-4 py-3 text-text-primary transition-colors duration-150 hover:bg-dark-500/50 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Page numbers */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={cn(
              "flex w-[44px] items-center justify-center px-4 py-3 font-outfit text-[12px] text-text-primary transition-all duration-150",
              page === currentPage
                ? "rounded-lg bg-main-500"
                : "hover:bg-dark-500/50"
            )}
          >
            {page}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() =>
            onPageChange?.(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage >= totalPages}
          className="flex h-[39px] w-[44px] items-center justify-center rounded-r px-4 py-3 text-text-primary transition-colors duration-150 hover:bg-dark-500/50 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export { Pagination };
