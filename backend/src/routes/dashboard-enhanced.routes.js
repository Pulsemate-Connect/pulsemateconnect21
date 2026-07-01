// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Enhanced Routes — PulseMate Connect
//  Business-intelligence endpoints for clinic owners
// ═════════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { cache: cacheMiddleware } = require('../middleware/cache.middleware');
const {
  getEnhancedDashboard,
  getComparisonData,
  getChartData,
  getTransactions,
  getDoctorList,
  getWidgetPreferences,
  saveWidgetPreferences,
} = require('../controllers/dashboard-enhanced.controller');
const {
  validateQuery,
  validateBody,
  enhancedDashboardQuerySchema,
  transactionsQuerySchema,
  widgetPreferencesBodySchema,
} = require('../validations/dashboard.validation');

// ─── Enhanced Dashboard Routes (all prefixed with /:clinicId) ─────────────────

// GET /:clinicId/enhanced — aggregate metrics for the selected period
router.get(
  '/:clinicId/enhanced',
  authenticate,
  validateQuery(enhancedDashboardQuerySchema),
  cacheMiddleware(60),
  getEnhancedDashboard
);

// GET /:clinicId/comparison — current vs previous period deltas
router.get(
  '/:clinicId/comparison',
  authenticate,
  validateQuery(enhancedDashboardQuerySchema),
  cacheMiddleware(60),
  getComparisonData
);

// GET /:clinicId/charts — all 8 chart data series
router.get(
  '/:clinicId/charts',
  authenticate,
  validateQuery(enhancedDashboardQuerySchema),
  cacheMiddleware(60),
  getChartData
);

// GET /:clinicId/transactions — paginated payment list
router.get(
  '/:clinicId/transactions',
  authenticate,
  validateQuery(transactionsQuerySchema),
  getTransactions
);

// GET /:clinicId/doctors — lightweight doctor list for filter dropdown
router.get(
  '/:clinicId/doctors',
  authenticate,
  getDoctorList
);

// GET /:clinicId/widget-preferences — fetch saved widget config
router.get(
  '/:clinicId/widget-preferences',
  authenticate,
  getWidgetPreferences
);

// PUT /:clinicId/widget-preferences — save widget config
router.put(
  '/:clinicId/widget-preferences',
  authenticate,
  validateBody(widgetPreferencesBodySchema),
  saveWidgetPreferences
);

module.exports = router;
