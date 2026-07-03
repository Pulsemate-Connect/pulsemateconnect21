# Implementation Plan: Full Responsive Design System

## Overview

Convert the entire PulseMate Connect platform — React/Vite web portal and React Native mobile app — to be fully responsive across all device sizes. All changes are additive and backward-compatible: no business logic, branding, or API calls are modified. Implementation proceeds in layers: shared utilities first, then the DashboardLayout shell, then web pages, then shared UI components, then React Native screens, and finally performance optimizations.

## Tasks

- [ ] 1. Shared Web Utilities — `useBreakpoint` hook, CSS custom properties, Tailwind config, and CSS utility classes
  - [ ] 1.1 Create `frontend/src/hooks/useBreakpoint.js`
    - Implement hook that reads `window.innerWidth` on mount and on `resize` (debounced 100 ms)
    - Map width to breakpoint string `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'` using thresholds 640 / 768 / 1024 / 1280 / 1536
    - Derive and return `{ breakpoint, isMobile, isTablet, isDesktop, isXl, width }` where `isMobile = width < 768`, `isTablet = 768–1023`, `isDesktop ≥ 1024`
    - Clean up the resize listener on unmount
    - _Requirements: 1.6_

  - [ ] 1.2 Add CSS custom properties and responsive utility classes to `frontend/src/index.css`
    - Add `:root` block with `--cols-dashboard: 1`, `--cols-cards: 1`, `--sidebar-width: 0px`
    - Add `@media (min-width: 768px)` block: `--cols-dashboard: 2`, `--cols-cards: 2`, `--sidebar-width: 64px`
    - Add `@media (min-width: 1024px)` block: `--cols-dashboard: 4`, `--cols-cards: 3`, `--sidebar-width: 260px`
    - Add `@layer utilities` block: `.touch-target`, `.table-scroll`, `.modal-mobile-full` as specified in design §12 and §17
    - _Requirements: 1.7, 9.7_

  - [ ] 1.3 Extend `frontend/tailwind.config.cjs`
    - Add `xs: '360px'` to `theme.extend.screens`
    - Add `'safe-bottom': 'env(safe-area-inset-bottom)'` and `'safe-top': 'env(safe-area-inset-top)'` to `theme.extend.spacing`
    - _Requirements: 1.7_


- [ ] 2. React Native Shared Utility — `useResponsive` hook
  - [ ] 2.1 Create `src/hooks/useResponsive.js`
    - Use `useWindowDimensions()` from React Native for live width/height
    - Derive `isPhone = width < 600`, `isTablet = 600–1023`, `isDesktop ≥ 1024`
    - Implement `rs(value)` = `Math.min(Math.max(value * (width / 375), value * 0.8), value * 1.5)`
    - Implement `rf(size)` = `Math.min(Math.max(size / PixelRatio.getFontScale(), 11), 28)`
    - Return a stable memoized object so renders are not triggered unnecessarily
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_


- [ ] 3. DashboardLayout — three-mode sidebar, bottom nav bar, and content offsets
  - [ ] 3.1 Refactor `frontend/src/layouts/DashboardLayout.jsx` — tablet icon-only sidebar
    - Add `tabletExpanded` state (default `false`)
    - Render a second sidebar variant for tablet (`hidden md:flex lg:hidden`) at fixed `w-16`, expanding to `w-[260px]` on `onMouseEnter` / collapsing on `onMouseLeave`
    - In tablet mode, nav `<Link>` items show icon only; label is DOM-present but `overflow-hidden` for screen readers; add `title` attribute for tooltip
    - Keep existing desktop sidebar (`hidden lg:flex`, fixed `w-[260px]`) unchanged
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 3.2 Add mobile bottom navigation bar to `DashboardLayout.jsx`
    - Render a `<nav>` fixed at bottom, visible only `< 768px` (`md:hidden`), showing first 4–5 items from `NAV_ITEMS[role]`
    - Each item: icon + short label, active state `text-blue-600 border-t-2 border-blue-600`
    - Apply `pb-[env(safe-area-inset-bottom)]` for safe area; clicking a nav item closes any open state
    - _Requirements: 9.3, 9.4_

  - [ ] 3.3 Fix main content margin offsets and header in `DashboardLayout.jsx`
    - Update main content wrapper to `ml-0 md:ml-16 lg:ml-[260px]`
    - Ensure `<header>` has `position: sticky; top: 0; z-index: 40`
    - Add `overflow-x: hidden` on root div
    - Add `pb-20 md:pb-0` on `<main>` to prevent content hiding behind bottom nav on mobile
    - Hamburger button: keep `lg:hidden` (already visible on mobile/tablet)
    - Auto-close sidebar on nav link click on mobile (already in place — verify and wire to tablet mode too)
    - _Requirements: 9.5, 9.6, 9.7, 9.8_


