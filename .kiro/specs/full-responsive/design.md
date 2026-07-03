# Design Document — Full Responsive Design System

## Overview

This document describes the technical design for making the entire PulseMate Connect platform fully responsive across all device sizes — from 320px Android phones to 1536px+ widescreen desktops. The design covers both surfaces: the React Native mobile app (`src/`) and the React/Vite web portal (`frontend/src/`).

The approach is **additive and backward-compatible**: existing business logic, branding, colors, and component APIs are preserved. All changes are layout, sizing, and utility additions only.

---

## High-Level Design

### 1. Breakpoint Strategy

#### Web (TailwindCSS)

| Alias | Min Width | Target Devices |
|-------|-----------|----------------|
| `xs`  | 0px       | Small phones (320–479px) |
| `sm`  | 640px     | Large phones / landscape |
| `md`  | 768px     | Tablets portrait |
| `lg`  | 1024px    | Tablets landscape / small desktop |
| `xl`  | 1280px    | Desktop |
| `2xl` | 1536px    | Wide desktop |

Tailwind already covers `sm`→`2xl`. The `xs` range is handled by mobile-first defaults (no prefix).

#### React Native

| Alias     | Width Range | Usage |
|-----------|-------------|-------|
| `isPhone` | < 600px     | Single-column layouts |
| `isTablet`| 600–1024px  | 2-column grids, larger touch targets |
| `isDesktop`| > 1024px   | Full desktop web view via WebView |

---

### 2. Architectural Components

#### 2.1 Web — `useBreakpoint` Hook

A new hook at `frontend/src/hooks/useBreakpoint.js` that listens to `window.resize` and returns the current breakpoint name plus boolean helpers.

#### 2.2 Web — Responsive CSS Custom Properties

Added to `frontend/src/index.css` — CSS vars for dynamic column counts consumed by grid containers.

#### 2.3 Web — `DashboardLayout` — Three-Mode Sidebar

- **Desktop (≥1024px):** Fixed 260px sidebar, always visible
- **Tablet (768–1023px):** Collapsed icon-only sidebar (64px wide), expands to 260px on hover or toggle
- **Mobile (<768px):** Hidden sidebar, slides in as full-height drawer

#### 2.4 Web — Responsive Page Container

The `.page-container` class extended with better padding at each breakpoint.

#### 2.5 React Native — `useResponsive` Hook

New hook at `src/hooks/useResponsive.js` — provides `isPhone`, `isTablet`, `rs()` (scale), `rf()` (font scale).

---

### 3. System Component Catalog

| Component | Change |
|-----------|--------|
| `DashboardLayout` | Icon-only tablet mode, bottom nav bar for mobile |
| `MetricCard` | Fluid width, no fixed px |
| `DataTable` wrapper | `overflow-x-auto` + column hiding on mobile |
| `Modal` | Full-screen on mobile, centered dialog on ≥768px |
| `FormGrid` | `grid-cols-1 md:grid-cols-2` pattern |
| Auth pages | Centered, max-width constrained, keyboard-safe |

---

### 4. Page-Level Responsive Strategy

| Surface | Page | Mobile Strategy | Tablet Strategy | Desktop Strategy |
|---------|------|----------------|-----------------|------------------|
| Web | `AdminDashboard` | 2-col stat grid, stacked sections | 2-col stat grid | 4-col stat grid |
| Web | `OwnerDashboard` | Stacked metrics, filter drawer | 2-col metrics | 3–4 col metrics, inline filter bar |
| Web | `PatientDashboard` | Single-col cards | 2-col cards | Centered max-w-4xl |
| Web | `DoctorSearch` | Stacked filters, 1-col results | 2-col results | 3-col results |
| Web | `TodayQueue` | Stacked stats, card list | Card list | Card list + sidebar summary |
| Web | All forms | Single-col | 2-col | 2-col, max-w-2xl |
| RN | `LoginScreen` | Full-width, keyboard-safe | Centered max-w-480 | N/A |
| RN | `HomeScreen` | 1-col FlatList | 2-col FlatList | N/A |
| RN | `BookingScreen` | Horizontal scroll dates, 3-col slots | 4-col slots | N/A |

---

## Low-Level Design

### 5. `useBreakpoint` — Web Hook

**File:** `frontend/src/hooks/useBreakpoint.js`

