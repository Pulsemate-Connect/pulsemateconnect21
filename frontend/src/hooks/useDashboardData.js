import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { getEnhancedDashboard, getComparisonData, getChartData } from '../api/dashboard.api';

// ─── Module-level cache ───────────────────────────────────────────────────────
// Survives component re-mounts within the same session.
// key:   `${clinicId}:${JSON.stringify(filters)}`
// value: { data, chartData, comparisonData, fetchedAt: Date.now() }

const CACHE_TTL_MS = 30_000; // 30 seconds
const cache = new Map();

// ─── useDebounce ──────────────────────────────────────────────────────────────

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity.
 *
 * @template T
 * @param {T} value
 * @param {number} delay - Milliseconds to wait before updating
 * @returns {T}
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useDashboardData ─────────────────────────────────────────────────────────

/**
 * Fetches and caches all dashboard data for the given clinic and filters.
 *
 * Features:
 *  - 500ms debounce on filter changes before triggering a fetch
 *  - 30s module-level in-memory cache (avoids redundant network requests)
 *  - Parallel fetch of enhanced metrics, comparison data, and chart data
 *  - 3-second slow-response warning toast
 *  - `refetch()` invalidates the cache entry and re-fetches immediately
 *
 * Requirements: 10.1, 10.4, 10.5, 10.17
 *
 * @param {string} clinicId - Active clinic ID
 * @param {object} filters  - DashboardFilters shape from useDashboardFilters
 * @returns {{ data, chartData, comparisonData, loading, error, refetch }}
 */
export function useDashboardData(clinicId, filters) {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tracks whether a refetch has been explicitly requested (cache bypass).
  const forceRefetch = useRef(false);

  const debouncedFilters = useDebounce(filters, 500);

  // Build a stable cache key from the current inputs.
  const getCacheKey = useCallback(
    (f) => `${clinicId}:${JSON.stringify(f)}`,
    [clinicId]
  );

  const fetchData = useCallback(
    async (currentFilters, bypassCache = false) => {
      if (!clinicId) return;

      const cacheKey = getCacheKey(currentFilters);

      // ── Cache lookup ──────────────────────────────────────────────────────
      if (!bypassCache) {
        const entry = cache.get(cacheKey);
        if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
          setData(entry.data);
          setChartData(entry.chartData);
          setComparisonData(entry.comparisonData);
          setLoading(false);
          setError(null);
          return;
        }
      }

      // ── Cache miss — fetch from API ───────────────────────────────────────
      setLoading(true);
      setError(null);

      // 3-second slow-response warning (Requirement 10.17)
      const slowWarningTimer = setTimeout(() => {
        toast('Dashboard is taking longer than expected', { icon: '⏳' });
      }, 3000);

      try {
        const [enhancedRes, comparisonRes, chartRes] = await Promise.all([
          getEnhancedDashboard(clinicId, currentFilters),
          getComparisonData(clinicId, currentFilters),
          getChartData(clinicId, currentFilters),
        ]);

        const resolvedData = enhancedRes?.data?.data ?? null;
        const resolvedComparison = comparisonRes?.data?.data ?? null;
        const resolvedChart = chartRes?.data?.data ?? null;

        // Store in cache with current timestamp
        cache.set(cacheKey, {
          data: resolvedData,
          chartData: resolvedChart,
          comparisonData: resolvedComparison,
          fetchedAt: Date.now(),
        });

        setData(resolvedData);
        setChartData(resolvedChart);
        setComparisonData(resolvedComparison);
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load dashboard data');
      } finally {
        clearTimeout(slowWarningTimer);
        setLoading(false);
      }
    },
    [clinicId, getCacheKey]
  );

  // Re-fetch whenever the debounced filters or clinicId change.
  useEffect(() => {
    const bypass = forceRefetch.current;
    if (bypass) {
      forceRefetch.current = false;
    }
    fetchData(debouncedFilters, bypass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, debouncedFilters]);

  /**
   * Invalidates the cache entry for the current filters and re-fetches.
   */
  const refetch = useCallback(() => {
    if (!clinicId) return;
    const cacheKey = getCacheKey(debouncedFilters);
    cache.delete(cacheKey);
    forceRefetch.current = true;
    fetchData(debouncedFilters, true);
  }, [clinicId, debouncedFilters, getCacheKey, fetchData]);

  return { data, chartData, comparisonData, loading, error, refetch };
}

export default useDashboardData;