- [ ] 4. Web — Admin and Owner Dashboards
  - [ ] 4.1 Update `frontend/src/pages/admin/AdminDashboard.jsx`
    - Stat grids: `grid-cols-2 md:grid-cols-2 lg:grid-cols-4`
    - Page header: `flex-col sm:flex-row items-start sm:items-center`
    - Quick action cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
    - Reset DB / admin-action section: `flex-col lg:flex-row` for button placement
    - All heading text: `text-xl md:text-2xl`
    - _Requirements: 10.1, 10.7, 14.4_

  - [ ] 4.2 Update `frontend/src/pages/owner/OwnerDashboard.jsx`
    - Dashboard header buttons: ensure `flex-wrap gap-2`; hide `Customize` label on xs with `hidden sm:inline`
    - Metric grids inside `renderWidget`: `grid-cols-2 md:grid-cols-3`; 5-card layout: `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5`
    - Wrap `RecentTransactionsTable` (or equivalent table) in `<div className="overflow-x-auto">` 
    - Wrap chart components (`RevenueTrendChart`, `AppointmentTrendChart`, `DoctorPerformanceBar`) in `React.lazy` + `<Suspense fallback={<div>Loading…</div>}>`
    - Filter bar: stack vertically on mobile (`flex-col sm:flex-row`)
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 16.5_


- [ ] 5. Web — Patient, Doctor-Search, and Queue pages
  - [ ] 5.1 Update `frontend/src/pages/patient/PatientDashboard.jsx`
    - Outer container: `max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8`
    - Quick actions: ensure `grid-cols-2 sm:grid-cols-3 gap-3`; add `min-h-[80px]` to action cards
    - Section headings: `text-base md:text-lg`
    - Doctor/clinic results: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
    - _Requirements: 10.1, 10.7, 14.4_

  - [ ] 5.2 Update `frontend/src/pages/patient/DoctorSearch.jsx`
    - Specialization chips row: `flex flex-wrap gap-2 mt-3`
    - Filter card: ensure `overflow-visible` so chips wrap
    - Results grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
    - All doctor card `<img>` tags: add `loading="lazy"` and `className="w-full h-auto object-cover"`
    - _Requirements: 15.5, 15.6_

  - [ ] 5.3 Update `frontend/src/pages/receptionist/TodayQueue.jsx`
    - Stats grid text: stat numbers use `text-xl md:text-2xl`
    - Doctor selector chips: `flex flex-wrap gap-2`
    - Queue item action buttons: `flex flex-wrap gap-2`
    - Mobile payment modal: full-screen overlay on mobile, centered on `sm+` (apply `.modal-mobile-full` utility)
    - _Requirements: 13.2, 13.3_

  - [ ] 5.4 Update `frontend/src/pages/patient/LiveQueue.jsx`
    - Wrap in `<div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">`
    - Queue status card: `w-full max-w-sm mx-auto`
    - Position number: `text-6xl md:text-7xl font-bold`
    - _Requirements: 6.3_

  - [ ] 5.5 Update `frontend/src/pages/patient/PaymentPage.jsx`
    - Payment summary card: `w-full` — remove any fixed pixel widths
    - Pay button: `w-full sm:w-auto sm:min-w-[200px] sm:mx-auto`
    - _Requirements: 8.1, 8.2, 8.3_


