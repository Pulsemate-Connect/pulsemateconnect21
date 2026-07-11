/**
 * Tests for useDashboardFilters hook.
 * Requirements: 4.13, 4.14, 4.17, 4.18
 */
import { renderHook, act } from '@testing-library/react';
import { useDashboardFilters } from '../hooks/useDashboardFilters';

const CLINIC_ID = 'clinic-abc';
const STORAGE_KEY = `dashboard-filters-${CLINIC_ID}`;

const DEFAULT_FILTERS = {
  period: 'month',
  startDate: null,
  endDate: null,
  doctorId: null,
  paymentMethod: 'ALL',
  appointmentStatus: 'ALL',
};

// ─── localStorage mock ────────────────────────────────────────────────────────
let store = {};
beforeEach(() => {
  store = {};
  global.localStorage = {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDashboardFilters', () => {
  test('returns default filters when localStorage has no entry', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  test('returns default filters when localStorage has corrupted JSON', () => {
    store[STORAGE_KEY] = '{ invalid json :::';
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  test('returns default filters when localStorage has wrong shape', () => {
    store[STORAGE_KEY] = JSON.stringify({ something: 'wrong' });
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  test('setFilter updates period and persists to localStorage', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    act(() => { result.current.setFilter('period', 'today'); });
    expect(result.current.filters.period).toBe('today');
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"period":"today"')
    );
  });

  test('clearAll resets filters to defaults and calls removeItem', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    act(() => { result.current.setFilter('period', 'today'); });
    act(() => { result.current.clearAll(); });
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    expect(global.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  test('setFilter returns error when endDate is before startDate', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    // First set a startDate in June
    act(() => { result.current.setFilter('startDate', '2024-06-01'); });
    // Then try to set an endDate before it
    act(() => { result.current.setFilter('endDate', '2024-01-01'); });
    expect(result.current.error).toBeTruthy();
    // endDate should NOT have been updated
    expect(result.current.filters.endDate).toBeNull();
  });

  test('setFilter returns error when date range exceeds 1 year (366 days)', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    act(() => { result.current.setFilter('startDate', '2024-01-01'); });
    // Set endDate more than 366 days later
    act(() => { result.current.setFilter('endDate', '2025-06-01'); });
    expect(result.current.error).toBeTruthy();
    expect(result.current.filters.endDate).toBeNull();
  });

  test('activeCount is 0 for default filters', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    expect(result.current.activeCount).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  test('activeCount increments when period is changed from default', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    act(() => { result.current.setFilter('period', 'today'); });
    expect(result.current.activeCount).toBe(1);
    expect(result.current.isActive).toBe(true);
  });

  test('activeCount increments for each active non-default filter', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    act(() => {
      result.current.setFilter('period', 'today');
      result.current.setFilter('doctorId', 'doc-123');
      result.current.setFilter('paymentMethod', 'CASH');
    });
    expect(result.current.activeCount).toBe(3);
  });

  test('clearAll resets error state', () => {
    const { result } = renderHook(() => useDashboardFilters(CLINIC_ID));
    act(() => { result.current.setFilter('startDate', '2024-06-01'); });
    act(() => { result.current.setFilter('endDate', '2024-01-01'); }); // triggers error
    expect(result.current.error).toBeTruthy();
    act(() => { result.current.clearAll(); });
    expect(result.current.error).toBeNull();
  });
});
