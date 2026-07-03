# Implementation Plan: Clinic Owner Enhancements

## Overview

Implement the clinic owner dashboard enhancements across the Node.js/Express backend and React/Vite frontend. Work proceeds in dependency order: database migration first, then backend service/controller/routes, then frontend hooks, components, and finally integration and tests.

## Tasks

- [x] 1. Database migration — indexes and widget preference model
  - Add `DashboardWidgetPreference` model to `backend/prisma/schema.prisma` with `userId` (unique), `clinicId`, `widgets` (Json), `createdAt`, `updatedAt`, and relations to `User` and `Clinic`
  - Create migration SQL file at `backend/prisma/migrations/20260700000000_dashboard_enhancements/migration.sql` with: `CREATE INDEX IF NOT EXISTS idx_appointment_clinic_created ON "Appointment"("clinicId", "createdAt")`, `CREATE INDEX IF NOT EXISTS idx_payment_clinic_paid ON "Payment"("clinicId", "paidAt")`, and the `DashboardWidgetPreference` CREATE TABLE statement
  - Run `npx prisma generate` in `backend/` to regenerate the Prisma client
  - **Requirements: 10.11, 10.12**

- [x] 2. Backend service — dashboard query builders
  - Create `backend/src/services/dashboard-enhanced.service.js`
  - Implement `buildDateRange(period, startDate, endDate)` mapping period strings (`today`, `week`, `month`, `last7`, `last30`, `all`, `custom`) to Prisma `{ gte, lte }` objects
  - Implement `buildPreviousPeriodRange(period, startDate, endDate)` returning the equivalent prior period range
  - Implement `buildAppointmentWhere(clinicId, dateRange, filters)` and `buildPaymentWhere(clinicId, dateRange, filters)` Prisma where builders
  - Implement `calcPct(current, previous)` returning percentage change or `null` when previous is 0
  - Implement `getChartGranularity(startDate, endDate)` returning `'weekly'` for ranges >14 days, otherwise `'daily'`
  - **Requirements: 3.1, 3.6, 3.7, 3.8, 4.1, 4.2**

- [x] 3. Backend controller — enhanced metrics endpoint
  - Create `backend/src/controllers/dashboard-enhanced.controller.js` with `getEnhancedDashboard(req, res, next)`
  - Create `backend/src/validations/dashboard.validation.js` with Zod schemas for all query params (period enum, date strings, optional doctorId, paymentMethod enum, appointmentStatus enum)
  - Accept query params: `period`, `startDate`, `endDate`, `doctorId`, `paymentMethod`, `appointmentStatus`; validate with Zod; verify clinic ownership
  - Use `prisma.$transaction` for parallel queries covering patient stats (total/new/returning), appointment stats (total/completed/cancelled/noShow/completionRate/avgDuration/avgWaitTime/avgDaily/peakHour), revenue stats (total/cash/online/avgPerAppointment/monthGrowth), staff stats (active/totalDoctors/totalReceptionists/utilizationRate), and week patient growth
  - Select only required fields in all Prisma queries; return structured metrics response with `filteredCount`
  - **Requirements: 1.1–1.20, 10.18, 10.19**

- [x] 4. Backend controller — comparison data endpoint
  - Add `getComparisonData(req, res, next)` to `dashboard-enhanced.controller.js`
  - Use `buildPreviousPeriodRange` to get current and previous period date ranges
  - Query both periods for: revenue, patient count, appointment count, completion rate, avg revenue per appointment — all using completed appointments only
  - Calculate delta and percentage for each metric; return `noPreviousData: true` when previous period is empty
  - Return `{ comparison: { revenue, patients, appointments, completionRate, avgRevPerAppt, period, label } }`
  - **Requirements: 3.1–3.17**

- [x] 5. Backend controller — chart data endpoint
  - Add `getChartData(req, res, next)` to `dashboard-enhanced.controller.js`
  - Determine granularity via `getChartGranularity`; query and return all 8 chart series: `revenueTrend` (daily/weekly), `appointmentTrend`, `paymentBreakdown` (cash/online), `appointmentStatus` (completed/cancelled/noShow), `doctorPerformance` (per-doctor appointments + revenue), `patientDemographics` (age groups: <18/18-30/31-45/46-60/60+), `peakHours` (by hour 0–23), `dayOfWeek` (Mon–Sun)
  - Include `granularity` field (`'daily'` or `'weekly'`) in response
  - **Requirements: 2.1–2.17**

