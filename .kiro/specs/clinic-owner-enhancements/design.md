# Design Document — Clinic Owner Enhancements

## Overview

This document describes the technical design for transforming the PulseMate Connect clinic owner dashboard into a comprehensive business intelligence tool. The implementation spans the **React + Vite frontend** (`frontend/src/`) and the **Node.js / Express / Prisma backend** (`backend/src/`). Socket.io, Redis, and PostgreSQL are already in place; this feature builds on them.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 18 + Vite)                     │
│                                                                      │
│  OwnerDashboard.jsx (enhanced)                                       │
│  ├── DashboardFilterBar        (Requirement 4)                       │
│  ├── AlertsInsightsWidget      (Requirement 5)                       │
│  ├── MetricsSection            (Requirements 1 & 3)                  │
│  │   └── MetricCard × N        (memoised)                           │
│  ├── ChartsSection             (Requirement 2)                       │
│  │   ├── RevenueTrendChart                                           │
│  │   ├── AppointmentTrendChart                                       │
│  │   ├── PaymentBreakdownPie                                         │
│  │   ├── AppointmentStatusPie                                        │
│  │   ├── DoctorPerformanceBar                                        │
│  │   ├── PatientDemographicsBar                                      │
│  │   ├── PeakHoursHeatmap                                            │
│  │   └── DayOfWeekBar                                                │
│  ├── RecentTransactionsTable   (paginated, virtual scroll)           │
│  ├── WidgetCustomizerModal     (Requirement 7)                       │
│  └── RealTimeSyncProvider      (Requirement 8)                       │
│                                                                      │
│  Hooks:                                                              │
│  ├── useDashboardData          (fetching + 30s cache)                │
│  ├── useDashboardFilters       (state + localStorage)                │
│  ├── useDashboardSocket        (Socket.io events)                    │
│  ├── useWidgetPreferences      (CRUD + backend sync)                 │
│  ├── useAlertEngine            (derived alerts)                      │
│  └── useExportService          (jsPDF + xlsx)                        │
│                                                                      │
│  State: Zustand dashboardStore                                       │
└────────────────────────┬─────────────────────────────────────────────┘
                         │  REST (axios) + Socket.io-client
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND  (Express + Prisma)                       │
│                                                                      │
│  Routes                                                              │
│  ├── GET  /api/dashboard/clinic/:id/enhanced           (main)        │
│  ├── GET  /api/dashboard/clinic/:id/comparison         (Req 3)       │
│  ├── GET  /api/dashboard/clinic/:id/charts             (Req 2)       │
│  ├── GET  /api/dashboard/clinic/:id/transactions       (Req 6)       │
│  ├── GET  /api/dashboard/clinic/:id/doctors            (filter drop) │
│  ├── GET  /api/dashboard/clinic/:id/widget-preferences (Req 7)       │
│  └── PUT  /api/dashboard/clinic/:id/widget-preferences (Req 7)       │
│                                                                      │
│  Controllers → Services → Prisma → PostgreSQL                        │
│                                                                      │
│  Redis cache (60s TTL for aggregate queries)                         │
│  Socket.io rooms: "clinic-{id}" for real-time push                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### New Prisma Model: DashboardWidgetPreference

```prisma
model DashboardWidgetPreference {
  id        String   @id @default(uuid())
  userId    String   @unique
  clinicId  String
  widgets   Json     // Array of { id, visible, order }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  clinic Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([clinicId])
}
```

### New Database Indexes (migration)

```sql
-- Requirement 10.11 & 10.12
CREATE INDEX IF NOT EXISTS idx_appointment_clinic_created
  ON "Appointment"("clinicId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_payment_clinic_paid
  ON "Payment"("clinicId", "paidAt");
```

### Widget Preferences JSON Schema

```json
[
  { "id": "revenue-metrics",       "visible": true,  "order": 0 },
  { "id": "patient-metrics",       "visible": true,  "order": 1 },
  { "id": "appointment-metrics",   "visible": true,  "order": 2 },
  { "id": "staff-metrics",         "visible": true,  "order": 3 },
  { "id": "alerts-insights",       "visible": true,  "order": 4 },
  { "id": "revenue-chart",         "visible": true,  "order": 5 },
  { "id": "appointment-chart",     "visible": true,  "order": 6 },
  { "id": "revenue-by-doctor",     "visible": true,  "order": 7 },
  { "id": "recent-transactions",   "visible": true,  "order": 8 },
  { "id": "quick-actions",         "visible": true,  "order": 9 }
]
```

