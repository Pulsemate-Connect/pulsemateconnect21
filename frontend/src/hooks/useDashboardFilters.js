import { useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  period: 'month',
  startDate: null,
  endDate: null,
  doctorId: null,
  paymentMethod: 'ALL',
  appointmentStatus: 'ALL',
};

const VALID_PERIODS = ['today', 'week', 'month', 'last7', 'last30', 'all', 'custom'];
const VALID_PAYMENT_METHODS = ['ALL', 'CASH', 'ONLINE'];
const VALID_APPOINTMENT_STATUSES = ['ALL', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

/** Maximum allowed date range in milliseconds (366 days). */
const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates that a parsed object has all required filter keys with acceptable values.
 * Returns true when the object is a valid DashboardFilters shape.
 */
function isValidFilters(obj) {
  if (!obj || typeof obj !== 'object') return false;

  const requiredKeys = Object.keys(DEFAULT_FILTERS);
  if (!requiredKeys.every((k) => Object.prototype.hasOwnProperty.call(obj, k))) return false;

  if (!VALID_PERIODS.includes(obj.period)) return false;
  if (!VALID_PAYMENT_METHODS.includes(obj.paymentMethod)) return false;
  if (!VALID_APPOINTMENT_STATUSES.includes(obj.appointmentStatus)) return false;

  // doctorId must be a string or null
  if (obj.doctorId !== null && typeof obj.doctorId !== 'string') return false;

  // startDate / endDate must be ISO strings or null
  if (obj.startDate !== null && typeof obj.startDate !== 'string') return false;
  if (obj.endDate !== null && typeof obj.endDate !== 'string') return false;

  return true;
}

/**
 * Loads filters from localStorage for the given clinicId.
 * Falls back to DEFAULT_FILTERS on any parse or validation error.
 */
function loadFromStorage(clinicId) {
  try {
    const raw = localStorage.getItem(`dashboard-filters-${clinicId}`);
    if (!raw) return { ...DEFAULT_FILTERS };

    const parsed = JSON.parse(raw);
    if (!isValidFilters(parsed)) return { ...DEFAULT_FILTERS };

    return parsed;
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

/**
 * Persists filter state to localStorage.
 * Silently swallows errors (e.g. quota exceeded, private-browsing restrictions).
 */
function saveToStorage(clinicId, filters) {
  try {
    localStorage.setItem(`dashboard-filters-${clinicId}`, JSON.stringify(filters));
  } catch {
    // non-critical — ignore
  }
}

/**
 * Validates a date range update.
 * Returns an error string when the range is invalid, or null when it is valid.
 *
 * @param {string} key  - 'startDate' | 'endDate'
 * @param {string} value - ISO date string being set
 * @param {object} currentFilters - current filter state (before this update)
 */
function validateDateRange(key, value, currentFilters) {
  if (!value) return null; // clearing a date is always fine

  const newDate = new Date(value);
  if (isNaN(newDate.getTime())) return 'Invalid date value.';

  if (key === 'endDate' && currentFilters.startDate) {
    const start = new Date(currentFilters.startDate);
    if (newDate < start) {
      return 'End date cannot be before start date.';
    }
    if (newDate - start > MAX_RANGE_MS) {
      return 'Date range cannot exceed 1 year.';
    }
  }

  if (key === 'startDate' && currentFilters.endDate) {
    const end = new Date(currentFilters.endDate);
    if (end < newDate) {
      return 'End date cannot be before start date.';
    }
    if (end - newDate > MAX_RANGE_MS) {
      return 'Date range cannot exceed 1 year.';
    }
  }

  return null;
}

// ─── Derived values ───────────────────────────────────────────────────────────

/**
 * Returns true when any filter differs from its default value.
 */
function computeIsActive(filters) {
  return (
    filters.period !== DEFAULT_FILTERS.period ||
    filters.doctorId !== null ||
    filters.paymentMethod !== 'ALL' ||
    filters.appointmentStatus !== 'ALL' ||
    filters.startDate !== null ||
    filters.endDate !== null
  );
}

/**
 * Returns the number of filters that differ from their default value.
 * Counted dimensions: period, doctorId, paymentMethod, appointmentStatus,
 * and custom date (startDate or endDate counts as one combined dimension).
 */
function computeActiveCount(filters) {
  let count = 0;
  if (filters.period !== DEFAULT_FILTERS.period) count++;
  if (filters.doctorId !== null) count++;
  if (filters.paymentMethod !== 'ALL') count++;
  if (filters.appointmentStatus !== 'ALL') count++;
  if (filters.startDate !== null || filters.endDate !== null) count++;
  return count;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDashboardFilters(clinicId)
 *
 * Manages dashboard filter state with localStorage persistence and date-range
 * validation.
 *
 * Requirements: 4.1 – 4.18
 *
 * @param {string} clinicId - The active clinic's ID (used as the storage key).
 * @returns {{ filters, setFilter, clearAll, isActive, activeCount, error }}
 */
export function useDashboardFilters(clinicId) {
  const [filters, setFilters] = useState(() => loadFromStorage(clinicId));
  const [error, setError] = useState(null);

  /**
   * Updates a single filter key, validates date ranges, and persists to storage.
   *
   * @param {string} key   - Filter key from DEFAULT_FILTERS
   * @param {*}      value - New value for that key
   */
  const setFilter = useCallback(
    (key, value) => {
      // Validate date range when setting startDate or endDate
      if (key === 'startDate' || key === 'endDate') {
        const validationError = validateDateRange(key, value, filters);
        if (validationError) {
          setError(validationError);
          return; // do not update state when invalid
        }
        setError(null);
      }

      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        saveToStorage(clinicId, next);
        return next;
      });
    },
    [clinicId, filters]
  );

  /**
   * Resets all filters to DEFAULT_FILTERS and removes the localStorage entry.
   */
  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(`dashboard-filters-${clinicId}`);
    } catch {
      // non-critical
    }
    setFilters({ ...DEFAULT_FILTERS });
    setError(null);
  }, [clinicId]);

  const isActive = computeIsActive(filters);
  const activeCount = computeActiveCount(filters);

  return { filters, setFilter, clearAll, isActive, activeCount, error };
}

export default useDashboardFilters;
