'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
  disabled?: boolean;
  align?: 'between' | 'center';
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'records',
  className = '',
  disabled = false,
  align = 'between',
}) => {
  if (totalCount === 0 || (totalPages <= 1 && !onPageSizeChange)) {
    if (totalCount === 0) return null;
  }

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  };

  const pages = getPageNumbers();

  const renderControls = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
      {/* First Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1 || disabled}
        aria-label="Go to first page"
        title="First page"
        className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Previous Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || disabled}
        aria-label="Go to previous page"
        title="Previous page"
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Numbered Page Buttons */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                aria-hidden="true"
                className="px-2 py-1 text-xs text-slate-400 select-none"
              >
                •••
              </span>
            );
          }

          const pageNum = Number(p);
          const isCurrent = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              disabled={disabled}
              aria-label={`Page ${pageNum}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                isCurrent
                  ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-500'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || disabled}
        aria-label="Go to next page"
        title="Next page"
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages || disabled}
        aria-label="Go to last page"
        title="Last page"
        className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderInfo = () => (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
      <span>
        Showing{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {startRecord.toLocaleString()}
        </span>{' '}
        to{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {endRecord.toLocaleString()}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {totalCount.toLocaleString()}
        </span>{' '}
        {itemName}
      </span>
    </div>
  );

  const renderPageSize = () => {
    if (!onPageSizeChange) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
        <label htmlFor="pagination-page-size" className="text-slate-500 text-xs">
          Per page:
        </label>
        <select
          id="pagination-page-size"
          aria-label="Records per page"
          disabled={disabled}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer disabled:opacity-50"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (align === 'center') {
    return (
      <nav
        role="navigation"
        aria-label="Pagination Navigation"
        className={`w-full py-4 px-1 ${className}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Col 1: Record info (left aligned on desktop) */}
          <div className="order-2 lg:order-1 flex items-center justify-center lg:justify-start">
            {renderInfo()}
          </div>

          {/* Col 2: Numbers in the exact center */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            {renderControls()}
          </div>

          {/* Col 3: Page size selector (right aligned on desktop) */}
          <div className="order-3 flex items-center justify-center lg:justify-end">
            {renderPageSize()}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 ${className}`}
    >
      {/* Record info & optional Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        {renderInfo()}
        {onPageSizeChange && (
          <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
            {renderPageSize()}
          </div>
        )}
      </div>

      {/* Navigation Buttons on the right */}
      {renderControls()}
    </nav>
  );
};