### Filter State Shape

```typescript
interface DashboardFilters {
  period: 'today' | 'week' | 'month' | 'last7' | 'last30' | 'all' | 'custom';
  startDate: string | null;   // ISO date string
  endDate: string | null;
  doctorId: string | null;
  paymentMethod: 'ALL' | 'CASH' | 'ONLINE';
  appointmentStatus: 'ALL' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}
```

---

## Component Design

### 1. `OwnerDashboard.jsx` (enhanced)

The existing file is refactored into a composition root. It renders:

1. `DashboardHeader` — title, Export button, Customize Dashboard button, connection status badge
2. `DashboardFilterBar` — period quick-select, date picker, doctor/payment/status dropdowns, active filter badges
3. `AlertsInsightsWidget` (if visible)
4. Widget grid composed from sorted, visible widget list from `useWidgetPreferences`
5. `WidgetCustomizerModal` (conditionally rendered)

All data fetching moves into custom hooks. The component itself only handles layout and conditional rendering.

### 2. `MetricCard` Component

```jsx
// frontend/src/components/dashboard/MetricCard.jsx
// React.memo — only re-renders when value, label, or comparison changes
const MetricCard = React.memo(({ icon, label, value, unit, comparison }) => { ... });
```

Props:
- `icon` — Emoji or SVG icon
- `label` — Display name
- `value` — Numeric or string value
- `unit` — Optional suffix (e.g. "mins", "%")
- `comparison` — `{ delta: number, pct: number, period: string }` — rendered as colored badge

Skeleton state: rendered when `value === undefined`.

### 3. Chart Components

All charts live in `frontend/src/components/dashboard/charts/`. Each is a thin wrapper around a Recharts primitive:

| Component | Chart Type | Key Props |
|---|---|---|
| `RevenueTrendChart` | `LineChart` | `data`, `granularity: 'daily' \| 'weekly'` |
| `AppointmentTrendChart` | `LineChart` | `data` |
| `PaymentBreakdownPie` | `PieChart` | `cash`, `online` |
| `AppointmentStatusPie` | `PieChart` | `completed`, `cancelled`, `noShow` |
| `DoctorPerformanceBar` | `BarChart` | `data: [{doctor, appointments, revenue}]` |
| `PatientDemographicsBar` | `BarChart` | `data: [{ageGroup, count}]` |
| `PeakHoursHeatmap` | `BarChart` (styled) | `data: [{hour, count}]` |
| `DayOfWeekBar` | `BarChart` | `data: [{day, count}]` |

All charts:
- Use `ResponsiveContainer width="100%" height={260}` for responsiveness
- Receive a `loading` prop to render skeleton
- Receive a `empty` prop to render empty state
- Use brand color `#2563EB` (Tailwind `blue-600`) as primary
- Hide legend on mobile via `window.innerWidth < 768` check passed as prop

### 4. `DashboardFilterBar` Component

```
[ Today | This Week | This Month | Last 7D | Last 30D | All Time ]  [ Date Range ]
[ Doctor ▾ ]  [ Payment ▾ ]  [ Status ▾ ]                           [ Clear All ] (N active)
```

- Active filters rendered as `×` dismissible badges below the bar
- Collapsed into a slide-out drawer (`<DashboardFilterDrawer>`) on mobile
- A "Filters" button with badge count opens the drawer on mobile
- Filter state managed by `useDashboardFilters` hook with 500ms debounce + localStorage persistence

### 5. `AlertsInsightsWidget` Component

Reads pre-computed alerts from `useAlertEngine` hook. Renders up to 5 alerts as cards with:
- Colored left border by severity (red/orange/yellow/green)
- Icon + title + description + suggested action
- "View Details" link
- "×" dismiss button (stores dismissed IDs with 24h TTL in localStorage)

