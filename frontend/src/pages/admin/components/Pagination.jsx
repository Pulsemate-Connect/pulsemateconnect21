// ─────────────────────────────────────────────────────────────────────────────
//  Pagination — matches screenshot exactly:
//  "Showing 1–3 of 3 clinics"  |  ← 1 →  |  Rows: 10 ▾
//  Logic unchanged — only UI
// ─────────────────────────────────────────────────────────────────────────────

const ROWS_OPTIONS = [10, 25, 50];

const Pagination = ({ page, totalPages, total, limit, onPageChange, onLimitChange }) => {
  if (!total) return null;

  // Build visible page numbers (max 7 slots)
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (page > 4) pages.push('…');
    const start = Math.max(2, page - 2);
    const end   = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push('…');
    pages.push(totalPages);
    return pages;
  };

  const from = Math.min((page - 1) * limit + 1, total);
  const to   = Math.min(page * limit, total);

  // Shared button base class
  const btnBase = `
    h-8 w-8 flex items-center justify-center rounded-lg border text-sm
    transition-all active:scale-95 select-none
  `.trim();

  return (
    <div className="flex items-center justify-between mt-5 px-0.5">

      {/* Left — "Showing X–Y of Z clinics" */}
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="font-medium text-gray-700">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-medium text-gray-700">{total}</span>
        {' '}clinics
      </p>

      {/* Centre — prev / page numbers / next */}
      <div className="flex items-center gap-1">
        {/* Prev arrow */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={`${btnBase} bg-white border-gray-200 text-gray-500
            hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {getPages().map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`}
              className="h-8 w-8 flex items-center justify-center text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btnBase} min-w-[32px] w-auto px-2 font-medium
                ${p === page
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next arrow */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={`${btnBase} bg-white border-gray-200 text-gray-500
            hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Right — "Rows: 10 ▾" */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Rows:</span>
        <div className="relative">
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 appearance-none pl-3 pr-7 text-sm border border-gray-200 rounded-lg
                       bg-white text-gray-700 cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          >
            {ROWS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

    </div>
  );
};

export default Pagination;