- [ ] 6. Web — Doctor and Receptionist panel pages
  - [ ] 6.1 Update `frontend/src/pages/doctor/DoctorDashboard.jsx`
    - Stat grids: `grid-cols-2 md:grid-cols-2 lg:grid-cols-4`
    - Page header: `flex-col sm:flex-row`
    - Section headings: `text-xl md:text-2xl font-bold`
    - _Requirements: 13.1, 14.4_

  - [ ] 6.2 Update `frontend/src/pages/doctor/DoctorQueue.jsx`
    - Queue items: cards stacked vertically on mobile; table layout on `lg+` with `hidden lg:table-cell` for detail columns
    - Action buttons in rows: icon-only on xs, icon + label on `sm+`
    - _Requirements: 13.3_

  - [ ] 6.3 Update `frontend/src/pages/doctor/DoctorAppointments.jsx`
    - Wrap table in `<div className="overflow-x-auto">`
    - Hide non-essential columns on mobile: `hidden sm:table-cell` for email/time detail columns
    - Filter/search row: `flex flex-col sm:flex-row gap-3`
    - _Requirements: 12.1, 12.2, 12.3, 13.1_

  - [ ] 6.4 Update `frontend/src/pages/doctor/DoctorProfilePage.jsx`
    - Profile header: `flex-col sm:flex-row items-start sm:items-center gap-4`
    - Info grid: `grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3`
    - Edit form fields: `w-full max-w-lg`
    - _Requirements: 14.4_

  - [ ] 6.5 Update `frontend/src/pages/doctor/DoctorSchedulePage.jsx`
    - Calendar container: `w-full overflow-x-auto`
    - Calendar cells: `aspect-square` (CSS `aspect-ratio: 1`)
    - Session list: card-based layout on mobile (`flex-col`), table on `lg+`
    - _Requirements: 13.1_

  - [ ] 6.6 Update `frontend/src/pages/receptionist/ReceptionDashboard.jsx`
    - Stat grids: `grid-cols-2 md:grid-cols-4`
    - Queue preview cards: `w-full`
    - _Requirements: 13.2_

  - [ ] 6.7 Update `frontend/src/pages/receptionist/WalkInBooking.jsx` and `FollowUpBooking.jsx`
    - Form grids: `grid-cols-1 md:grid-cols-2 gap-4`
    - All inputs: `w-full`
    - Submit buttons: `w-full md:w-auto`
    - Patient detail cards: collapsible on mobile — essential info shown, full details in expandable `<details>` or toggle section
    - _Requirements: 11.1, 11.2, 11.5, 13.2, 13.4, 13.5_


- [ ] 7. Web — Clinic Owner management pages
  - [ ] 7.1 Update `frontend/src/pages/owner/ManageStaff.jsx`
    - Wrap table in `<div className="overflow-x-auto rounded-xl border border-gray-100">`
    - Hide `Email` column on xs: `hidden sm:table-cell`
    - Action buttons: icon-only on xs (`sm:hidden` for labels, `hidden sm:inline` for icons-with-labels)
    - Search/filter row above table: `flex-col sm:flex-row gap-3`
    - Add/edit staff modal: full-screen on mobile (`.modal-mobile-full`), centered dialog on `md+`
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6, 12.7_

  - [ ] 7.2 Update `frontend/src/pages/owner/SessionManagement.jsx`
    - Session cards: `grid-cols-1 md:grid-cols-2 gap-4`
    - Time picker inputs: `w-full`
    - _Requirements: 11.1, 11.2_

  - [ ] 7.3 Update `frontend/src/pages/owner/OwnerAppointments.jsx`
    - Wrap table in `<div className="overflow-x-auto">`
    - Hide date/time detail columns on xs: `hidden md:table-cell`
    - Pagination: compact layout on mobile (prev/next only)
    - _Requirements: 12.1, 12.4_

  - [ ] 7.4 Update `frontend/src/pages/owner/QueueOverview.jsx`
    - Queue cards: `w-full grid-cols-1 sm:grid-cols-2`
    - Stats: `text-xl md:text-2xl`
    - _Requirements: 13.1_

  - [ ] 7.5 Update `frontend/src/pages/owner/ClinicProfile.jsx`
    - Profile header: `flex-col sm:flex-row`
    - Info/edit form grid: `grid-cols-1 md:grid-cols-2 gap-4`
    - Map (`ClinicLocationPicker`): `height: 300px; width: 100%`
    - _Requirements: 11.1, 11.6_