"All Good" empty state shown when no active alerts.

### 6. `WidgetCustomizerModal` Component

Modal with:
- List of all 10 widgets with checkbox + preview thumbnail + description
- Drag-and-drop reorder via `@hello-pangea/dnd` (already in ecosystem, or `react-beautiful-dnd`)
- Save / Cancel / Reset to Default buttons
- Minimum 1 widget must remain checked (Save disabled otherwise)
- Animated widget transitions in the main dashboard on apply via Tailwind `transition-all`

### 7. `RecentTransactionsTable` Component

- 20 rows per page with pagination controls
- Virtual scroll via `RecyclerListView` pattern for >100 rows
- Horizontal scroll on mobile with sticky first column
- Prefetch next page at 80% scroll depth

---

## Hook Design

### `useDashboardData(clinicId, filters)`

```javascript
// frontend/src/hooks/useDashboardData.js
// Manages fetching, 30s in-memory cache, debounced refetch on filter change
const cache = new Map(); // key: `${clinicId}:${JSON.stringify(filters)}`

export function useDashboardData(clinicId, filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    // Check 30s cache
    // If stale, fetch /api/dashboard/clinic/:id/enhanced
    // and /api/dashboard/clinic/:id/charts in parallel
  }, [clinicId, debouncedFilters]);

  return { data, loading, error, refetch };
}
```

### `useDashboardFilters()`

```javascript
// Reads initial state from localStorage key 'dashboard-filters-{clinicId}'
// Writes on every change
// Validates date range: end >= start, range <= 1 year
export function useDashboardFilters(clinicId) {
  const [filters, setFilters] = useState(() => loadFromStorage(clinicId));

  const setFilter = (key, value) => { ... };
  const clearAll  = () => { ... };
  const isActive  = filters.period !== 'today' || filters.doctorId || ...;

  return { filters, setFilter, clearAll, isActive, activeCount };
}
```

### `useDashboardSocket(clinicId, onEvent)`

```javascript
// frontend/src/hooks/useDashboardSocket.js
export function useDashboardSocket(clinicId, { onNewAppointment, onAppointmentCompleted,
                                               onNewPayment, onQueueUpdated }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket'] });

    socket.on('connect', () => { socket.emit('clinic:join', { clinicId }); setConnected(true); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('new-appointment', throttle(onNewAppointment, 5000));
    socket.on('appointment-completed', onAppointmentCompleted);
    socket.on('new-payment', throttle(onNewPayment, 5000));
    socket.on('queue-updated', throttle(onQueueUpdated, 5000));

    return () => socket.disconnect();
  }, [clinicId]);

  return { connected };
}
```

Throttle uses `lodash.throttle` (already a dependency). Reconnection uses Socket.io's built-in `reconnectionDelay` + `reconnectionDelayMax` (exponential backoff).

### `useAlertEngine(dashboardData, filters)`

Pure derivation — no API call. Runs synchronously on data change:

```javascript
export function useAlertEngine(data) {
  return useMemo(() => {
    const alerts = [];
    if (!data) return alerts;

    // Revenue drop > 20%
    if (data.comparison?.revenue?.pct < -20)
      alerts.push({ id:'revenue-drop', severity:'HIGH', ... });

    // Cancellation rate > 15%
    if (data.metrics.cancellationRate > 15)
      alerts.push({ id:'high-cancellation', severity:'MEDIUM', ... });

    // ... all 11 alert rules

    return alerts
      .filter(a => !isDismissed(a.id))
      .sort(bySeverityRank)
      .slice(0, 5);
  }, [data]);
}
```

### `useExportService(clinicId, filters, dashboardData)`

```javascript
export function useExportService(clinicId, filters, data) {
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    setExporting(true);
    const { jsPDF } = await import('jspdf');         // dynamic import — lazy
    const autoTable  = (await import('jspdf-autotable')).default;
    // Build PDF: header (clinic logo/name/address), filter summary,
    // metrics table, revenue breakdown, transactions (max 1000),
    // chart images (canvas capture via html2canvas)
    // Trigger download
    setExporting(false);
  };

  const exportExcel = async () => {
    setExporting(true);
    const XLSX = await import('xlsx');               // dynamic import — lazy
    // Build workbook with sheets: Summary, Revenue, Appointments, Transactions
    // Trigger download
    setExporting(false);
  };

  return { exporting, exportPDF, exportExcel };
}
```

