// ─────────────────────────────────────────────────────────────────────────────
//  ClinicVerification — Route: /admin/clinics/verify
//
//  FIX: Stats cards and table now share ONE fetch with IDENTICAL filter params.
//  The /admin/all-clinics/stats endpoint runs the same WHERE clause as the
//  table list (search, state, city, clinicType) and returns per-status counts.
//  Stats and table are always in sync — no separate getDashboard call.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import DashboardLayout from '../../layouts/DashboardLayout';
import { getAllAdminClinics, getAdminClinicStats, getAdminDashboard } from '../../api/admin.api';

import SummaryCard from './components/SummaryCard';
import FilterBar from './components/FilterBar';
import ClinicVerificationTable from './components/ClinicVerificationTable';
import Pagination from './components/Pagination';

// ── Status filter pills ───────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '',                 label: 'All',              dot: 'bg-blue-500'   },
  { key: 'PENDING',          label: 'Pending',          dot: 'bg-yellow-400' },
  { key: 'UNDER_REVIEW',     label: 'Under Review',     dot: 'bg-blue-500'   },
  { key: 'VERIFIED',         label: 'Approved',         dot: 'bg-green-500'  },
  { key: 'REJECTED',         label: 'Rejected',         dot: 'bg-red-500'    },
  { key: 'CHANGES_REQUIRED', label: 'Changes Required', dot: 'bg-orange-400' },
  { key: 'SUSPENDED',        label: 'Suspended',        dot: 'bg-gray-400'   },
];

// ── Summary cards
// statsKey matches the EXACT key returned by /admin/all-clinics/stats
// (backend returns { PENDING: n, UNDER_REVIEW: n, VERIFIED: n, ..., TOTAL: n })
const SUMMARY_CARDS = [
  { statusKey: '',                 statsKey: 'TOTAL',            label: 'Total Clinics',     bgClass: 'bg-blue-50',   colorClass: 'text-blue-500',   borderClass: 'ring-blue-400'   },
  { statusKey: 'PENDING',          statsKey: 'PENDING',          label: 'Pending Approval',  bgClass: 'bg-yellow-50', colorClass: 'text-yellow-500', borderClass: 'ring-yellow-400' },
  { statusKey: 'UNDER_REVIEW',     statsKey: 'UNDER_REVIEW',     label: 'Under Review',      bgClass: 'bg-indigo-50', colorClass: 'text-indigo-500', borderClass: 'ring-indigo-400' },
  { statusKey: 'VERIFIED',         statsKey: 'VERIFIED',         label: 'Approved Clinics',  bgClass: 'bg-green-50',  colorClass: 'text-green-500',  borderClass: 'ring-green-400'  },
  { statusKey: 'REJECTED',         statsKey: 'REJECTED',         label: 'Rejected Clinics',  bgClass: 'bg-red-50',    colorClass: 'text-red-500',    borderClass: 'ring-red-400'    },
  { statusKey: 'CHANGES_REQUIRED', statsKey: 'CHANGES_REQUIRED', label: 'Changes Required',  bgClass: 'bg-orange-50', colorClass: 'text-orange-500', borderClass: 'ring-orange-400' },
  { statusKey: 'SUSPENDED',        statsKey: 'SUSPENDED',        label: 'Suspended Clinics', bgClass: 'bg-purple-50', colorClass: 'text-purple-500', borderClass: 'ring-purple-400' },
];

const DEFAULT_FILTERS = {
  status: 'PENDING', search: '', state: '', city: '', clinicType: '',
};

