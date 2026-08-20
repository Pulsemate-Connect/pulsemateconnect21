/**
 * Tests for useAlertEngine hook — all 11 alert rules + dismiss.
 * Requirements: 5.1–5.20
 */
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAlertEngine } from '../hooks/useAlertEngine';

// ─── localStorage mock ────────────────────────────────────────────────────────
beforeEach(() => {
  Storage.prototype.getItem = jest.fn(() => null);
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.removeItem = jest.fn();
});

// ─── Test helpers ─────────────────────────────────────────────────────────────
const mkData = (overrides = {}) => ({
  metrics: {
    appointments: {
      total: 100,
      completed: 85,
      cancelled: 5,
      noShow: 3,
      completionRate: 85,
      avgWaitTime: 15,
      ...overrides.appointments,
    },
    revenue: {
      total: 50000,
      ...overrides.revenue,
    },
    staff: {
      active: 3,
      ...overrides.staff,
    },
  },
  doctorPerformance: overrides.doctorPerformance || [
    { doctor: 'Dr. A', appointments: 50, revenue: 25000 },
  ],
});

const mkComparison = (overrides = {}) => ({
  comparison: {
    revenue:  { current: 50000, previous: 40000, delta: 10000, pct: 25,  ...overrides.revenue  },
    patients: { current: 100,   previous: 80,    delta: 20,    pct: 25,  ...overrides.patients },
  },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAlertEngine', () => {
  test('returns empty alerts when data is null', () => {
    const { result } = renderHook(() => useAlertEngine(null, null));
    expect(result.current.alerts).toEqual([]);
  });

  test('revenue-drop alert fires when comparison revenue pct < -20', () => {
    const comparison = mkComparison({ revenue: { pct: -25, current: 3000, previous: 4000, delta: -1000 } });
    const { result } = renderHook(() => useAlertEngine(mkData(), comparison));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('revenue-drop');
  });

  test('revenue-drop does NOT fire when pct === -15', () => {
    const comparison = mkComparison({ revenue: { pct: -15, current: 3400, previous: 4000, delta: -600 } });
    const { result } = renderHook(() => useAlertEngine(mkData(), comparison));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).not.toContain('revenue-drop');
  });

  test('high-cancellation fires when cancelled/total > 0.15', () => {
    const data = mkData({ appointments: { total: 100, completed: 70, cancelled: 20, noShow: 3, completionRate: 70, avgWaitTime: 10 } });
    const { result } = renderHook(() => useAlertEngine(data, null));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('high-cancellation');
  });

  test('high-noshow fires when noShow/total > 0.10', () => {
    const data = mkData({ appointments: { total: 100, completed: 80, cancelled: 5, noShow: 15, completionRate: 80, avgWaitTime: 10 } });
    const { result } = renderHook(() => useAlertEngine(data, null));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('high-noshow');
  });

  test('long-wait fires when avgWaitTime > 30', () => {
    const data = mkData({ appointments: { total: 100, completed: 85, cancelled: 5, noShow: 3, completionRate: 85, avgWaitTime: 35 } });
    const { result } = renderHook(() => useAlertEngine(data, null));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('long-wait');
  });

  test('low-completion fires when completionRate < 75', () => {
    const data = mkData({ appointments: { total: 100, completed: 70, cancelled: 10, noShow: 5, completionRate: 70, avgWaitTime: 10 } });
    const { result } = renderHook(() => useAlertEngine(data, null));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('low-completion');
  });

  test('strong-growth fires when comparison revenue pct > 25', () => {
    const comparison = mkComparison({ revenue: { pct: 30, current: 5200, previous: 4000, delta: 1200 } });
    const { result } = renderHook(() => useAlertEngine(mkData(), comparison));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('strong-growth');
  });

  test('patient-growth fires when comparison patients pct > 30', () => {
    const comparison = mkComparison({ patients: { pct: 35, current: 135, previous: 100, delta: 35 } });
    const { result } = renderHook(() => useAlertEngine(mkData(), comparison));
    const ids = result.current.alerts.map((a) => a.id);
    expect(ids).toContain('patient-growth');
  });

  test('returns max 5 alerts when many rules trigger simultaneously', () => {
    // Trigger all negative rules at once
    const data = mkData({
      appointments: { total: 100, completed: 60, cancelled: 20, noShow: 15, completionRate: 60, avgWaitTime: 40 },
      staff: { active: 0 },
      doctorPerformance: [{ doctor: 'Dr. A', appointments: 0, revenue: 0 }],
    });
    const comparison = mkComparison({
      revenue: { pct: -30, current: 2800, previous: 4000, delta: -1200 },
      patients: { pct: -5, current: 95, previous: 100, delta: -5 },
    });
    const { result } = renderHook(() => useAlertEngine(data, comparison));
    expect(result.current.alerts.length).toBeLessThanOrEqual(5);
  });

  test('dismiss(id) writes to localStorage and removes the alert', () => {
    const comparison = mkComparison({ revenue: { pct: -25, current: 3000, previous: 4000, delta: -1000 } });
    const { result } = renderHook(() => useAlertEngine(mkData(), comparison));
    const alertsBefore = result.current.alerts.length;
    expect(alertsBefore).toBeGreaterThan(0);

    const idToDismiss = result.current.alerts[0].id;
    // Mock localStorage to return the dismissed map on next read
    Storage.prototype.getItem.mockReturnValue(JSON.stringify({ [idToDismiss]: Date.now() }));

    act(() => {
      result.current.dismiss(idToDismiss);
    });

    expect(Storage.prototype.setItem).toHaveBeenCalled();
    // After dismiss, that alert should be gone
    const alertsAfter = result.current.alerts.map((a) => a.id);
    expect(alertsAfter).not.toContain(idToDismiss);
  });
});