Both `jspdf` and `xlsx` are loaded lazily to keep initial bundle size down.

### `useWidgetPreferences(clinicId)`

```javascript
export function useWidgetPreferences(clinicId) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGET_CONFIG);
  const [saving, setSaving] = useState(false);

  // Load from backend on mount
  // Provide: save(updatedWidgets), reset(), isVisible(widgetId)
}
```

---

## Backend Design

### New Route File: `dashboard-enhanced.routes.js`

```javascript
// backend/src/routes/dashboard-enhanced.routes.js
router.get('/:clinicId/enhanced',           auth, clinicOwnerGuard, cacheMiddleware(60), getEnhancedDashboard);
router.get('/:clinicId/comparison',         auth, clinicOwnerGuard, cacheMiddleware(60), getComparisonData);
router.get('/:clinicId/charts',             auth, clinicOwnerGuard, cacheMiddleware(60), getChartData);
router.get('/:clinicId/transactions',       auth, clinicOwnerGuard, getTransactions);
router.get('/:clinicId/doctors',            auth, clinicOwnerGuard, getDoctorList);
router.get('/:clinicId/widget-preferences', auth, clinicOwnerGuard, getWidgetPreferences);
router.put('/:clinicId/widget-preferences', auth, clinicOwnerGuard, saveWidgetPreferences);
```

All routes are mounted at `/api/dashboard` in `server.js`.

### `dashboard-enhanced.controller.js`

#### `getEnhancedDashboard(req, res)`

Accepts query params: `startDate`, `endDate`, `period`, `doctorId`, `paymentMethod`, `appointmentStatus`.

Builds a `DateRange` from the period/custom dates, then runs parallel Prisma queries using `prisma.$transaction([...])` for consistency:

```javascript
const [
  patientStats,      // total, new, returning
  appointmentStats,  // total, completed, cancelled, noShow, completionRate
  revenueStats,      // total, cash, online, avgPerAppointment
  staffStats,        // activeStaff, totalDoctors, totalReceptionists, utilizationRate
  performanceStats,  // avgDuration, avgWaitTime, peakHour, avgDailyCount, monthGrowth, weekPatientGrowth
] = await prisma.$transaction([...]);
```

Select only required fields (`select: { id: true, ... }`) per Requirement 10.18.

Response shape:
```json
{
  "metrics": {
    "patients": { "total": 0, "new": 0, "returning": 0 },
    "appointments": { "total": 0, "completed": 0, "cancelled": 0, "noShow": 0, "completionRate": 0, "avgDuration": 0, "avgWaitTime": 0, "avgDaily": 0, "peakHour": "10:00" },
    "revenue": { "total": 0, "cash": 0, "online": 0, "avgPerAppointment": 0, "monthGrowth": 0 },
    "staff": { "active": 0, "doctors": 0, "receptionists": 0, "utilizationRate": 0 },
    "growth": { "weekPatients": 0 }
  },
  "filteredCount": 0
}
```

#### `getComparisonData(req, res)`

Computes the equivalent previous period (yesterday / prev-week / prev-month) and returns:
```json
{
  "comparison": {
    "revenue":        { "current": 0, "previous": 0, "delta": 0, "pct": 0 },
    "patients":       { "current": 0, "previous": 0, "delta": 0, "pct": 0 },
    "appointments":   { "current": 0, "previous": 0, "delta": 0, "pct": 0 },
    "completionRate": { "current": 0, "previous": 0, "delta": 0, "pct": 0 },
    "avgRevPerAppt":  { "current": 0, "previous": 0, "delta": 0, "pct": 0 },
    "period": "week",
    "label": "vs. last week"
  }
}
```

Uses completed appointments only (Requirement 3.17). Returns `"noPreviousData": true` when previous period is empty.

#### `getChartData(req, res)`