```js
// Returns: { breakpoint, isMobile, isTablet, isDesktop, isXl, width }
// breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

**Algorithm:**
1. Read `window.innerWidth` on mount
2. Attach `resize` event listener (debounced 100ms)
3. Map width to breakpoint string using thresholds: 640, 768, 1024, 1280, 1536
4. Derive booleans: `isMobile = width < 768`, `isTablet = width >= 768 && width < 1024`, `isDesktop = width >= 1024`
5. Clean up listener on unmount

**Dependencies:** None (pure browser APIs)

---

### 6. `useResponsive` — React Native Hook

**File:** `src/hooks/useResponsive.js`

```js
// Returns: { width, height, isPhone, isTablet, isDesktop, rs, rf }
// rs(value): responsive scale — value * (width/375), clamped [value*0.8, value*1.5]
// rf(size): responsive font — size / PixelRatio.getFontScale(), clamped [11, 28]
```

**Algorithm:**
1. Use `useWindowDimensions()` from React Native
2. Derive `isPhone = width < 600`, `isTablet = width >= 600 && width < 1024`, `isDesktop = width >= 1024`
3. `rs = (v) => Math.min(Math.max(v * (width / 375), v * 0.8), v * 1.5)`
4. `rf = (size) => Math.min(Math.max(size / PixelRatio.getFontScale(), 11), 28)`
5. Returns a stable object (memoized)

**Dependencies:** `react-native` (`useWindowDimensions`, `PixelRatio`)

---

### 7. CSS Custom Properties — `index.css` Additions

**File:** `frontend/src/index.css`

Added to `:root` and media query blocks:

```css
:root {
  --cols-dashboard: 1;
  --cols-cards: 1;
  --sidebar-width: 0px;
}
@media (min-width: 768px) {
  :root {
    --cols-dashboard: 2;
    --cols-cards: 2;
    --sidebar-width: 64px;   /* icon-only tablet sidebar */
  }
}
@media (min-width: 1024px) {
  :root {
    --cols-dashboard: 4;
    --cols-cards: 3;
    --sidebar-width: 260px;  /* full desktop sidebar */
  }
}
```

These are consumed by grid components via `grid-template-columns: repeat(var(--cols-dashboard), 1fr)` where Tailwind classes aren't sufficient.

---

### 8. `DashboardLayout.jsx` — Detailed Changes

**File:** `frontend/src/layouts/DashboardLayout.jsx`

#### Three Sidebar Modes

| Mode | Width | Trigger | Behavior |
|------|-------|---------|----------|
| Desktop | ≥1024px | Always | Fixed left, 260px, labels + icons |
| Tablet | 768–1023px | Always | Fixed left, 64px, icons only. Hover/click expands to 260px overlay |
| Mobile | <768px | Hamburger tap | Off-canvas drawer, 260px, slides in from left |

#### State additions
- `tabletExpanded: boolean` — controls hover expansion on tablet
- Existing `sidebarOpen` continues to handle the mobile drawer

#### Layout structure changes

```
<div> root
  ├── Mobile overlay (z-20, lg:hidden)
  ├── Desktop sidebar (hidden on <lg, fixed, w-[260px])
  ├── Tablet sidebar (hidden on <md and ≥lg, fixed, w-16, hover→w-[260px])
  ├── Mobile drawer (fixed, w-[260px], translate-x-full when closed)
  └── Main content
       ├── ml-0 md:ml-16 lg:ml-[260px]   ← shifts right to avoid sidebar
       ├── Topbar (sticky, h-14)
       └── <main> {children}
```

#### Tablet sidebar — icon-only nav items

Each nav `<Link>` in tablet mode:
- Shows only the icon (`w-5 h-5`)
- Has `title` attribute for accessibility tooltip
- `overflow: hidden; white-space: nowrap` so label is hidden but DOM-present for screen readers
- On hover/expand: label slides in with `transition-all duration-200`

#### Bottom Navigation Bar (mobile only)

A `<nav>` element fixed at the bottom for mobile (`md:hidden`), showing up to 5 nav items for the current role as icon + short label. Uses `safe-area-inset-bottom` padding via `pb-[env(safe-area-inset-bottom)]`.

**Visible on:** `< 768px` only  
**Items shown:** First 4–5 items from `NAV_ITEMS[role]`  
**Active state:** `text-blue-600 border-t-2 border-blue-600`

#### Content area bottom padding

On mobile, `<main>` gets `pb-20` to prevent content from being hidden behind the fixed bottom nav bar.

---

### 9. Responsive Grid Patterns

#### 9.1 Stat/Metric Cards Grid

Old: `grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4`  
**New:** `grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4`

The `sm` breakpoint (640px) is between phone and tablet — keep 2 cols there too. The change ensures no layout jump at 640px.

For the **5-card layout** (OwnerDashboard):  
`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5`

#### 9.2 Form Grid

Standard two-column form:  
`grid grid-cols-1 gap-4 md:grid-cols-2`

Three-column info display:  
`grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3`

#### 9.3 Doctor Card Grid

`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