- [ ] 8. Web — Auth pages and registration forms
  - [ ] 8.1 Update `frontend/src/pages/auth/LoginPage.jsx`
    - Container: `max-w-sm sm:max-w-md mx-auto`
    - Feature chips row: `flex flex-wrap gap-2`
    - All inputs: `w-full`
    - _Requirements: 11.1_

  - [ ] 8.2 Update `frontend/src/pages/auth/DoctorRegisterPage.jsx`
    - Multi-step form: `grid-cols-1 md:grid-cols-2 gap-4`
    - File upload areas: `w-full min-h-[120px]`
    - Section headers: `text-lg md:text-xl`
    - Submit button: `w-full md:w-auto`
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ] 8.3 Update `frontend/src/pages/auth/ClinicOwnerRegisterPage.jsx`
    - Same pattern as `DoctorRegisterPage`: multi-step grid, file uploads, section headers
    - Stepper (`.stepper-mobile-scroll`): already has scroll on mobile — verify it applies correctly at all breakpoints
    - _Requirements: 11.1, 11.2, 11.3, 11.5_


- [ ] 9. Web — Admin pages, notifications, and remaining pages
  - [ ] 9.1 Update `frontend/src/pages/admin/UsersManagement.jsx`
    - Wrap table in `<div className="overflow-x-auto">`
    - Hide email/phone columns on xs: `hidden sm:table-cell`
    - Search row: `flex-col sm:flex-row gap-3`
    - Action buttons: icon-only on xs
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

  - [ ] 9.2 Update `frontend/src/pages/admin/ClinicVerification.jsx`
    - Wrap table in `<div className="overflow-x-auto">`
    - Clinic detail columns: `hidden md:table-cell` for secondary info
    - Filter row: `flex-col sm:flex-row gap-3`
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ] 9.3 Update `frontend/src/pages/admin/AdminNotifications.jsx`
    - Notification list: `w-full max-w-3xl mx-auto`
    - Notification cards: `w-full` — no fixed widths
    - _Requirements: 7.2_

  - [ ] 9.4 Update `frontend/src/pages/notifications/NotificationsPage.jsx` and `NotificationSettingsPage.jsx`
    - Notification list: `w-full max-w-3xl mx-auto px-4 sm:px-6`
    - Cards: `w-full` — no fixed widths; `flex-col sm:flex-row` for action rows
    - _Requirements: 7.2_

  - [ ] 9.5 Update `frontend/src/pages/patient/DoctorProfile.jsx`
    - Profile image: `w-full aspect-video object-cover`
    - Info cards (rating/experience/fee): `flex flex-wrap gap-3`
    - _Requirements: 15.5, 15.6_

  - [ ] 9.6 Update `frontend/src/pages/patient/MyAppointments.jsx`
    - Appointment cards: `w-full`; list container: `max-w-3xl mx-auto px-4 sm:px-6`
    - Filter row: `flex-col sm:flex-row gap-3`
    - _Requirements: 7.2_


- [ ] 10. Checkpoint — Web layer complete
  - Ensure all web pages render without horizontal overflow on 375px, 768px, and 1280px viewport widths
  - Verify DashboardLayout shows desktop sidebar at 1280px, icon-only sidebar at 900px, bottom nav at 375px
  - Ask the user if any adjustments are needed before proceeding to shared UI components.

- [ ] 11. Shared web UI components — Modal, DataTable wrapper, touch targets
  - [ ] 11.1 Update `frontend/src/components/ui/Modal.jsx`
    - Add size-aware classes: `fixed inset-0 md:inset-auto md:relative w-full md:w-auto md:max-w-{size} md:rounded-2xl`
    - On `< 768px`: full-screen (no top border-radius), close button top-right, `overflow-y: auto`
    - Accept `size` prop: `'sm' | 'md' | 'lg' | 'xl'`, mapping to `max-w-md | max-w-lg | max-w-2xl | max-w-4xl`
    - _Requirements: 12.7_

  - [ ] 11.2 Add reusable `TableWrapper` component at `frontend/src/components/ui/TableWrapper.jsx`
    - Renders `<div className="overflow-x-auto rounded-xl border border-gray-100">` wrapping `{children}`
    - Apply to all data tables via wrapper import (ManageStaff, OwnerAppointments, UsersManagement, ClinicVerification, DoctorAppointments already updated in tasks 6–9)
    - _Requirements: 12.1_

  - [ ] 11.3 Apply `.touch-target` class to small interactive elements
    - Notification bell button in `DashboardLayout`: change to `w-11 h-11 md:w-9 md:h-9`
    - Table row action icon buttons: wrap in `<span className="touch-target">` or add `p-2.5` container
    - Sidebar nav links: add `min-h-[44px]` to existing `py-2.5` links
    - Small `icon-only` buttons in tables: `w-11 h-11 md:w-9 md:h-9`
    - _Requirements: design §12_