Returns all chart data series in one call:
```json
{
  "revenueTrend":         [{ "date": "2026-06-01", "revenue": 5000 }],
  "appointmentTrend":     [{ "date": "2026-06-01", "count": 12 }],
  "paymentBreakdown":     { "cash": 15000, "online": 8000 },
  "appointmentStatus":    { "completed": 80, "cancelled": 12, "noShow": 8 },
  "doctorPerformance":    [{ "doctor": "Dr. Mehta", "appointments": 45, "revenue": 22000 }],
  "patientDemographics":  [{ "ageGroup": "18-30", "count": 30 }],
  "peakHours":            [{ "hour": 9, "label": "9 AM", "count": 18 }],
  "dayOfWeek":            [{ "day": "Mon", "count": 22 }],
  "granularity":          "daily"
}
```

Granularity switches to `weekly` automatically when period > 14 days.

#### `getTransactions(req, res)`

Paginated: `?page=1&limit=20`. Supports same filters. Returns `{ transactions: [...], total, page, pages }`. Max 1000 rows in exports.

#### `getWidgetPreferences` / `saveWidgetPreferences`

CRUD on `DashboardWidgetPreference` table. `save` validates that at least 1 widget has `visible: true`.

### `dashboard-enhanced.service.js`

Extracts reusable query builders:

```javascript
// buildDateRange(period, startDate, endDate) → { gte, lte }
// buildPreviousPeriodRange(period) → { gte, lte }
// calcPct(current, previous) → number | null
// appointmentWhereClause(clinicId, dateRange, filters) → Prisma where object
```

### Cache Middleware (existing `cache.middleware.js`)

Already present. Used on enhanced/comparison/charts endpoints with 60s TTL (Requirement 10.14). Cache key includes clinicId + query string.

### Socket.io Enhancements

New events emitted from existing controllers when they modify appointments or payments:

| Event name | Emitted from | Payload |
|---|---|---|
| `new-appointment` | appointment creation controller | `{ clinicId, appointment }` |
| `appointment-completed` | appointment status update | `{ clinicId, appointmentId, completionRate }` |
| `new-payment` | payment controller | `{ clinicId, payment, revenueUpdate }` |
| `queue-updated` | queue controller | `{ clinicId, queueLength }` |

Room: `clinic-{clinicId}` (matches existing `clinic:join` handler in `socket/index.js` — note the room name in the frontend hook uses `clinic:join` event and the room is stored as `clinic:${clinicId}`).

---

## File Structure

```
frontend/src/
├── components/dashboard/
│   ├── MetricCard.jsx
│   ├── DashboardFilterBar.jsx
│   ├── DashboardFilterDrawer.jsx      (mobile)
│   ├── AlertsInsightsWidget.jsx
│   ├── RecentTransactionsTable.jsx
│   ├── WidgetCustomizerModal.jsx
│   ├── ConnectionStatusBadge.jsx
│   ├── ExportButton.jsx
│   └── charts/
│       ├── RevenueTrendChart.jsx
│       ├── AppointmentTrendChart.jsx
│       ├── PaymentBreakdownPie.jsx
│       ├── AppointmentStatusPie.jsx
│       ├── DoctorPerformanceBar.jsx
│       ├── PatientDemographicsBar.jsx
│       ├── PeakHoursHeatmap.jsx
│       └── DayOfWeekBar.jsx
├── hooks/
│   ├── useDashboardData.js
│   ├── useDashboardFilters.js
│   ├── useDashboardSocket.js
│   ├── useAlertEngine.js
│   ├── useExportService.js
│   └── useWidgetPreferences.js
├── api/
│   └── dashboard.api.js               (new — all enhanced dashboard calls)
├── store/
│   └── dashboardStore.js              (new — Zustand slice for RT updates)
└── pages/owner/
    └── OwnerDashboard.jsx             (refactored)

backend/src/
├── controllers/
│   └── dashboard-enhanced.controller.js
├── routes/
│   └── dashboard-enhanced.routes.js
├── services/
│   └── dashboard-enhanced.service.js
├── validations/
│   └── dashboard.validation.js        (Zod schemas for query params)
└── prisma/
    └── migrations/
        └── 20260700000000_dashboard_enhancements/
            └── migration.sql          (index + widget preference table)
```

---