- [x] 6. Backend controller — transactions, doctors, and widget preference endpoints
  - Add `getTransactions(req, res, next)` — paginated (`?page=1&limit=20`), max 1000 rows, include `truncated: true` when total exceeds 1000
  - Add `getDoctorList(req, res, next)` — returns `[{ id, name }]` for the filter dropdown
  - Add `getWidgetPreferences(req, res, next)` — reads `DashboardWidgetPreference` for `req.user.id`; returns default config if none saved
  - Add `saveWidgetPreferences(req, res, next)` — validates at least 1 widget has `visible: true` (HTTP 400 otherwise); upserts record for `req.user.id`
  - **Requirements: 6.21, 7.9–7.11, 7.18**

- [x] 7. Backend routes and server registration
  - Create `backend/src/routes/dashboard-enhanced.routes.js` with GET/PUT routes for all 7 endpoints; apply `auth` middleware and `cacheMiddleware(60)` on `enhanced`, `comparison`, and `charts` routes
  - Register the route file in `backend/src/server.js` at path `/api/dashboard`
  - **Requirements: 10.13, 10.14**

- [x] 8. Socket.io — emit new events from existing controllers
  - In the appointment creation controller, emit `clinic:updated` with `{ type: 'new-appointment', appointment }` to room `clinic:${clinicId}` after successful save
  - In the appointment status update controller, when status changes to `COMPLETED`, emit `clinic:updated` with `{ type: 'appointment-completed', appointmentId, completionRate }`
  - In the payment controller after a PAID payment is recorded, emit `clinic:updated` with `{ type: 'new-payment', payment: { id, amount, method, paidAt } }`
  - In the queue controller after position changes, emit `clinic:updated` with `{ type: 'queue-updated', queueLength }`
  - Export `io` instance from `backend/src/server.js` as a module singleton so controllers can import without circular dependencies
  - **Requirements: 8.1–8.14**

- [x] 9. Frontend dependencies and API layer
  - Add to `frontend/package.json` dependencies: `recharts@^2.12.0`, `jspdf@^2.5.1`, `jspdf-autotable@^3.8.2`, `html2canvas@^1.4.1`, `xlsx@^0.18.5`, `@hello-pangea/dnd@^1.1.0`, `date-fns@^3.6.0`
  - Create `frontend/src/api/dashboard.api.js` with functions: `getEnhancedDashboard(clinicId, filters)`, `getComparisonData(clinicId, filters)`, `getChartData(clinicId, filters)`, `getTransactions(clinicId, filters, page, limit)`, `getDoctorList(clinicId)`, `getWidgetPreferences(clinicId)`, `saveWidgetPreferences(clinicId, widgets)` — each serialises filters as query params and uses the existing axios instance
  - **Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 7.9**

- [x] 10. Frontend hook — `useDashboardFilters`
  - Create `frontend/src/hooks/useDashboardFilters.js`
  - Initialise state from `localStorage` key `dashboard-filters-${clinicId}` wrapped in try/catch; fall back to defaults on any parse or validation error
  - Implement `setFilter(key, value)` persisting to localStorage; `clearAll()` resetting to defaults and clearing storage
  - Validate date ranges: reject end date before start date; reject ranges exceeding 1 year; return `error` string for invalid states
  - Return `{ filters, setFilter, clearAll, isActive, activeCount, error }`
  - **Requirements: 4.1–4.18**

- [x] 11. Frontend hook — `useDashboardData`
  - Create `frontend/src/hooks/useDashboardData.js`
  - Implement module-level `Map` cache with 30s TTL keyed by `${clinicId}:${JSON.stringify(filters)}`
  - Debounce filter changes by 500ms before triggering fetch; on cache miss call `getEnhancedDashboard`, `getComparisonData`, and `getChartData` in parallel via `Promise.all`
  - Start a 3000ms timer on fetch start; if response hasn't arrived, call `toast('Dashboard is taking longer than expected')`
  - Return `{ data, chartData, comparisonData, loading, error, refetch }`
  - **Requirements: 10.1, 10.4, 10.5, 10.17**

