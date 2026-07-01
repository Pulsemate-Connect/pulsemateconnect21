import { useState, useMemo, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dashboard-dismissed-alerts';

/** 24 hours in milliseconds */
const DISMISS_TTL_MS = 86_400_000;

/** Severity rank map — lower number = higher priority in the sorted list */
const SEVERITY_RANK = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  POSITIVE: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Loads the dismissed-alert map from localStorage.
 * Returns an empty object on any read / parse failure.
 *
 * @returns {{ [alertId: string]: number }} map of alertId → dismiss timestamp
 */
function loadDismissedMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Returns true when the given alert ID is currently dismissed (within 24h TTL).
 *
 * @param {string} id
 * @param {{ [alertId: string]: number }} dismissedMap
 * @returns {boolean}
 */
function isDismissed(id, dismissedMap) {
  const dismissedAt = dismissedMap[id];
  if (dismissedAt == null) return false;
  return Date.now() - dismissedAt < DISMISS_TTL_MS;
}

// ─── Alert rules ─────────────────────────────────────────────────────────────

/**
 * Derives the full set of candidate alerts from `data` and `comparisonData`.
 * No filtering, sorting, or slicing is applied here — that is done in the hook.
 *
 * Alert object shape:
 *   { id: string, severity: 'HIGH'|'MEDIUM'|'LOW'|'POSITIVE',
 *     title: string, description?: string, action?: string, link?: string }
 *
 * @param {object|null} data            - Enhanced dashboard metrics response
 * @param {object|null} comparisonData  - Comparison period response
 * @returns {object[]} Unfiltered array of alert objects
 */
function buildAlerts(data, comparisonData) {
  const alerts = [];

  // ── 1. Revenue Drop ──────────────────────────────────────────────────────
  if (comparisonData?.comparison?.revenue?.pct < -20) {
    alerts.push({
      id: 'revenue-drop',
      severity: 'HIGH',
      title: 'Revenue Drop',
      description: 'Revenue dropped significantly vs last period.',
      action: 'Review appointment volume and payment records.',
      link: '/clinic/revenue',
    });
  }

  // ── 2. High Cancellation Rate (> 15%) ────────────────────────────────────
  const totalAppts = data?.metrics?.appointments?.total;
  const cancelledAppts = data?.metrics?.appointments?.cancelled;
  if (
    totalAppts > 0 &&
    cancelledAppts != null &&
    cancelledAppts / totalAppts > 0.15
  ) {
    alerts.push({
      id: 'high-cancellation',
      severity: 'MEDIUM',
      title: 'High Cancellation Rate',
      description: 'More than 15% of appointments have been cancelled.',
      action: 'Contact patients to reschedule.',
      link: '/clinic/appointments',
    });
  }

  // ── 3. High No-Show Rate (> 10%) ─────────────────────────────────────────
  const noShowAppts = data?.metrics?.appointments?.noShow;
  if (
    totalAppts > 0 &&
    noShowAppts != null &&
    noShowAppts / totalAppts > 0.10
  ) {
    alerts.push({
      id: 'high-noshow',
      severity: 'MEDIUM',
      title: 'High No-Show Rate',
      description: 'More than 10% of patients did not show up for their appointments.',
      action: 'Send appointment reminders to reduce no-shows.',
      link: '/clinic/appointments',
    });
  }

  // ── 4. Long Wait Times (avg > 30 min) ────────────────────────────────────
  const avgWaitTime = data?.metrics?.appointments?.avgWaitTime;
  if (avgWaitTime != null && avgWaitTime > 30) {
    alerts.push({
      id: 'long-wait',
      severity: 'HIGH',
      title: 'Long Wait Times',
      description: `Average patient wait time is ${Math.round(avgWaitTime)} minutes.`,
      action: 'Consider adding more time slots.',
      link: '/clinic/appointments',
    });
  }

  // ── 5. Low Completion Rate (< 75%) ───────────────────────────────────────
  const completionRate = data?.metrics?.appointments?.completionRate;
  if (completionRate != null && completionRate < 75) {
    alerts.push({
      id: 'low-completion',
      severity: 'MEDIUM',
      title: 'Low Completion Rate',
      description: `Only ${Math.round(completionRate)}% of appointments are being completed.`,
      action: 'Review appointment scheduling and follow-up processes.',
      link: '/clinic/appointments',
    });
  }

  // ── 6. Inactive Doctor (0 appointments this week) ────────────────────────
  //    Generate one alert per inactive doctor but cap at 1 alert of this type.
  if (Array.isArray(data?.doctorPerformance)) {
    const inactiveDoctors = data.doctorPerformance.filter(
      (doc) => doc.appointments === 0
    );
    if (inactiveDoctors.length > 0) {
      // Cap at 1 alert of this type regardless of how many inactive doctors.
      const firstInactive = inactiveDoctors[0];
      alerts.push({
        id: 'inactive-doctor',
        severity: 'LOW',
        title: 'Inactive Doctor',
        description:
          inactiveDoctors.length === 1
            ? `${firstInactive.doctor ?? 'A doctor'} has no appointments this week.`
            : `${inactiveDoctors.length} doctors have no appointments this week.`,
        action: 'Review scheduling or check if the doctor is on leave.',
        link: '/clinic/doctors',
      });
    }
  }

  // ── 7. Strong Revenue Growth (> 25%) ─────────────────────────────────────
  if (comparisonData?.comparison?.revenue?.pct > 25) {
    alerts.push({
      id: 'strong-growth',
      severity: 'POSITIVE',
      title: 'Strong Revenue Growth',
      description: `Revenue grew ${Math.round(comparisonData.comparison.revenue.pct)}% vs last period.`,
      action: 'Keep up the great work!',
      link: '/clinic/revenue',
    });
  }

  // ── 8. Patient Growth (> 30%) ────────────────────────────────────────────
  if (comparisonData?.comparison?.patients?.pct > 30) {
    alerts.push({
      id: 'patient-growth',
      severity: 'POSITIVE',
      title: 'Patient Growth',
      description: `Patient count grew ${Math.round(comparisonData.comparison.patients.pct)}% vs last period.`,
      action: 'Great growth! Ensure capacity can handle the increase.',
      link: '/clinic/patients',
    });
  }

  // ── 9. No Active Staff ───────────────────────────────────────────────────
  if (data?.metrics?.staff?.active === 0) {
    alerts.push({
      id: 'no-doctors',
      severity: 'HIGH',
      title: 'No Active Staff',
      description: 'There are currently no active staff members.',
      action: 'Add or activate staff to start accepting appointments.',
      link: '/clinic/staff',
    });
  }

  return alerts;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAlertEngine(data, comparisonData)
 *
 * Derives actionable alerts from dashboard data and comparison data.
 * Alerts are filtered against a 24-hour localStorage dismiss store, sorted
 * by severity rank, and capped at 5.
 *
 * Dismissed state is tracked via a `useState` counter so that calling
 * `dismiss(id)` triggers a re-render and the dismissed alert disappears
 * immediately without requiring a full data refetch.
 *
 * Requirements: 5.1 – 5.20
 *
 * @param {object|null} data           - Enhanced dashboard metrics response
 * @param {object|null} comparisonData - Comparison period response
 * @returns {{ alerts: object[], dismiss: (id: string) => void }}
 */
export function useAlertEngine(data, comparisonData) {
  // A counter incremented on every dismiss call so that useMemo below
  // re-evaluates when the dismissed set changes.
  const [dismissCounter, setDismissCounter] = useState(0);

  /**
   * Dismisses an alert by ID.
   * Writes `{ [id]: Date.now() }` into the localStorage dismissed map and
   * triggers a re-render so the alert is immediately removed from the list.
   *
   * @param {string} id
   */
  const dismiss = useCallback((id) => {
    try {
      const current = loadDismissedMap();
      current[id] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // non-critical — dismiss silently fails if storage is unavailable
    }
    // Increment counter to force useMemo to re-run
    setDismissCounter((prev) => prev + 1);
  }, []);

  /**
   * Derive the visible alerts.
   * Re-computed whenever data, comparisonData, or the dismissed set changes.
   */
  const alerts = useMemo(() => {
    // dismissCounter is referenced to ensure this memo re-runs after a dismiss.
    // eslint-disable-next-line no-unused-expressions
    dismissCounter;

    const candidateAlerts = buildAlerts(data, comparisonData);
    const dismissedMap = loadDismissedMap();

    return candidateAlerts
      .filter((alert) => !isDismissed(alert.id, dismissedMap))
      .sort((a, b) => {
        const rankA = SEVERITY_RANK[a.severity] ?? 99;
        const rankB = SEVERITY_RANK[b.severity] ?? 99;
        return rankA - rankB;
      })
      .slice(0, 5);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, comparisonData, dismissCounter]);

  return { alerts, dismiss };
}

export default useAlertEngine;