## New Dependencies

### Frontend (add to `frontend/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `recharts` | `^2.12.0` | All chart rendering (Requirement 2.16) |
| `jspdf` | `^2.5.1` | PDF export (Requirement 6.19) |
| `jspdf-autotable` | `^3.8.2` | Table rendering in PDF |
| `html2canvas` | `^1.4.1` | Capture chart images for PDF |
| `xlsx` | `^0.18.5` | Excel export (Requirement 6.20) |
| `@hello-pangea/dnd` | `^1.1.0` | Drag-and-drop widget reorder (Requirement 7.8) |
| `date-fns` | `^3.6.0` | Date range calculations |

All loaded lazily where possible (`import()`) to minimise initial bundle.

### Backend (no new dependencies needed)

`ioredis`, `socket.io`, `@prisma/client`, `zod`, `express` already present and sufficient.

---

## Performance Strategy

| Concern | Solution |
|---|---|
| Initial load speed | Parallel API calls (`Promise.all`); skeleton states; lazy-loaded charts |
| Redundant API calls | 30s in-memory cache in `useDashboardData`; 60s Redis TTL on backend |
| Filter re-fetches | 500ms debounce before triggering refetch |
| Re-render cost | `React.memo` on `MetricCard`; `useMemo` for alert derivation and aggregations |
| Large transaction lists | Pagination (20/page); virtual scroll for >100 rows; prefetch at 80% scroll |
| Chart flood from Socket | `lodash.throttle` at 5s on chart-refresh handlers |
| Bundle size | `jspdf`, `xlsx`, `html2canvas` loaded via dynamic `import()` on demand |
| DB query speed | New indexes on `(clinicId, createdAt)` and `(clinicId, paidAt)` |
| Query consistency | `prisma.$transaction` for multi-table aggregates |
| Slow queries warning | Frontend shows warning toast when API response > 3s |
| Error isolation | React Error Boundaries wrap each widget section |

---

## Mobile Responsiveness

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | 1-column grid; filter drawer; icon-only export button; abbreviated labels; vertical alerts list; chart legends in tooltips |
| `768–1024px` (tablet) | 2-column grid |
| `> 1024px` (desktop) | 3-column grid; inline filter bar; full labels |

Tailwind responsive classes (`sm:`, `md:`, `lg:`) used throughout. All tap targets ≥ 44×44px. No horizontal overflow on main container (`overflow-x-hidden` on root).

---

## Security

- All new backend routes use existing `auth` middleware (JWT) and `role.middleware` (CLINIC_OWNER guard).
- Query parameters validated with Zod schemas before use in Prisma queries.
- Widget preference endpoint scoped to `userId` — owners cannot read/write other users' preferences.
- Export endpoints return data scoped to the authenticated owner's clinic only.
- Redis cache keys include `clinicId` to prevent data leakage across tenants.

---

## Testing Strategy

### Backend Unit Tests (`dashboard-enhanced.controller.test.js`)

- `getEnhancedDashboard` — correct metric aggregations for each filter combination
- `getComparisonData` — correct period mapping and percentage calculations
- `getChartData` — daily vs. weekly granularity switching at 14-day boundary
- `getTransactions` — pagination, max 1000 limit
- `saveWidgetPreferences` — rejects all-invisible payload

### Backend Integration Tests

- Full flow: filter → dashboard data → comparison → chart data → export data
- Socket event emission after appointment/payment mutations
- Redis cache hit/miss behaviour

### Frontend Unit Tests

- `useAlertEngine` — all 11 alert rules fire at correct thresholds
- `useDashboardFilters` — localStorage persistence, date validation
- `MetricCard` — renders skeleton when value undefined; shows comparison badge
- `AlertsInsightsWidget` — dismissal stores to localStorage; "All Good" state

---

## Components and Interfaces

### Frontend Component Interfaces

