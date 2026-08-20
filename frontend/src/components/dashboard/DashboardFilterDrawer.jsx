/**
 * DashboardFilterDrawer — mobile slide-out filter drawer.
 *
 * Visible only on mobile (block sm:hidden). A fixed overlay + left-side panel
 * slides in when `open` is true.
 *
 * Also exports FilterTriggerButton — a small mobile button that opens the drawer.
 *
 * Requirements: 4.1–4.19, 9.5, 9.6
 */

// ─── Period / dropdown config (mirrors DashboardFilterBar) ────────────────────

const PERIODS = [
  { key: 'today',  label: 'Today' },
  { key: 'week',   label: 'This Week' },
  { key: 'month',  label: 'This Month' },
  { key: 'last7',  label: 'Last 7D' },
  { key: 'last30', label: 'Last 30D' },
  { key: 'all',    label: 'All Time' },
];

const PAYMENT_METHODS = [
  { value: 'ALL',    label: 'All Methods' },
  { value: 'CASH',   label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
];

const APPOINTMENT_STATUSES = [
  { value: 'ALL',       label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW',   label: 'No-Show' },
];

// ─── FilterTriggerButton (mobile-only) ───────────────────────────────────────

/**
 * Small button shown on mobile to open the filter drawer.
 *
 * @param {object}   props
 * @param {Function} props.onClick      — opens the drawer
 * @param {number}   props.activeCount  — number of active filters (shows badge)
 */
export function FilterTriggerButton({ onClick, activeCount }) {
  return (
    <button
      onClick={onClick}
      className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700"
    >
      🔽 Filters{' '}
      {activeCount > 0 && (
        <span className="bg-blue-600 text-white rounded-full px-2 text-xs">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// ─── DashboardFilterDrawer ────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {boolean}  props.open              — whether the drawer is visible
 * @param {Function} props.onClose           — close callback
 * @param {object}   props.filters           — current filter state
 * @param {Array}    props.doctors           — [{ id, name }]
 * @param {Function} props.onFilterChange    — (key, value) => void
 * @param {Function} props.onClearAll        — () => void
 * @param {number}   props.activeCount       — number of active filters
 * @param {boolean}  props.loading           — show spinner while refetching
 * @param {number}   [props.resultCount]     — optional result count
 */
export default function DashboardFilterDrawer({
  open = false,
  onClose,
  filters = {},
  doctors = [],
  onFilterChange,
  onClearAll,
  activeCount = 0,
  loading = false,
  resultCount,
}) {
  return (
    <div className="block sm:hidden">
      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer panel ────────────────────────────────────────────────── */}
      <div
        className={
          `fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto p-4 transition-transform duration-300 ` +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none p-1"
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        {/* ── Period quick-select ──────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Period</p>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(({ key, label }) => {
              const isActive = filters.period === key;
              return (
                <button
                  key={key}
                  onClick={() => onFilterChange('period', key)}
                  className={
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ` +
                    (isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Custom date range ────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Date Range</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-8">From</label>
              <input
                type="date"
                value={filters.startDate ?? ''}
                onChange={(e) => onFilterChange('startDate', e.target.value || null)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-8">To</label>
              <input
                type="date"
                value={filters.endDate ?? ''}
                min={filters.startDate ?? undefined}
                onChange={(e) => onFilterChange('endDate', e.target.value || null)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* ── Doctor dropdown ──────────────────────────────────────────── */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Doctor
          </label>
          <select
            value={filters.doctorId ?? ''}
            onChange={(e) => onFilterChange('doctorId', e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Payment Method dropdown ───────────────────────────────────── */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod ?? 'ALL'}
            onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {PAYMENT_METHODS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* ── Appointment Status dropdown ───────────────────────────────── */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Appointment Status
          </label>
          <select
            value={filters.appointmentStatus ?? 'ALL'}
            onChange={(e) => onFilterChange('appointmentStatus', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {APPOINTMENT_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* ── Result count ──────────────────────────────────────────────── */}
        {resultCount !== undefined && resultCount !== null && (
          <p className="text-xs text-gray-400 mb-3">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* ── Clear All ─────────────────────────────────────────────────── */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2 mb-5">
            {loading && (
              <span
                className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
                aria-label="Loading"
              />
            )}
            <button
              onClick={onClearAll}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Clear All ({activeCount})
            </button>
          </div>
        )}

        {/* ── Apply button ──────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