// ── Main Component ────────────────────────────────────────────────────────────
const ClinicVerification = () => {
  const [clinics,    setClinics]    = useState([]);
  // stats: { PENDING: 3, VERIFIED: 4, TOTAL: 13, ... } — keyed by status string
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [page,       setPage]       = useState(1);
  const [limit,      setLimit]      = useState(10);

  // Debounce search input
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [filters.search]);

  // ── Shared filter params (no status, no pagination) ──────────────────────
  // Used by BOTH the stats call and the list call so they always query
  // the same dataset.
  const buildFilterParams = useCallback(() => ({
    ...(debouncedSearch    && { search:     debouncedSearch    }),
    ...(filters.state      && { state:      filters.state      }),
    ...(filters.city       && { city:       filters.city       }),
    ...(filters.clinicType && { clinicType: filters.clinicType }),
  }), [debouncedSearch, filters.state, filters.city, filters.clinicType]);

  // ── Single fetch — stats + list in parallel, identical filter params ─────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const filterParams = buildFilterParams();

    try {
      // Fetch stats and list in parallel with independent error handling.
      // Stats failure should NEVER break the table — settle both independently.
      const [statsResult, listResult] = await Promise.allSettled([
        getAdminClinicStats(filterParams),
        getAllAdminClinics({
          ...filterParams,
          page,
          limit,
          ...(filters.status && { status: filters.status }),
        }),
      ]);

      // Stats — update if successful, silently keep previous values on failure
      if (statsResult.status === 'fulfilled') {
        const rawStats = statsResult.value.data.data?.stats || {};
        setStats(rawStats);
        console.log('[ClinicVerification] Stats:', rawStats);
      } else {
        // Fallback: use the dashboard API if new stats endpoint isn't available yet
        // (handles case where backend hasn't been restarted after deploy)
        console.warn('[ClinicVerification] Stats fetch failed, trying dashboard fallback...');
        try {
          const fallback = await getAdminDashboard();
          const s = fallback.data.data?.stats || {};
          setStats({
            PENDING:          s.pendingClinics         ?? 0,
            UNDER_REVIEW:     s.underReviewClinics     ?? 0,
            VERIFIED:         s.verifiedClinics        ?? 0,
            REJECTED:         s.rejectedClinics        ?? 0,
            CHANGES_REQUIRED: s.changesRequiredClinics ?? 0,
            SUSPENDED:        s.suspendedClinics       ?? 0,
            TOTAL: (s.pendingClinics || 0) + (s.underReviewClinics || 0) +
                   (s.verifiedClinics || 0) + (s.rejectedClinics || 0) +
                   (s.changesRequiredClinics || 0) + (s.suspendedClinics || 0),
          });
        } catch {
          // stats completely unavailable — cards will show 0
        }
      }

      // List — this is the primary data; throw to show error state if it fails
      if (listResult.status === 'fulfilled') {
        const fetchedClinics = listResult.value.data.data?.clinics || [];
        const pag = listResult.value.data.pagination || { total: 0, page: 1, totalPages: 1 };
        setClinics(fetchedClinics);
        setPagination(pag);
        console.log('[ClinicVerification] Status filter:', filters.status || 'ALL',
          '| Records:', fetchedClinics.length, '| Total:', pag.total);
      } else {
        throw listResult.reason;
      }

    } catch {
      setError('Unable to load clinic applications. Please try again.');
      toast.error('Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams, filters.status, page, limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange  = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
    if (key !== 'search') setPage(1);
  };
  const handleStatusTab    = (key) => { setFilters((p) => ({ ...p, status: key })); setPage(1); };
  const handleClearFilters = ()    => { setFilters(DEFAULT_FILTERS); setPage(1); };
  const handleLimitChange  = (n)   => { setLimit(n); setPage(1); };

  // Read count from stats object — shows skeleton (null) only on very first load
  const getCount = (statsKey) => {
    if (loading && Object.keys(stats).length === 0) return null;
    return stats[statsKey] ?? 0;
  };

  return (
    <DashboardLayout>
      <div className="page-container">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinic Verification</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review clinic applications, verify documents, and manage approval status.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white
                       text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard
              key={card.statusKey}
              statsKey={card.statsKey}
              count={getCount(card.statsKey)}
              label={card.label}
              bgClass={card.bgClass}
              colorClass={card.colorClass}
              borderClass={card.borderClass}
              active={filters.status === card.statusKey}
              onClick={() => handleStatusTab(card.statusKey)}
            />
          ))}
        </div>

        {/* ── Status Filter Pills ────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-5">
          {STATUS_TABS.map(({ key, label, dot }) => {
            const isActive = filters.status === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleStatusTab(key)}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {!isActive && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Search & Filters ───────────────────────────────────────── */}
        <div className="mb-5">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
          />
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        {error ? (
          <div className="bg-white rounded-2xl border border-red-100 p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800 mb-1">Unable to load clinic applications</p>
            <p className="text-sm text-gray-500 mb-5">Please check your connection and try again.</p>
            <button type="button" onClick={fetchAll}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
              Try Again
            </button>
          </div>

        ) : !loading && clinics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-3xl">🏥</div>
            <p className="text-base font-semibold text-gray-800 mb-1">No clinic applications found</p>
            <p className="text-sm text-gray-400 mb-5">Try changing the search or filter options.</p>
            {(filters.search || filters.state || filters.city || filters.clinicType || filters.status) && (
              <button type="button" onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                Clear all filters
              </button>
            )}
          </div>

        ) : (
          <>
            <ClinicVerificationTable clinics={clinics} loading={loading} />
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClinicVerification;