```typescript
// MetricCard
interface MetricCardProps {
  icon: string;
  label: string;
  value: number | string | undefined;
  unit?: string;
  comparison?: { delta: number; pct: number; period: string } | null;
}

// DashboardFilterBar
interface DashboardFilterBarProps {
  filters: DashboardFilters;
  doctors: { id: string; name: string }[];
  onFilterChange: (key: string, value: unknown) => void;
  onClearAll: () => void;
  activeCount: number;
  loading: boolean;
}

// AlertsInsightsWidget
interface Alert {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'POSITIVE';
  title: string;
  description: string;
  action: string;
  link?: string;
}
interface AlertsInsightsWidgetProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

// WidgetCustomizerModal
interface WidgetConfig {
  id: string;
  label: string;
  description: string;
  visible: boolean;
  order: number;
}
interface WidgetCustomizerModalProps {
  open: boolean;
  widgets: WidgetConfig[];
  saving: boolean;
  onSave: (updated: WidgetConfig[]) => void;
  onCancel: () => void;
  onReset: () => void;
}

// RecentTransactionsTable
interface Transaction {
  id: string;
  amount: number;
  method: 'CASH' | 'ONLINE';
  paidAt: string;
  patient: { name: string };
  appointment: { doctor: { user: { name: string } } };
}
interface RecentTransactionsTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}
```

### Backend API Interfaces

```typescript
// GET /api/dashboard/clinic/:id/enhanced
// Query params
interface EnhancedDashboardQuery {
  period?: 'today' | 'week' | 'month' | 'last7' | 'last30' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  paymentMethod?: 'ALL' | 'CASH' | 'ONLINE';
  appointmentStatus?: 'ALL' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

// GET /api/dashboard/clinic/:id/transactions
interface TransactionsQuery extends EnhancedDashboardQuery {
  page?: number;   // default 1
  limit?: number;  // default 20, max 1000 for export
}

// PUT /api/dashboard/clinic/:id/widget-preferences
interface SaveWidgetPreferencesBody {
  widgets: Array<{ id: string; visible: boolean; order: number }>;
}
```

### Hook Return Types

```typescript
// useDashboardData
interface UseDashboardDataReturn {
  data: EnhancedDashboardResponse | null;
  chartData: ChartDataResponse | null;
  comparisonData: ComparisonResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useDashboardFilters
interface UseDashboardFiltersReturn {
  filters: DashboardFilters;
  setFilter: (key: keyof DashboardFilters, value: unknown) => void;
  clearAll: () => void;
  isActive: boolean;
  activeCount: number;
}

// useDashboardSocket
interface UseDashboardSocketReturn {
  connected: boolean;
  reconnecting: boolean;
}

// useWidgetPreferences
interface UseWidgetPreferencesReturn {
  widgets: WidgetConfig[];
  saving: boolean;
  isVisible: (id: string) => boolean;
  save: (updated: WidgetConfig[]) => Promise<void>;
  reset: () => void;
}
```

---

## Error Handling

### Frontend

| Error scenario | Handling strategy |
|---|---|
| API fetch failure | Error state in `useDashboardData`; each widget section wrapped in `<ErrorBoundary>` showing a "Failed to load" card with retry button |
| Socket connection lost | `useDashboardSocket` updates `connected: false`; `ConnectionStatusBadge` shows "Reconnecting..." with amber indicator; Socket.io auto-reconnects with exponential backoff |
| Filter validation failure | `useDashboardFilters` returns error string; `DashboardFilterBar` shows inline validation message; invalid date ranges disabled in UI |
| Export failure | `useExportService` catches errors and calls `toast.error()` with retry callback |
| Widget preference save failure | `useWidgetPreferences` catches error and calls `toast.error()`; local state not committed |
| Slow API response (>3s) | `useDashboardData` starts a 3s timer on fetch; on expiry shows `toast.warning('Dashboard is taking longer than expected')` |
| Empty data after filters | Each widget renders its own empty state; `DashboardFilterBar` shows result count of 0 with "Clear filters" suggestion |

### Backend

| Error scenario | HTTP status | Response |
|---|---|---|
| Invalid query params | 400 | `{ error: "Validation failed", details: [...] }` |
| Clinic not found | 404 | `{ error: "Clinic not found" }` |
| Access denied (wrong owner) | 403 | `{ error: "Access denied" }` |
| All-invisible widget save attempt | 400 | `{ error: "At least one widget must be visible" }` |
| Database error | 500 | `{ error: "Internal server error" }` (details logged, not exposed) |
| Redis unavailable | Degraded gracefully — cache miss, query runs against DB | No error surfaced to client |