- [x] 12. Frontend hook — `useDashboardSocket`
  - Create `frontend/src/hooks/useDashboardSocket.js`
  - On mount, connect `socket.io-client` with JWT auth token from `authStore`; on `connect` emit `clinic:join` and set `connected: true`
  - Listen for `clinic:updated` events; gate updates against active filters (skip if event's doctorId doesn't match active doctor filter); dispatch to `onNewAppointment`, `onAppointmentCompleted`, `onNewPayment`, `onQueueUpdated` callbacks — wrap appointment/payment/queue callbacks in `lodash.throttle` at 5000ms
  - Set `reconnecting: true` on `disconnect`, `reconnecting: false` on `reconnect`; disconnect socket on unmount
  - Return `{ connected, reconnecting }`
  - **Requirements: 8.1–8.22**

- [x] 13. Frontend hook — `useAlertEngine`
  - Create `frontend/src/hooks/useAlertEngine.js`
  - Implement all 11 alert rules inside `useMemo`: revenue drop >20% → HIGH, cancellation rate >15% → MEDIUM, no-show rate >10% → MEDIUM, avg wait >30min → HIGH, completion rate <75% → MEDIUM, inactive doctor this week → LOW, revenue growth >25% → POSITIVE, patient growth >30% → POSITIVE, no active doctors today → HIGH
  - Filter out dismissed alert IDs (stored in localStorage with timestamp; 24h TTL); sort by severity rank HIGH(0)/MEDIUM(1)/LOW(2)/POSITIVE(3); slice to 5
  - Return `{ alerts, dismiss(id) }` where `dismiss` writes to localStorage
  - **Requirements: 5.1–5.20**

- [x] 14. Frontend hook — `useWidgetPreferences`
  - Create `frontend/src/hooks/useWidgetPreferences.js` with `DEFAULT_WIDGET_CONFIG` constant (10 widgets, all `visible: true`)
  - On mount call `getWidgetPreferences(clinicId)` and merge with defaults so any new widgets default to visible
  - Implement `save(updatedWidgets)` calling `saveWidgetPreferences`; on success `toast.success`; on failure `toast.error` without updating local state
  - Implement `reset()` setting local state to defaults without persisting; `isVisible(id)` helper
  - Return `{ widgets, saving, isVisible, save, reset }`
  - **Requirements: 7.1–7.20**

- [x] 15. Frontend hook — `useExportService`
  - Create `frontend/src/hooks/useExportService.js`
  - Implement `exportPDF(clinicInfo, filters, data, chartRefs)` — dynamically import `jspdf` and `jspdf-autotable`; build PDF with clinic header (name/address), report date, filter summary, metrics table, revenue breakdown, appointment stats, transactions (max 1000 with truncation warning), chart images from `html2canvas(chartRef.current)`; format all currency as INR via `Intl.NumberFormat`; format dates as DD-MM-YYYY; trigger download
  - Implement `exportExcel(filters, data)` — dynamically import `xlsx`; build workbook with 4 sheets: Summary, Revenue, Appointments, Transactions (max 1000); trigger download
  - Set `exporting: true` at start and `false` in finally; on catch call `toast.error('Export failed. Please try again.')`
  - Return `{ exporting, exportPDF, exportExcel }`
  - **Requirements: 6.1–6.21**

- [x] 16. `MetricCard` component
  - Create `frontend/src/components/dashboard/MetricCard.jsx` wrapped in `React.memo`
  - Accept props: `icon`, `label`, `value`, `unit`, `comparison`; render skeleton (`animate-pulse` gray div) when `value === undefined`
  - When `comparison` is provided render colored badge: green + up arrow (positive), red + down arrow (negative), gray (zero); render "No previous data" when `comparison === null`; render "vs. last [period]" label
  - Use responsive font sizes (`text-sm sm:text-xl`); minimum 44×44px touch target
  - Animate value changes: on `value` prop change add `ring-2 ring-blue-400` class for 600ms then remove (for real-time highlight)
  - **Requirements: 1.19, 1.20, 3.3–3.5, 3.13, 3.14, 8.20, 9.9, 10.6**