- [ ] 12. React Native — Authentication and onboarding screens
  - [ ] 12.1 Update `src/screens/LoginScreen.jsx`
    - Wrap root in `<SafeAreaView style={{ flex: 1 }}>`
    - Add `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>`
    - Wrap content in `<ScrollView contentContainerStyle={{ flexGrow: 1 }}>`
    - Inner container: `{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: rs(24) }`
    - Logo: `{ width: '60%', maxWidth: 200, resizeMode: 'contain' }`
    - Inputs: `{ width: '100%' }`
    - Submit button: `{ width: '100%', maxWidth: 400, alignSelf: 'center' }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 12.2 Update `src/screens/OtpScreen.jsx`
    - Apply same `SafeAreaView` + `KeyboardAvoidingView` + `ScrollView` wrapper as `LoginScreen`
    - OTP digit inputs: `flexDirection: 'row'`, each cell `flex: 1, marginHorizontal: 4`
    - _Requirements: 2.1, 2.2, 2.7_

  - [ ] 12.3 Update `src/screens/WelcomeScreen.jsx` and `src/screens/OnboardingScreen.jsx`
    - Root: `<SafeAreaView>` + `<ScrollView>`
    - All fixed-width containers: replace with `width: '100%'` + `maxWidth` caps
    - _Requirements: 2.1, 2.8_


- [ ] 13. React Native — Home and Search screens
  - [ ] 13.1 Update `src/screens/HomeScreen.jsx`
    - Import and use `useResponsive` hook
    - `FlatList` for nearby doctors: `numColumns={isTablet ? 2 : 1}`, `key={isTablet ? 'tablet' : 'phone'}`
    - Search bar: `{ flex: 1, maxWidth: 640, alignSelf: 'center' }`
    - Section headers: `fontSize: rf(16)` (subtitle base)
    - Doctor card images: `width: '100%', aspectRatio: 16/9, resizeMode: 'cover'`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1, 15.2, 15.3_

  - [ ] 13.2 Update `src/screens/SearchScreen.jsx`
    - Root: `<ScrollView>`
    - Specialization chips: `flexWrap: 'wrap'`
    - Doctor info cards: `flexWrap: 'wrap'` in info row; tablet 3-column, phone 2-column
    - All text: `flexShrink: 1` to prevent overflow
    - _Requirements: 4.1, 4.3, 4.4, 4.6, 4.7_

  - [ ] 13.3 Update `src/screens/DoctorDetailScreen.jsx`
    - Root: `<ScrollView>`
    - Profile image: `width: '100%', aspectRatio: 16/9, resizeMode: 'cover'`
    - Info cards (rating/experience/fee): `flexDirection: 'row', flexWrap: 'wrap'`; tablet 3-col, phone 2-col
    - "Book Appointment" button: sticky bottom via `position: 'absolute', bottom: insets.bottom + 16`
    - All text: `flexShrink: 1` or `flex: 1`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_


- [ ] 14. React Native — Booking screen
  - [ ] 14.1 Update `src/screens/BookingScreen.jsx`
    - Date strip: `<ScrollView horizontal showsHorizontalScrollIndicator={false}>` with each cell `{ width: rs(72), alignItems: 'center', marginHorizontal: 4 }`
    - Session cards: `flexDirection: 'row', flexWrap: 'wrap'`; each card `flex: 1, minWidth: rs(140), margin: 4`
    - Slot grid `FlatList`: `numColumns={isTablet ? 4 : 3}`
    - "Book Now" footer: `position: 'absolute', bottom: 0, paddingBottom: insets.bottom + 16`, full width
    - Tablet centering: outer container `maxWidth: 600, alignSelf: 'center'`
    - Notes input: wrapped in `<KeyboardAvoidingView>`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_


- [ ] 15. React Native — Live Queue, Appointments, Notifications, Profile, Payments
  - [ ] 15.1 Update `src/screens/LiveQueueScreen.jsx`
    - Root: `<SafeAreaView>` + `<ScrollView>`
    - Queue position number: `fontSize: isTablet ? rf(48) : rf(64)`
    - Queue status card: `{ width: '90%', maxWidth: 400, alignSelf: 'center' }`
    - Waiting list `FlatList`: add `estimatedItemSize` (or `getItemLayout`), `refreshControl` prop for pull-to-refresh
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 15.2 Update `src/screens/AppointmentsScreen.jsx`
    - `FlatList`: `contentContainerStyle={{ paddingHorizontal: rs(16) }}`
    - Appointment cards: `width: '100%'` — remove any fixed pixel widths
    - Add `keyExtractor` and `React.memo` wrapper on the appointment card component
    - _Requirements: 7.1, 7.2, 16.2, 16.3_

  - [ ] 15.3 Update `src/screens/NotificationsScreen.jsx`
    - Same pattern as `AppointmentsScreen`: `FlatList` with `contentContainerStyle`, cards `w-full`, `React.memo` on items
    - _Requirements: 7.1, 7.2, 16.2, 16.3_

  - [ ] 15.4 Update `src/screens/ProfileScreen.jsx`
    - Avatar: `{ width: rs(80), height: rs(80), borderRadius: rs(40), resizeMode: 'cover' }`
    - Action buttons: `width: '100%', paddingVertical: rs(14)` minimum
    - Tablet: outer container `{ maxWidth: 600, alignSelf: 'center' }`
    - _Requirements: 7.3, 7.4, 7.6, 15.1, 15.2_

  - [ ] 15.5 Update `src/screens/EditProfileScreen.jsx`
    - Root: `<SafeAreaView>` + `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>` + `<ScrollView>`
    - All inputs: `width: '100%'`
    - Tablet: content `{ maxWidth: 600, alignSelf: 'center' }`
    - _Requirements: 7.5, 7.6, 2.2_

  - [ ] 15.6 Update `src/screens/PaymentsScreen.jsx`
    - Root: `<SafeAreaView>` + `<ScrollView>`
    - Payment summary card: `width: '100%'`
    - "Pay Now" button: `width: '100%'` on phone; `{ maxWidth: 400, alignSelf: 'center' }` on tablet
    - `WebView` (Razorpay): `flex: 1`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_


- [ ] 16. Checkpoint — React Native layer complete
  - Verify all RN screens render correctly on a 375px phone and a 768px tablet emulator/simulator
  - Confirm orientation change reflowing works on HomeScreen (FlatList remounts with new `key`)
  - Ensure keyboard does not obscure inputs on LoginScreen, OtpScreen, EditProfileScreen, BookingScreen
  - Ask the user if any adjustments are needed before proceeding to performance optimizations.

- [ ] 17. Performance optimizations — React Native FlatList and memoization
  - [ ] 17.1 Add `React.memo` to all list item components
    - Wrap doctor card component (used in `HomeScreen`, `SearchScreen`) with `React.memo`
    - Wrap appointment card component (used in `AppointmentsScreen`, `DoctorAppointments`) with `React.memo`
    - Wrap notification item component (used in `NotificationsScreen`, `AdminNotifications`) with `React.memo`
    - _Requirements: 16.3_

  - [ ] 17.2 Add `useMemo` to expensive computations in RN screens
    - `HomeScreen`: wrap filtered doctor list in `useMemo` dependent on search query and raw list
    - `AppointmentsScreen`: wrap filtered/sorted appointments in `useMemo`
    - `SearchScreen`: wrap filtered results in `useMemo` dependent on filter state
    - _Requirements: 16.4_

  - [ ] 17.3 Add `FlatList` performance props across all long lists
    - All `FlatList` components: add `keyExtractor={(item) => item.id.toString()}` (or equivalent unique field)
    - Lists with fixed item heights: add `getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}`
    - All long lists: add `initialNumToRender={8}`, `removeClippedSubviews={true}`
    - `HomeScreen` doctor list: `maxToRenderPerBatch={10}`, `windowSize={5}`
    - _Requirements: 16.1, 16.2, 16.7, 16.8_


- [ ] 18. Performance optimizations — Web lazy loading and image optimization
  - [ ] 18.1 Wrap web chart components in `React.lazy` + `<Suspense>`
    - In `OwnerDashboard.jsx`: wrap `RevenueTrendChart`, `AppointmentTrendChart`, `DoctorPerformanceBar` imports with `React.lazy(() => import(...))`
    - Add `<Suspense fallback={<div className="animate-shimmer h-48 rounded-xl" />}>` around each chart render
    - Apply same pattern to any chart in `AdminDashboard.jsx` and `DoctorDashboard.jsx`
    - _Requirements: 16.5_

  - [ ] 18.2 Add `loading="lazy"` to all web `<img>` tags in card components
    - Doctor card images in `DoctorSearch`, `PatientDashboard`, `DoctorProfile`: `<img loading="lazy" className="w-full h-auto object-cover" />`
    - Clinic/avatar images in `ManageStaff`, `OwnerDashboard`: same pattern
    - _Requirements: 16.6, 15.5_


- [ ] 19. Typography — responsive font sizes web and React Native
  - [ ] 19.1 Apply Tailwind responsive text classes to all web page headings
    - Page `<h1>` elements: `text-xl md:text-2xl`
    - Section `<h2>` elements: `text-base md:text-lg`
    - Stat numbers: `text-2xl md:text-3xl`
    - Apply across: `AdminDashboard`, `OwnerDashboard`, `PatientDashboard`, `DoctorDashboard`, `ReceptionDashboard`, `ManageStaff`, `OwnerAppointments`
    - _Requirements: 14.4_

  - [ ] 19.2 Apply `rf()` for all font sizes in React Native screens
    - Base sizes: body=14, caption=12, subtitle=16, title=20, header=24
    - Replace hardcoded `fontSize` values with `rf(N)` calls using `useResponsive` hook in screens updated in tasks 12–15
    - Ensure no text is truncated unintentionally — use `numberOfLines` + `ellipsizeMode="tail"` only on list card titles
    - _Requirements: 14.1, 14.2, 14.3, 14.6_

- [ ] 20. Final checkpoint — full platform responsive verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no horizontal scroll on web at 375px, 768px, 1280px
  - Verify DashboardLayout three modes: desktop full sidebar / tablet icon-only / mobile bottom nav
  - Verify RN FlatList remounts correctly on orientation change in HomeScreen
  - Verify keyboard-avoiding on LoginScreen, OtpScreen, EditProfileScreen, BookingScreen
  - Verify all touch targets are ≥ 44×44px in DashboardLayout nav and table action buttons
  - Verify chart lazy loading shows shimmer fallback before chart renders


## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements from `.kiro/specs/full-responsive/requirements.md` for traceability
- Checkpoints (tasks 10, 16, 20) are natural pause points to verify before moving to the next layer
- No business logic, API calls, or branding is changed — all changes are layout/sizing/utility only
- The design document (`.kiro/specs/full-responsive/design.md`) contains exact code snippets for every component; refer to it during implementation
- Tailwind classes must be complete strings (not dynamically constructed) so PurgeCSS doesn't strip them
- The `useResponsive` hook (RN) must be imported as a named import from `src/hooks/useResponsive`
- The `useBreakpoint` hook (web) must be imported from `frontend/src/hooks/useBreakpoint`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "2.1"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "5.1", "5.2", "5.3", "5.4", "5.5", "12.1", "12.2", "12.3"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "7.1", "7.2", "7.3", "7.4", "7.5", "8.1", "8.2", "8.3", "13.1", "13.2", "13.3"] },
    { "id": 4, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "11.1", "11.2", "11.3", "14.1", "15.1", "15.2", "15.3", "15.4", "15.5", "15.6"] },
    { "id": 5, "tasks": ["17.1", "17.2", "17.3", "18.1", "18.2"] },
    { "id": 6, "tasks": ["19.1", "19.2"] }
  ]
}
```