All backend controller errors pass through the existing `next(error)` → `error.middleware.js` handler.

---

## Correctness Properties

### Property 1: Comparison Uses Completed Appointments Only

Comparison calculations for period-over-period deltas (revenue, patient count, appointment count, completion rate, avg revenue per appointment) use only appointments with status `COMPLETED`. Cancelled and no-show appointments are excluded from all comparison values.

**Validates: Requirements 3.17**

### Property 2: Alerts Reflect Filtered Dataset

Alert thresholds are evaluated against the currently selected filter context — not clinic lifetime data. When a doctor filter or date range is active, alert calculations (cancellation rate, no-show rate, completion rate, wait time) use only the filtered dataset, so alerts always reflect what the owner is currently viewing.

**Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.6, 5.7, 5.20**

### Property 3: Real-Time Updates Respect Active Filters

Socket.io events that trigger dashboard metric updates are gated against the active filter state. A `new-payment` event for doctor A is ignored when the doctor filter is set to doctor B. A `new-appointment` event outside the selected date range is ignored.

**Validates: Requirements 8.22**

### Property 4: Widget Preferences Are User-Scoped

The `DashboardWidgetPreference` model has a unique constraint on `userId`. Backend handlers verify that the authenticated user's ID matches the record being read or written. A clinic owner cannot read or overwrite another user's preferences.

**Validates: Requirements 7.9, 7.10, 7.11**

### Property 5: Chart Granularity Switches at 14 Days

When the selected date range spans more than 14 days, chart data series are aggregated by week instead of by day. This prevents chart overcrowding and maintains readability. The backend `getChartData` endpoint returns `"granularity": "weekly"` in this case and the frontend charts adapt their axis labels accordingly.

**Validates: Requirements 2.1, 2.2, 2.15**

### Property 6: Export Row Cap Enforced

Transaction export is capped at 1000 rows. When the clinic's data for the selected period exceeds 1000 transactions, the export includes only the most recent 1000 and renders a visible warning message in both PDF header and Excel summary sheet.

**Validates: Requirements 6.21**

### Property 7: At Least One Widget Always Visible

The `WidgetCustomizerModal` enforces a minimum of 1 visible widget. The Save button is disabled (not merely styled) when all checkboxes are unchecked. The backend `saveWidgetPreferences` endpoint independently validates this constraint and returns HTTP 400 if violated.

**Validates: Requirements 7.18**

### Property 8: Filter State Falls Back to Defaults on Corruption

`useDashboardFilters` wraps the localStorage read in a try/catch. If the stored value is not valid JSON, is missing required keys, or contains out-of-range values (e.g. a date range exceeding 1 year), the hook discards it and initialises with default filters instead of propagating an error.

**Validates: Requirements 4.13, 4.14, 4.17, 4.18**

### Property 9: Redis Cache Is Tenant-Isolated

Redis cache keys are constructed as `dashboard:{clinicId}:{endpoint}:{queryStringHash}`. The `clinicId` segment ensures that cached data for one clinic cannot be served to a request for a different clinic, even if all other query parameters are identical.

**Validates: Requirements 10.13, 10.14**

---

## Implementation Order

1. **DB migration** — add indexes + `DashboardWidgetPreference` model
2. **Backend service** — query builders and comparison logic
3. **Backend controller + routes** — enhanced, comparison, chart, transactions, preferences endpoints
4. **Socket.io** — emit new events from appointment/payment controllers
5. **Frontend API layer** — `dashboard.api.js`
6. **Frontend hooks** — `useDashboardData`, `useDashboardFilters`, `useDashboardSocket`, `useAlertEngine`, `useWidgetPreferences`, `useExportService`
7. **Frontend components** — MetricCard → FilterBar → Charts → AlertsWidget → Transactions → WidgetCustomizer → ExportButton
8. **OwnerDashboard.jsx** — compose everything
9. **Mobile responsiveness** — responsive classes, filter drawer, export icon
10. **Performance** — lazy imports, memoisation, error boundaries, performance logging