- [x] 17. Chart components
  - Create all 8 chart files in `frontend/src/components/dashboard/charts/`: `RevenueTrendChart.jsx` (LineChart, granularity-aware X-axis), `AppointmentTrendChart.jsx` (LineChart), `PaymentBreakdownPie.jsx` (PieChart, Cash/Online), `AppointmentStatusPie.jsx` (PieChart, 3 slices), `DoctorPerformanceBar.jsx` (BarChart grouped), `PatientDemographicsBar.jsx` (BarChart), `PeakHoursHeatmap.jsx` (BarChart intensity-fill), `DayOfWeekBar.jsx` (BarChart Mon–Sun)
  - All charts: `ResponsiveContainer width="100%" height={260}`; brand color `#2563EB`; `loading` prop renders skeleton; `empty` prop renders empty state with icon; custom tooltip with formatted values; hide legend on mobile (pass `isMobile` prop)
  - Wrap each chart in `React.lazy` + `<Suspense fallback={<ChartSkeleton />}>` for lazy loading below the fold
  - **Requirements: 2.1–2.17, 9.4, 9.12, 10.3**

- [x] 18. `DashboardFilterBar` and `DashboardFilterDrawer` components
  - Create `frontend/src/components/dashboard/DashboardFilterBar.jsx` — period quick-select buttons, custom date range pickers (end-before-start disabled, >1 year rejected), doctor dropdown, payment method select, appointment status select; active filter badges with `×` remove buttons; "Clear All" when `activeCount > 0`; loading indicator while refetching; result count display
  - Create `frontend/src/components/dashboard/DashboardFilterDrawer.jsx` — mobile slide-out fixed drawer with the same controls, toggled by a "Filters" button with active count badge; visible only at `< sm` breakpoint
  - **Requirements: 4.1–4.19, 9.5, 9.6**

- [x] 19. `AlertsInsightsWidget` component
  - Create `frontend/src/components/dashboard/AlertsInsightsWidget.jsx`
  - Render up to 5 alerts as cards with colored left border by severity (red/orange/yellow/green); each card shows icon, title, description, suggested action, "View Details" link, and "×" dismiss button calling `onDismiss(alert.id)`
  - When `alerts.length === 0`, render "All Good" empty state with green checkmark and positive message
  - On mobile render as vertical stacked list (`flex-col`)
  - **Requirements: 5.2, 5.12–5.19, 9.13**

- [x] 20. `WidgetCustomizerModal` component
  - Create `frontend/src/components/dashboard/WidgetCustomizerModal.jsx`
  - Render modal overlay with list of 10 widgets; each row has checkbox, label, description, and preview thumbnail
  - Integrate `@hello-pangea/dnd` `DragDropContext` + `Droppable` + `Draggable` for drag-and-drop reorder; update local order state on drag end
  - Disable Save button when all checkboxes are unchecked; show tooltip explaining constraint
  - Wire Save (with loading spinner when `saving`), Cancel, Reset to Default buttons; modal scrollable on mobile with `max-h-[90vh] overflow-y-auto`
  - **Requirements: 7.1–7.20, 9.8**

- [x] 21. `RecentTransactionsTable` component
  - Create `frontend/src/components/dashboard/RecentTransactionsTable.jsx`
  - Render table with columns: Patient, Doctor, Method (Cash/Online badge), Amount (INR formatted), Time; loading state shows 5 skeleton rows
  - Implement pagination controls (prev/next, page indicator); call `onPageChange` on navigation
  - Mobile: `overflow-x-auto` wrapper with `whitespace-nowrap` cells and sticky first column
  - Prefetch next page when user scrolls to 80% of table container height
  - **Requirements: 6.10, 9.10, 10.8, 10.9, 10.20**

- [x] 22. `ConnectionStatusBadge` and `ExportButton` components
  - Create `frontend/src/components/dashboard/ConnectionStatusBadge.jsx` — green dot "Connected" / amber pulsing "Reconnecting..." / red "Disconnected" based on `connected` and `reconnecting` props
  - Create `frontend/src/components/dashboard/ExportButton.jsx` — dropdown with "Export as PDF" and "Export as Excel" options; shows spinner + "Generating report..." when `exporting`; on mobile renders as icon-only `📥` button with same dropdown
  - **Requirements: 6.1, 6.2, 6.16–6.18, 8.15–8.17, 9.7**

