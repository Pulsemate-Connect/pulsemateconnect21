import { create } from 'zustand';

const useDashboardStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  metrics: null,        // from getEnhancedDashboard response
  chartData: null,      // from getChartData response
  comparisonData: null, // from getComparisonData response
  transactions: [],     // array of recent transactions
  doctors: [],          // [{ id, name }] for filter dropdown
  realtimeUpdates: {
    lastEvent: null,    // 'new-appointment' | 'appointment-completed' | 'new-payment' | 'queue-updated'
    queueLength: null,
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Sets the full metrics/chartData/comparisonData from a fresh API fetch.
   */
  setDashboardData: (metrics, chartData, comparisonData) =>
    set({ metrics, chartData, comparisonData }),

  /**
   * Sets the transactions list.
   */
  setTransactions: (transactions) => set({ transactions }),

  /**
   * Sets the doctors list.
   */
  setDoctors: (doctors) => set({ doctors }),

  /**
   * Applies a real-time socket event update.
   * Updates the in-memory metrics state without a full refetch.
   *
   * Handles 4 event types:
   *   new-appointment       → increment appointments.total
   *   appointment-completed → increment appointments.completed, recalculate completionRate
   *   new-payment           → update revenue totals (total, cash/online based on method), prepend to transactions
   *   queue-updated         → update realtimeUpdates.queueLength
   */
  applyRealtimeUpdate: (event) => {
    const { type, appointment, payment, queueLength } = event || {};

    set((state) => {
      const metrics = state.metrics ? { ...state.metrics } : null;

      switch (type) {
        case 'new-appointment': {
          if (!metrics?.appointments) return {};
          const appts = { ...metrics.appointments };
          appts.total = (appts.total || 0) + 1;
          return {
            metrics: { ...metrics, appointments: appts },
            realtimeUpdates: {
              lastEvent: 'new-appointment',
              queueLength: state.realtimeUpdates.queueLength,
            },
          };
        }

        case 'appointment-completed': {
          if (!metrics?.appointments) return {};
          const appts = { ...metrics.appointments };
          appts.completed = (appts.completed || 0) + 1;
          // Recalculate completionRate
          if (appts.total > 0) {
            appts.completionRate =
              Math.round((appts.completed / appts.total) * 100 * 10) / 10;
          }
          return {
            metrics: { ...metrics, appointments: appts },
            realtimeUpdates: {
              lastEvent: 'appointment-completed',
              queueLength: state.realtimeUpdates.queueLength,
            },
          };
        }

        case 'new-payment': {
          if (!metrics?.revenue || !payment) return {};
          const rev = { ...metrics.revenue };
          const amount = payment.amount || 0;
          rev.total = (rev.total || 0) + amount;
          // Update cash or online bucket
          if (payment.method === 'CASH') {
            rev.cash = (rev.cash || 0) + amount;
          } else {
            rev.online = (rev.online || 0) + amount;
          }
          // Prepend to transactions list (max 20 shown)
          const transactions = [payment, ...state.transactions].slice(0, 20);
          return {
            metrics: { ...metrics, revenue: rev },
            transactions,
            realtimeUpdates: {
              lastEvent: 'new-payment',
              queueLength: state.realtimeUpdates.queueLength,
            },
          };
        }

        case 'queue-updated': {
          return {
            realtimeUpdates: {
              lastEvent: 'queue-updated',
              queueLength: queueLength ?? null,
            },
          };
        }

        default:
          return {};
      }
    });
  },

  /**
   * Resets all dashboard state. Called when navigating away from the dashboard.
   */
  reset: () =>
    set({
      metrics: null,
      chartData: null,
      comparisonData: null,
      transactions: [],
      doctors: [],
      realtimeUpdates: { lastEvent: null, queueLength: null },
    }),
}));

export default useDashboardStore;
