// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Validation Schemas — PulseMate Connect
//  Zod schemas for the enhanced dashboard query parameters
// ═════════════════════════════════════════════════════════════════════════════

const { z } = require('zod');

/**
 * ISO date string validator (YYYY-MM-DD or full ISO 8601).
 * Returns the value unchanged; coercion to Date happens in the controller/service.
 */
const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Must be a valid ISO date string (YYYY-MM-DD)');

/**
 * Enhanced Dashboard Query Schema
 * Used by: GET /api/dashboard/clinic/:id/enhanced
 *          GET /api/dashboard/clinic/:id/comparison
 *          GET /api/dashboard/clinic/:id/charts
 */
const enhancedDashboardQuerySchema = z
  .object({
    // Time period selector
    period: z
      .enum(['today', 'week', 'month', 'last7', 'last30', 'all', 'custom'])
      .optional()
      .default('month'),

    // Custom date range — required when period === 'custom', optional otherwise
    startDate: isoDateString.optional(),
    endDate: isoDateString.optional(),

    // Optional filters
    doctorId: z.string().uuid('doctorId must be a valid UUID').optional(),

    paymentMethod: z
      .enum(['ALL', 'CASH', 'ONLINE'])
      .optional()
      .default('ALL'),

    appointmentStatus: z
      .enum(['ALL', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
      .optional()
      .default('ALL'),
  })
  .superRefine((data, ctx) => {
    if (data.period === 'custom') {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'startDate is required when period is "custom"',
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDate is required when period is "custom"',
        });
      }
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end < start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate must not be before startDate',
          });
        }
        // Reject ranges exceeding 1 year
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        if (diffDays > 366) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'Date range must not exceed 1 year (366 days)',
          });
        }
      }
    }
  });

/**
 * Transactions Query Schema
 * Extends the base dashboard filters with pagination params.
 * Used by: GET /api/dashboard/clinic/:id/transactions
 */
const transactionsQuerySchema = enhancedDashboardQuerySchema.and(
  z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(1000).optional().default(20),
  })
);

/**
 * Widget Preferences Body Schema
 * Used by: PUT /api/dashboard/clinic/:id/widget-preferences
 */
const widgetPreferencesBodySchema = z.object({
  widgets: z
    .array(
      z.object({
        id: z.string().trim().min(1, 'Widget id is required'),
        visible: z.boolean(),
        order: z.number().int().min(0),
      })
    )
    .min(1, 'At least one widget entry is required'),
});

// ─── Middleware helpers ───────────────────────────────────────────────────────

/**
 * Validates req.query against the provided Zod schema.
 * On success sets req.query = parsed data and calls next().
 * On failure returns HTTP 400 with details.
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  req.query = result.data;
  next();
};

/**
 * Validates req.body against the provided Zod schema.
 * On success sets req.body = parsed data and calls next().
 * On failure returns HTTP 400 with details.
 */
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = {
  enhancedDashboardQuerySchema,
  transactionsQuerySchema,
  widgetPreferencesBodySchema,
  validateQuery,
  validateBody,
};
