/**
 * DashboardFilterBar — desktop filter controls for the owner dashboard.
 *
 * Hidden on mobile (hidden sm:block). The mobile equivalent is DashboardFilterDrawer.
 *
 * Requirements: 4.1–4.19, 9.5, 9.6
 */

// ─── Period config ────────────────────────────────────────────────────────────

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

// ─── Badge label helpers ──────────────────────────────────────────────────────

function badgeLabel(key, value, doctors) {
  switch (key) {
    case 'period':
      return `Period: ${PERIODS.find((p) => p.key === value)?.label ?? value}`;
    case 'startDate':
      return `From: ${value}`;
    case 'endDate':
      return `To: ${value}`;
    case 'doctorId': {
      const doc = doctors.find((d) => d.id === value);
      return `Doctor: ${doc ? doc.name : value}`;
    }
    case 'paymentMethod':
      return `Payment: ${PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value}`;
    case 'appointmentStatus':
      return `Status: ${APPOINTMENT_STATUSES.find((s) => s.value === value)?.label ?? value}`;
    default:
      return `${key}: ${value}`;
  }
}

/**
 * Returns the default value for a given filter key so the × badge can reset it.
 */
function defaultForKey(key) {
  const defaults = {
    period: 'month',
    startDate: null,
    endDate: null,
    doctorId: null,
    paymentMethod: 'ALL',
    appointmentStatus: 'ALL',
  };
  return defaults[key] ?? null;
}

/**
 * Returns an array of { key, value } for filters that differ from their defaults.
 */
function getActiveFilterEntries(filters) {
  const defaults = {
    period: 'month',
    startDate: null,
    endDate: null,
    doctorId: null,
    paymentMethod: 'ALL',
    appointmentStatus: 'ALL',
  };
  return Object.entries(filters).filter(([key, value]) => {
    return value !== defaults[key] && value !== null && value !== undefined;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {object}   props.filters          — current filter state
 * @param {Array}    props.doctors          — [{ id, name }]
 * @param {Function} props.onFilterChange   — (key, value) => void
 * @param {Function} props.onClearAll       — () => void
 * @param {number}   props.activeCount      — number of active non-default filters
 * @param {boolean}  props.loading          — show spinner while refetching
 * @param {number}   [props.resultCount]    — optional result count to display
 */
export default function DashboardFilterBar({
  filters = {},
  doctors = [],
  onFilterChange,
  onClearAll,
  activeCount = 0,
  loading = false,
  resultCount,
}) {
  const activeBadges = getActiveFilterEntries(filters);

  return (
    <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">

      {/* ── Row 1: Period quick-select ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
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

      {/* ── Row 2: Custom date range ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input
            type="date"
            value={filters.startDate ?? ''}
            onChange={(e) => onFilterChange('startDate', e.target.value || null)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input
            type="date"
            value={filters.endDate ?? ''}
            min={filters.startDate ?? undefined}
            onChange={(e) => onFilterChange('endDate', e.target.value || null)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* ── Row 3: Filter dropdowns + Clear All ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Doctor */}
        <select
          value={filters.doctorId ?? ''}
          onChange={(e) => onFilterChange('doctorId', e.target.value || null)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">All Doctors</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>

        {/* Payment Method */}
        <select
          value={filters.paymentMethod ?? 'ALL'}
          onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          {PAYMENT_METHODS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Appointment Status */}
        <select
          value={filters.appointmentStatus ?? 'ALL'}
          onChange={(e) => onFilterChange('appointmentStatus', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          {APPOINTMENT_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Clear All + loading spinner */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
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

        {/* Loading spinner when no active filters */}
        {activeCount === 0 && loading && (
          <span
            className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-auto"
            aria-label="Loading"
          />
        )}

        {/* Result count */}
        {resultCount !== undefined && resultCount !== null && (
          <span className="text-xs text-gray-400 ml-auto">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Active filter badges ───────────────────────────────────────────── */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {activeBadges.map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
            >
              {badgeLabel(key, value, doctors)}
              <button
                onClick={() => onFilterChange(key, defaultForKey(key))}
                className="ml-0.5 text-blue-400 hover:text-blue-700 font-bold leading-none"
                aria-label={`Remove ${key} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