#### 9.4 Quick Action Grid

Patient dashboard:  
`grid grid-cols-2 sm:grid-cols-3 gap-3`

Owner dashboard quick actions:  
`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`

---

### 10. Data Tables — Responsive Wrapper Pattern

All data tables (`ManageStaff`, `OwnerAppointments`, `UsersManagement`, `ClinicVerification`, `RecentTransactionsTable`) adopt this pattern:

```jsx
<div className="overflow-x-auto rounded-xl border border-gray-100">
  <table className="min-w-full text-sm">
    <thead>
      <tr>
        <th className="px-4 py-3 text-left">Name</th>
        <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
        <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
        <th className="px-4 py-3 text-left">Status</th>
        <th className="px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>...</td>
        <td className="hidden sm:table-cell">...</td>  {/* hide on xs */}
        <td className="hidden md:table-cell">...</td>  {/* hide on xs+sm */}
        <td>...</td>
        <td>
          {/* Icon-only on mobile, icon+label on sm+ */}
          <span className="hidden sm:inline">Edit</span>
          <EditIcon className="sm:hidden" />
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Column visibility rules:**

| Column Type | xs | sm | md+ |
|-------------|----|----|-----|
| Name / Primary | ✓ | ✓ | ✓ |
| Email / Phone | ✗ | ✓ | ✓ |
| Date / Time | ✗ | ✗ | ✓ |
| Status badge | ✓ | ✓ | ✓ |
| Actions | ✓ (icon) | ✓ (icon+label) | ✓ |

---

### 11. Modal — Responsive Sizing

**File:** `frontend/src/components/ui/Modal.jsx`

| Screen | Modal Style |
|--------|-------------|
| < 768px | `fixed inset-0` — full screen, no border-radius at top |
| ≥ 768px `size="sm"` | `max-w-md` centered |
| ≥ 768px `size="md"` | `max-w-lg` centered |
| ≥ 768px `size="lg"` | `max-w-2xl` centered |
| ≥ 768px `size="xl"` | `max-w-4xl` centered |

Container class:
```
fixed inset-0 md:inset-auto md:relative w-full md:w-auto 
md:max-w-{size} md:rounded-2xl
```

On mobile the modal fills the screen (with a top safe area). The close button moves to the top-right corner.

---

### 12. Touch Target Enforcement

Minimum touch target: **44×44px** on all interactive elements (WCAG 2.5.8).

Elements to patch:

| Element | Current | Fixed |
|---------|---------|-------|
| Nav link (sidebar) | `py-2.5` | `min-h-[44px] py-2.5` |
| Small action buttons (`py-1.5 px-3`) | 30px tall | Add `min-h-[44px]` on mobile via `sm:min-h-0` |
| Icon-only buttons | `w-9 h-9` (36px) | `w-11 h-11` on mobile |
| Notification bell | `w-9 h-9` | `w-11 h-11 md:w-9 md:h-9` |
| Table row action icons | `w-5 h-5` | Wrap in `p-2.5` container |
| Specialization chips | `py-1.5` | `py-2 min-h-[36px]` |

Implementation: add a Tailwind utility class `.touch-target` in `index.css`:
```css
@layer utilities {
  .touch-target {
    @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
  }
}
```

---

### 13. Typography Scale — Web

Applied via Tailwind responsive prefixes:

| Element | xs/sm | md | lg+ |
|---------|-------|----|-----|
| Page `<h1>` | `text-xl` | `text-2xl` | `text-2xl` |
| Section `<h2>` | `text-base` | `text-lg` | `text-lg` |
| Card title | `text-sm` | `text-sm` | `text-sm` |
| Body text | `text-sm` | `text-sm` | `text-sm` |
| Caption / label | `text-xs` | `text-xs` | `text-xs` |
| Stat numbers | `text-2xl` | `text-3xl` | `text-3xl` |

Pattern in pages:
```jsx
<h1 className="text-xl md:text-2xl font-bold text-gray-900">...</h1>
```

---

### 14. React Native Screen-Level Changes

#### 14.1 `LoginScreen` / `OtpScreen`

```
<SafeAreaView>
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        {/* content */}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