- [x] 23. `dashboardStore` Zustand store
  - Create `frontend/src/store/dashboardStore.js` with Zustand slices for `metrics`, `chartData`, `comparisonData`, `transactions`, `doctors`, `realtimeUpdates`
  - Implement `applyRealtimeUpdate(event)` action handling: `new-appointment` (increment count), `appointment-completed` (increment completed, recalculate rate), `new-payment` (update revenue totals, prepend transaction), `queue-updated` (update queue length)
  - Implement `reset()` to clear all state on navigation away
  - **Requirements: 8.3–8.14**

- [x] 24. Refactor `OwnerDashboard.jsx`
  - Replace all direct API calls and local state in `frontend/src/pages/owner/OwnerDashboard.jsx` with the new hooks: `useDashboardFilters`, `useDashboardData`, `useDashboardSocket`, `useAlertEngine`, `useWidgetPreferences`, `useExportService`
  - Render `DashboardHeader` section with `ConnectionStatusBadge`, `ExportButton`, "Customize Dashboard" button; render `DashboardFilterBar` (desktop) / `DashboardFilterDrawer` (mobile)
  - Render widgets in sorted order from `useWidgetPreferences`, skipping non-visible widgets; apply `transition-all duration-300` for show/hide animations; wrap each widget in `<ErrorBoundary>` with "Widget failed to load" fallback
  - Use responsive grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for metric cards; keep existing `StatusBanner` and non-VERIFIED guard intact
  - Log performance metrics on load: record `performance.now()` diff from mount to data render; emit to console or analytics; suppress dashboard content (not the whole page) when data errors occur
  - **Requirements: 1.1–1.20, 9.1–9.16, 10.1, 10.2, 10.15, 10.16**

- [x] 25. Backend unit tests for enhanced dashboard
  - Create `backend/src/__tests__/controllers/dashboard-enhanced.controller.test.js` covering: `getEnhancedDashboard` returns correct aggregated metrics for each filter combination; `getComparisonData` maps period strings to correct previous ranges and correct percentage calculations; `getChartData` returns `granularity: 'weekly'` when range >14 days; `getTransactions` paginates and enforces 1000-row max with `truncated: true`; `saveWidgetPreferences` returns HTTP 400 when all widgets have `visible: false`
  - Create `backend/src/__tests__/unit/dashboard-enhanced.service.test.js` covering: `buildDateRange` for all 7 period values; `buildPreviousPeriodRange` for today/week/month; `calcPct` edge cases (zero previous, null); `getChartGranularity` at exactly 14 days boundary
  - **Requirements: 10.11–10.14**

- [ ] 26. Frontend unit tests for hooks and components
  - Add tests for `useAlertEngine` — all 11 alert rules fire at their exact thresholds; dismissed alerts filtered out; only top 5 by severity returned
  - Add tests for `useDashboardFilters` — localStorage persistence across re-renders; corrupted localStorage falls back to defaults; date range validation rejects end-before-start and ranges >1 year
  - Add tests for `MetricCard` — renders skeleton when `value === undefined`; comparison badge shows correct color/direction; renders "No previous data" when `comparison` is null
  - Add tests for `AlertsInsightsWidget` — "All Good" state when `alerts` is empty; dismiss button calls `onDismiss` with correct id
  - **Requirements: 5.1–5.20, 4.13, 4.14, 1.19, 1.20**

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4, 5, 6] },
    { "wave": 5, "tasks": [7] },
    { "wave": 6, "tasks": [8] },
    { "wave": 7, "tasks": [9] },
    { "wave": 8, "tasks": [10, 11, 12, 13, 14, 15] },
    { "wave": 9, "tasks": [16, 17, 18, 19, 20, 21, 22, 23] },
    { "wave": 10, "tasks": [24] },
    { "wave": 11, "tasks": [25, 26] }
  ]
}
```

## Notes

- Tasks 3–6 all add functions to the same `dashboard-enhanced.controller.js` file — implement them sequentially.
- Tasks 10–15 (hooks) can be developed in parallel once Task 9 (API layer) is complete, as they have no inter-hook dependencies.
- Tasks 16–23 (components and store) can also be developed in parallel once the hooks are in place.
- The existing `OwnerDashboard.jsx` should not be modified until Task 24 — all prior tasks create new files or extend existing backend files.
- `jspdf`, `xlsx`, and `html2canvas` are loaded with dynamic `import()` inside `useExportService` — do not add them as top-level imports.
