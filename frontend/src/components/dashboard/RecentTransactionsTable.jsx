import React, { useEffect, useRef } from 'react';

/**
 * RecentTransactionsTable — paginated transactions list with skeleton,
 * empty state, method badges, INR currency, and mobile sticky column.
 *
 * Props:
 *   transactions  {Array}    array of { id, amount, method, paidAt,
 *                             patient: { name },
 *                             appointment: { doctor: { user: { name } } } }
 *   total         {number}   total row count (for pagination)
 *   page          {number}   current page (1-based)
 *   onPageChange  {Function} callback(page: number)
 *   loading       {boolean}  when true, render skeleton rows
 *
 * Requirements: 6.10, 9.10, 10.8, 10.9, 10.20
 */

const ROWS_PER_PAGE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatTime(paidAt) {
  return new Date(paidAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── MethodBadge ──────────────────────────────────────────────────────────────

function MethodBadge({ method }) {
  const isCash = method === 'CASH';
  const colorClasses = isCash
    ? 'bg-green-100 text-green-700'
    : 'bg-blue-100 text-blue-700';
  const label = isCash ? '💵 Cash' : '💳 Online';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}
    >
      {label}
    </span>
  );
}

// ── SkeletonRow ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {/* Sticky first column */}
      <td className="py-3 px-4 sticky left-0 bg-white whitespace-nowrap">
        <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-4 w-14 rounded bg-gray-200 animate-pulse" />
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RecentTransactionsTable({
  transactions = [],
  total = 0,
  page = 1,
  onPageChange,
  loading = false,
}) {
  const pages = Math.ceil(total / ROWS_PER_PAGE);
  const sentinelRef = useRef(null);

  // Prefetch next page: trigger onPageChange when sentinel is 80% visible
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onPageChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && page < pages && !loading) {
          onPageChange(page + 1);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, pages, loading, onPageChange]);

  const isEmpty = !loading && transactions.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 px-4 text-left text-gray-500 text-xs uppercase tracking-wide sticky left-0 bg-white whitespace-nowrap">
                Patient
              </th>
              <th className="py-3 px-4 text-left text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                Doctor
              </th>
              <th className="py-3 px-4 text-left text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                Method
              </th>
              <th className="py-3 px-4 text-left text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                Amount
              </th>
              <th className="py-3 px-4 text-left text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                Time
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading — 5 skeleton rows */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={`skeleton-${i}`} />
              ))}

            {/* Empty state */}
            {isEmpty && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">💸</span>
                    <span className="text-sm">No transactions found</span>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading &&
              transactions.map((tx) => {
                const patientName =
                  tx?.patient?.name ?? '—';
                const doctorName =
                  tx?.appointment?.doctor?.user?.name ?? '—';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 border-b border-gray-50"
                  >
                    {/* Patient — sticky first column */}
                    <td className="py-3 px-4 sticky left-0 bg-white whitespace-nowrap font-medium text-gray-800">
                      {patientName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {doctorName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <MethodBadge method={tx.method} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-medium">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                      {tx.paidAt ? formatTime(tx.paidAt) : '—'}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Sentinel for IntersectionObserver prefetch */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-3 text-sm text-gray-500">
          <button
            onClick={() => onPageChange && onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ← Prev
          </button>

          <span className="text-gray-600">
            Page {page} of {pages}
          </span>

          <button
            onClick={() => onPageChange && onPageChange(page + 1)}
            disabled={page === pages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