Logo: `width: '60%', maxWidth: 200, resizeMode: 'contain'`  
Button: `width: '100%', maxWidth: 400, alignSelf: 'center'`

#### 14.2 `HomeScreen`

```js
const { isTablet } = useResponsive();
// FlatList numColumns={isTablet ? 2 : 1}
// key={isTablet ? 'tablet' : 'phone'}  ← forces remount on orientation change
```

#### 14.3 `BookingScreen` — Date Strip

```js
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {dates.map(d => (
    <TouchableOpacity style={{ width: rs(72), alignItems: 'center', marginHorizontal: 4 }}>
      ...
    </TouchableOpacity>
  ))}
</ScrollView>
```

Slot grid: `numColumns={isTablet ? 4 : 3}`  
Book button: fixed bottom, `paddingBottom: insets.bottom + 16`

#### 14.4 `LiveQueueScreen`

Queue number: `fontSize: isTablet ? rf(48) : rf(64)`  
Queue status card: `width: '90%', maxWidth: 400, alignSelf: 'center'`  
Pull-to-refresh: `<FlatList refreshControl={<RefreshControl ... />} />`

#### 14.5 `ProfileScreen` / `EditProfileScreen`

Avatar: `width: rs(80), height: rs(80), borderRadius: rs(40)`  
Content wrapper: `maxWidth: 600, alignSelf: 'center'` on tablet  
`EditProfileScreen`: `KeyboardAvoidingView` + `ScrollView`

---

### 15. Page-by-Page Web Changes Summary

#### `AdminDashboard.jsx`
- Stat grids: `grid-cols-2 md:grid-cols-2 lg:grid-cols-4` (add `md:`)
- Page header flex: `flex-col sm:flex-row items-start sm:items-center`
- Quick action cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Reset DB section: `flex-col lg:flex-row` for button placement

#### `OwnerDashboard.jsx`
- Dashboard header buttons: wrap with `flex-wrap gap-2` — already done; ensure `Customize` button label hides on xs: `hidden sm:inline`
- Metric grids inside `renderWidget`: `grid-cols-2 md:grid-cols-3` (remove hardcoded `sm:grid-cols-3`)
- `StatusBanner` blocked features grid: `grid-cols-2 md:grid-cols-3` — already correct
- `RecentTransactionsTable`: add `overflow-x-auto` wrapper

#### `PatientDashboard.jsx`
- Outer container: `max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8`
- Quick actions: `grid-cols-2 sm:grid-cols-3 gap-3` — already correct; add `min-h-[80px]` to cards
- Section headings: `text-base md:text-lg`

