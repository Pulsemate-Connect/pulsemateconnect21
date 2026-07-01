import api from './axios';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Converts a filter object to a clean params object for axios.
 * Skips null, undefined, empty string, and 'ALL' values.
 */
function filtersToParams(filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '' && value !== 'ALL') {
      params[key] = value;
    }
  }
  return params;
}

// ─── Enhanced dashboard endpoints ────────────────────────────────────────────

/**
 * GET /api/dashboard/:clinicId/enhanced
 * Returns aggregate metrics for the selected period and filters.
 */
export const getEnhancedDashboard = (clinicId, filters = {}) =>
  api.get(`/dashboard/${clinicId}/enhanced`, { params: filtersToParams(filters) });

/**
 * GET /api/dashboard/:clinicId/comparison
 * Returns period-over-period comparison metrics.
 */
export const getComparisonData = (clinicId, filters = {}) =>
  api.get(`/dashboard/${clinicId}/comparison`, { params: filtersToParams(filters) });

/**
 * GET /api/dashboard/:clinicId/charts
 * Returns all 8 chart data series plus granularity.
 */
export const getChartData = (clinicId, filters = {}) =>
  api.get(`/dashboard/${clinicId}/charts`, { params: filtersToParams(filters) });

/**
 * GET /api/dashboard/:clinicId/transactions
 * Returns a paginated list of PAID payments.
 */
export const getTransactions = (clinicId, filters = {}, page = 1, limit = 20) =>
  api.get(`/dashboard/${clinicId}/transactions`, {
    params: { ...filtersToParams(filters), page, limit },
  });

/**
 * GET /api/dashboard/:clinicId/doctors
 * Returns lightweight doctor list for the filter dropdown.
 */
export const getDoctorList = (clinicId) =>
  api.get(`/dashboard/${clinicId}/doctors`);

/**
 * GET /api/dashboard/:clinicId/widget-preferences
 * Returns saved widget configuration for the authenticated user.
 */
export const getWidgetPreferences = (clinicId) =>
  api.get(`/dashboard/${clinicId}/widget-preferences`);

/**
 * PUT /api/dashboard/:clinicId/widget-preferences
 * Saves widget configuration for the authenticated user.
 */
export const saveWidgetPreferences = (clinicId, widgets) =>
  api.put(`/dashboard/${clinicId}/widget-preferences`, { widgets });
