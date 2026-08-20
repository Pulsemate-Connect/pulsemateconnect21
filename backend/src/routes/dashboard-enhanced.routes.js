// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Enhanced Routes — PulseMate Connect
//  Business-intelligence endpoints for clinic owners
// ═════════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();

const { authenticate, requireVerifiedAccount } = require('../middleware/auth.middleware');
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

// ─── All routes require authentication and verified account status ─────────────
router.use(authenticate, requireVerifiedAccount); // ✅ FIX: Require approved/verified account

// ─── Enhanced Dashboard Routes (all prefixed with /:clinicId) ─────────────────

// GET /:clinicId/enhanced — aggregate metrics for the selected period
router.get(
  '/:clinicId/enhanced',
  validateQuery(enhancedDashboardQuerySchema),
  cacheMiddleware(60),
  getEnhancedDashboard
);

// GET /:clinicId/comparison — current vs previous period deltas
router.get(
  '/:clinicId/comparison',
  validateQuery(enhancedDashboardQuerySchema),
  cacheMiddleware(60),
  getComparisonData
);

// GET /:clinicId/charts — all 8 chart data series
router.get(
  '/:clinicId/charts',
  validateQuery(enhancedDashboardQuerySchema),
  cacheMiddleware(60),
  getChartData
);

// GET /:clinicId/transactions — paginated payment list
router.get(
  '/:clinicId/transactions',
  validateQuery(transactionsQuerySchema),
  getTransactions
);

// GET /:clinicId/doctors — lightweight doctor list for filter dropdown
router.get(
  '/:clinicId/doctors',
  getDoctorList
);

// GET /:clinicId/widget-preferences — fetch saved widget config
router.get(
  '/:clinicId/widget-preferences',
  getWidgetPreferences
);

// PUT /:clinicId/widget-preferences — save widget config
router.put(
  '/:clinicId/widget-preferences',
  validateBody(widgetPreferencesBodySchema),
  saveWidgetPreferences
);

module.exports = router;