#### `DoctorSearch.jsx`
- Filter card grid: `grid-cols-1 sm:grid-cols-3 gap-4` — already correct; ensure filter card has `overflow-visible` so chips wrap
- Specialization chips row: `flex flex-wrap gap-2 mt-3`
- Results grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` — already correct

#### `TodayQueue.jsx`
- Stats grid: `grid-cols-3 gap-3` — works at all sizes, stat numbers use `text-xl md:text-2xl`
- Doctor selector chips: `flex flex-wrap gap-2` — already done
- Queue item actions: `flex flex-wrap gap-2` — already done
- Payment modal: full-screen overlay on mobile, centered on `sm+`

#### `WalkInBooking.jsx` / `FollowUpBooking.jsx`
- Form: `grid-cols-1 md:grid-cols-2 gap-4`
- Submit button: `w-full md:w-auto`

#### `ManageStaff.jsx`
- Table: add `overflow-x-auto` wrapper
- Hide `Email` column on xs: `hidden sm:table-cell`
- Action buttons: icon-only on xs

#### `SessionManagement.jsx`
- Session cards: `grid-cols-1 md:grid-cols-2 gap-4`
- Time picker inputs: `w-full`

#### `DoctorSchedulePage.jsx`
- Calendar: `width: 100%`, cells `aspect-ratio: 1`
- Session list: card-based on mobile

#### `LoginPage.jsx`
- Already single-column, mobile-first — no major changes
- `max-w-sm` container: keep for phone; on tablet add `sm:max-w-md`
- Feature chips row: `flex-wrap` on very small screens

#### Auth registration pages (`DoctorRegisterPage`, `ClinicOwnerRegisterPage`)
- Multi-step form: `grid-cols-1 md:grid-cols-2`
- File upload area: `w-full min-h-[120px]`
- Section headers: `text-lg md:text-xl`

---

### 16. Performance Considerations

#### Web
- `RevenueTrendChart`, `AppointmentTrendChart`, `DoctorPerformanceBar`: already use Recharts `ResponsiveContainer width="100%"` — no change needed
- Wrap chart components with `React.lazy` + `Suspense` in `OwnerDashboard`
- Images in doctor cards: add `loading="lazy"` to `<img>` tags

#### React Native
- All `FlatList` components: add `keyExtractor`, `getItemLayout` (where item height is fixed), `initialNumToRender={8}`, `removeClippedSubviews={true}`
- Doctor card, appointment card, notification item: wrap with `React.memo`
- Filter/search computed arrays: wrap with `useMemo`

---

### 17. CSS Utilities Added to `index.css`

```css
@layer utilities {
  /* Minimum touch target */
  .touch-target {
    @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
  }

  /* Scrollable table wrapper */
  .table-scroll {
    @apply overflow-x-auto rounded-xl;
  }

  /* Full-screen mobile modal */
  .modal-mobile-full {
    @apply fixed inset-0 md:inset-auto md:relative md:rounded-2xl;
  }
}
```

---

### 18. Tailwind Config Additions

**File:** `frontend/tailwind.config.cjs`

```js
theme: {
  extend: {
    // Add explicit xs breakpoint if needed for overrides
    screens: {
      'xs': '360px',
    },
    // Safe area padding utilities (for mobile browser chrome)
    spacing: {
      'safe-bottom': 'env(safe-area-inset-bottom)',
      'safe-top': 'env(safe-area-inset-top)',
    },
  }
}
```

---

### 19. File Change Index

| File | Type of Change |
|------|---------------|
| `frontend/src/hooks/useBreakpoint.js` | **New** |
| `frontend/src/hooks/useResponsive.js` (web alias) | **New** (optional, mirrors RN hook API) |
| `src/hooks/useResponsive.js` | **New** |
| `frontend/src/index.css` | **Extend** — CSS vars, touch-target, table-scroll, modal-mobile-full utilities |
| `frontend/tailwind.config.cjs` | **Extend** — `xs` screen, safe area spacing |
| `frontend/src/layouts/DashboardLayout.jsx` | **Modify** — tablet icon sidebar, bottom nav bar, correct `ml-*` offsets |
| `frontend/src/layouts/AuthLayout.jsx` | **Modify** — center form, keyboard-safe on mobile |
| `frontend/src/components/ui/Modal.jsx` | **Modify** — full-screen on mobile |
| `frontend/src/pages/admin/AdminDashboard.jsx` | **Modify** — grid breakpoints |
| `frontend/src/pages/owner/OwnerDashboard.jsx` | **Modify** — grid breakpoints, table overflow |
| `frontend/src/pages/patient/PatientDashboard.jsx` | **Modify** — minor spacing |
| `frontend/src/pages/patient/DoctorSearch.jsx` | **Modify** — filter area overflow |
| `frontend/src/pages/receptionist/TodayQueue.jsx` | **Modify** — stat text sizes |
| `frontend/src/pages/receptionist/WalkInBooking.jsx` | **Modify** — form grid |
| `frontend/src/pages/owner/ManageStaff.jsx` | **Modify** — table overflow, column hiding |
| `frontend/src/pages/owner/SessionManagement.jsx` | **Modify** — grid, input widths |
| `frontend/src/pages/doctor/DoctorSchedulePage.jsx` | **Modify** — calendar responsiveness |
| `src/screens/LoginScreen.jsx` | **Modify** — SafeAreaView, KeyboardAvoidingView |
| `src/screens/OtpScreen.jsx` | **Modify** — SafeAreaView, KeyboardAvoidingView |
| `src/screens/HomeScreen.jsx` | **Modify** — useResponsive, FlatList numColumns |
| `src/screens/BookingScreen.jsx` | **Modify** — date strip, slot grid, sticky button |
| `src/screens/LiveQueueScreen.jsx` | **Modify** — font scale, pull-to-refresh |
| `src/screens/ProfileScreen.jsx` | **Modify** — avatar rs(), tablet centering |
| `src/screens/EditProfileScreen.jsx` | **Modify** — KeyboardAvoidingView, ScrollView |
| `src/screens/AppointmentsScreen.jsx` | **Modify** — FlatList padding |
| `src/screens/NotificationsScreen.jsx` | **Modify** — FlatList padding |

---

### 20. Non-Goals

The following are explicitly out of scope for this feature:

- Dark mode / theme switching
- Any change to business logic, API calls, or data models
- Replacing or upgrading any existing dependency
- Adding new pages or features
- Changing branding, color palette, or typography choices
- Supporting Internet Explorer or legacy browsers
