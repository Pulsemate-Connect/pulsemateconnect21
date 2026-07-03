# Requirements Document

## Introduction

PulseMate Connect is a healthcare platform with two surfaces: a React Native mobile app (patient-facing) and a React/Vite web app (clinic owner, doctor, and receptionist panels). Currently many screens use fixed pixel widths and heights that break on tablets, landscape orientation, and various phone sizes. This feature makes the entire application fully responsive across Android phones, Android tablets, iPhones, iPads, and web (mobile, tablet, desktop) without changing any existing branding, colors, or business logic.

## Glossary

- **Breakpoint**: A screen-width threshold at which layout changes (mobile < 768px, tablet 768–1024px, desktop > 1024px)
- **Safe Area**: The portion of the screen not obscured by notches, status bars, or home indicators
- **Touch Target**: The minimum tappable area for interactive elements (44×44px)
- **useResponsive**: A shared React Native hook providing breakpoint-aware layout values
- **Fluid Layout**: A layout that scales proportionally rather than using fixed pixel values
- **FlatList**: React Native's performant scrollable list component
- **KeyboardAvoidingView**: A React Native component that adjusts layout when the software keyboard appears
- **Adaptive Grid**: A CSS/RN grid whose column count changes based on screen width

## Requirements

### Requirement 1: Shared Responsive Utilities

**User Story:** As a developer, I want shared responsive utilities so that all screens use consistent breakpoints and scaling logic.

#### Acceptance Criteria

1. THE app SHALL provide a `useResponsive` hook in `src/hooks/useResponsive.js` that returns `{ width, height, isPhone, isTablet, isDesktop, scale, fontScale }`
2. THE hook SHALL use `useWindowDimensions()` so it updates on orientation change
3. THE hook SHALL define breakpoints: phone < 600px, tablet 600–1024px, desktop > 1024px
4. THE hook SHALL expose a `rs(value)` (responsive scale) function: `value * (width / 375)` clamped between `value * 0.8` and `value * 1.5`
5. THE hook SHALL expose an `rf(size)` (responsive font) function using `PixelRatio.getFontScale()`
6. THE web app SHALL provide a shared `useBreakpoint` hook in `frontend/src/hooks/useBreakpoint.js` using `window.innerWidth` and a `resize` event listener
7. THE web app SHALL define CSS custom properties `--cols-dashboard: 4` (desktop), `2` (tablet), `1` (mobile) via media queries in `frontend/src/index.css`
8. WHEN screen orientation changes on mobile, THE layouts SHALL reflow without requiring a page reload

### Requirement 2: React Native — Authentication & Onboarding Screens

**User Story:** As a patient, I want the login, OTP, and profile setup screens to display correctly on all phone sizes and tablets so I can complete registration without layout issues.

#### Acceptance Criteria

1. THE `LoginScreen`, `OtpScreen`, `WelcomeScreen`, `OnboardingScreen` SHALL use `SafeAreaView` as the root container
2. THE screens SHALL use `KeyboardAvoidingView` with `behavior="padding"` on iOS and `behavior="height"` on Android
3. ALL text inputs SHALL have `width: '100%'` and `maxWidth: 480` centered on tablet
4. THE logo image SHALL use `width: '60%'` with `maxWidth: 200` and `resizeMode: 'contain'`
5. THE "Continue" / "Login" buttons SHALL be full width on phones and `maxWidth: 400` centered on tablets
6. WHEN the keyboard is open, THE submit button SHALL remain visible above the keyboard
7. THE OTP digit inputs SHALL be evenly spaced using `flexDirection: 'row'` and `flex: 1` with `marginHorizontal: 4`
8. THE `ProfileWizardScreen` SHALL use `ScrollView` so all fields are reachable on small screens

### Requirement 3: React Native — Home Screen

**User Story:** As a patient, I want the home screen to adapt its grid layout for tablets so I can see more content without wasted space.

#### Acceptance Criteria

1. THE `HomeScreen` SHALL use `useWindowDimensions()` to determine column count
2. ON phones (width < 600) the doctor/clinic cards SHALL display in a single column
3. ON tablets (width ≥ 600) the doctor/clinic cards SHALL display in a 2-column grid
4. THE search bar SHALL use `flex: 1` with `maxWidth: 640` centered
5. THE section headers SHALL use responsive font sizes via `rf()`
6. THE `FlatList` for nearby doctors SHALL have `numColumns` driven by the breakpoint
7. WHEN `numColumns` changes on orientation change, THE `FlatList` SHALL use a `key` prop to remount

### Requirement 4: React Native — Doctor & Clinic Detail Screens

**User Story:** As a patient, I want doctor and clinic detail pages to be readable on any screen size.

#### Acceptance Criteria

1. THE `DoctorDetailScreen` and `SearchScreen` SHALL use `ScrollView` as their root
2. THE doctor profile image SHALL use `width: '100%'` with `aspectRatio: 16/9` and `resizeMode: 'cover'`
3. THE info cards (rating, experience, fee) SHALL wrap using `flexWrap: 'wrap'` in a row
4. ON tablets, the info cards SHALL display in a 3-column row; on phones in a 2-column row
5. THE "Book Appointment" button SHALL be sticky at the bottom using `position: 'absolute'` with `bottom: safeAreaInsets.bottom + 16`
6. THE specialization chips SHALL use `flexWrap: 'wrap'` to prevent overflow
7. ALL text SHALL use `flexShrink: 1` or `flex: 1` to prevent overflow beyond screen width

### Requirement 5: React Native — Booking Screen (Date, Session, Slot Selection)

**User Story:** As a patient, I want the booking flow to work correctly on all screen sizes so I can select dates, sessions, and slots without overflow.

#### Acceptance Criteria

1. THE date strip SHALL use a `ScrollView` with `horizontal={true}` and `showsHorizontalScrollIndicator={false}`
2. Each date cell SHALL have a fixed width of `rs(72)` so it scales proportionally
3. THE session cards SHALL use `flexDirection: 'row'` and `flexWrap: 'wrap'` to flow into multiple rows on small screens
4. Each session card SHALL have `flex: 1` with `minWidth: rs(140)` and `margin: 4`
5. THE slot grid SHALL use `FlatList` with `numColumns={isTablet ? 4 : 3}`
6. THE "Book Now" footer button SHALL be fixed at the bottom with safe area padding
7. ON tablets, the booking form SHALL be centered with `maxWidth: 600` and `alignSelf: 'center'`
8. THE `KeyboardAvoidingView` SHALL wrap the notes input field

### Requirement 6: React Native — Queue & Live Queue Screens

**User Story:** As a patient, I want the queue screen to display my position and queue details clearly on any device.

#### Acceptance Criteria

1. THE `LiveQueueScreen` SHALL use `SafeAreaView` and `ScrollView`
2. THE queue position number SHALL use responsive font size: `rf(64)` on phone, `rf(48)` on tablet
3. THE queue status card SHALL use `width: '90%'` with `maxWidth: 400` and `alignSelf: 'center'`
4. THE waiting patients list SHALL use `FlatList` with `estimatedItemSize` for performance
5. THE screen SHALL support pull-to-refresh via `refreshControl` prop

### Requirement 7: React Native — Appointment History, Notifications, Profile

**User Story:** As a patient, I want list screens (appointments, notifications, profile) to be well-spaced and readable on all screen sizes.

#### Acceptance Criteria

1. THE `AppointmentsScreen` and `NotificationsScreen` SHALL use `FlatList` with `contentContainerStyle={{ paddingHorizontal: rs(16) }}`
2. List cards SHALL use `width: '100%'` — never a fixed pixel width
3. THE `ProfileScreen` avatar SHALL use `width: rs(80)`, `height: rs(80)`, `borderRadius: rs(40)`
4. Action buttons in profile SHALL be full width with `paddingVertical: rs(14)` minimum
5. THE `EditProfileScreen` SHALL use `KeyboardAvoidingView` + `ScrollView` so all fields are accessible when keyboard is open
6. ON tablets, profile content SHALL be centered with `maxWidth: 600`

### Requirement 8: React Native — Payments Screen

**User Story:** As a patient, I want the payment screen to display correctly on all screen sizes.

#### Acceptance Criteria

1. THE `PaymentsScreen` and `RazorpayScreen` SHALL use `SafeAreaView` and `ScrollView`
2. THE payment summary card SHALL use `width: '100%'` — never fixed pixel width
3. THE "Pay Now" button SHALL be full width on phones, `maxWidth: 400` centered on tablets
4. THE `WebView` for Razorpay SHALL use `flex: 1` to fill available space

### Requirement 9: Web — Shared Layout Components

**User Story:** As a clinic owner/doctor/receptionist, I want the web portal's navigation and layout to adapt to all screen sizes.

#### Acceptance Criteria

1. THE `DashboardLayout.jsx` sidebar SHALL be visible as a fixed left panel on desktop (width ≥ 1024px)
2. ON tablet (768–1024px) the sidebar SHALL collapse to icon-only mode by default
3. ON mobile (< 768px) the sidebar SHALL be hidden by default and slide in as a drawer on hamburger menu tap
4. THE hamburger button SHALL be visible only on mobile and tablet (`lg:hidden`)
5. THE main content area SHALL use `ml-0 lg:ml-64` to account for the sidebar
6. THE `DashboardLayout` header SHALL be sticky (`position: sticky; top: 0; z-index: 40`)
7. THE layout SHALL prevent horizontal overflow via `overflow-x: hidden` on the root
8. THE sidebar SHALL close automatically when a nav link is clicked on mobile

### Requirement 10: Web — Clinic Owner Dashboard

**User Story:** As a clinic owner, I want the dashboard to display metric cards in an adaptive grid so the layout works on all devices.

#### Acceptance Criteria

1. THE dashboard metric cards SHALL use CSS Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
2. THE revenue charts SHALL use `ResponsiveContainer width="100%"` from Recharts
3. THE recent transactions table SHALL use `overflow-x-auto` wrapper on mobile
4. THE table cells SHALL use `whitespace-nowrap` to prevent text wrapping inside cells
5. THE filter bar SHALL collapse to a stacked column layout on mobile
6. THE date range picker SHALL not overflow the viewport on any screen size
7. ALL cards SHALL use `w-full` — never fixed pixel widths
8. THE quick action buttons SHALL use a 2-column grid on mobile, 3-column on tablet, 5-column on desktop

### Requirement 11: Web — Forms (Clinic Registration, Staff Management)

**User Story:** As a clinic owner, I want all forms to be usable on mobile browsers without inputs being clipped or overflowing.

#### Acceptance Criteria

1. ALL form inputs SHALL use `w-full` with `max-w-lg` on wider screens
2. THE two-column form grid SHALL collapse to single column on mobile: `grid-cols-1 md:grid-cols-2`
3. THE file upload areas SHALL use `w-full` with `min-h-[120px]`
4. THE form validation messages SHALL appear below the input without overflowing
5. THE submit button SHALL be full width on mobile, auto width centered on desktop
6. THE `ClinicLocationPicker` map SHALL have a fixed `height: 300px` with `width: 100%`
7. Dropdowns/selects SHALL not overflow the viewport on small screens (`max-w-full`)

### Requirement 12: Web — Doctor, Receptionist, and Appointment Management Tables

**User Story:** As a clinic owner, I want management tables to be usable on small screens without breaking.

#### Acceptance Criteria

1. ALL data tables SHALL be wrapped in `<div className="overflow-x-auto">`
2. TABLE headers SHALL use `text-xs` on mobile to fit more columns
3. ON mobile (< 768px), non-essential table columns SHALL be hidden using `hidden sm:table-cell`
4. THE pagination controls SHALL use a compact layout on mobile (prev/next only, no page numbers)
5. THE search/filter row above tables SHALL stack vertically on mobile
6. Action buttons in table rows SHALL use icon-only on mobile (`sm:hidden` for labels)
7. THE modal for add/edit staff SHALL be full-screen on mobile, centered dialog on desktop

### Requirement 13: Web — Doctor and Receptionist Panels

**User Story:** As a doctor or receptionist, I want my panel screens to work correctly on all devices.

#### Acceptance Criteria

1. THE `DoctorDashboard`, `DoctorQueue`, `DoctorAppointments` pages SHALL use the same responsive grid as the clinic owner dashboard
2. THE `ReceptionDashboard`, `TodayQueue`, `WalkInBooking` pages SHALL be fully responsive
3. THE queue display SHALL use cards stacked vertically on mobile, a table on desktop
4. THE `WalkInBooking` form SHALL use `KeyboardAvoidingView` equivalent — no inputs hidden behind the keyboard on mobile web
5. ON mobile, patient detail cards SHALL show essential info only; full details in an expandable section

### Requirement 14: Typography Scaling

**User Story:** As a user, I want text to be readable on all screen sizes without being too small or too large.

#### Acceptance Criteria

1. THE React Native app SHALL use `rf()` from `useResponsive` for all font sizes
2. THE base font sizes SHALL be: body=14, caption=12, subtitle=16, title=20, header=24
3. AFTER scaling, font sizes SHALL be clamped: minimum 11px, maximum 28px
4. THE web app SHALL use Tailwind's responsive text classes (`text-sm md:text-base lg:text-lg`)
5. Line heights SHALL be at least 1.4× the font size on all platforms
6. NO text SHALL be truncated unintentionally — use `numberOfLines` with `ellipsizeMode` only in list cards

### Requirement 15: Images and Media

**User Story:** As a user, I want images to display correctly without stretching, cropping, or overflowing.

#### Acceptance Criteria

1. ALL React Native images SHALL specify `resizeMode` explicitly
2. Profile/avatar images SHALL use `resizeMode: 'cover'` with equal `width` and `height`
3. Banner/hero images SHALL use `width: '100%'` with `aspectRatio` and `resizeMode: 'cover'`
4. Icon images SHALL use fixed small sizes (24×24, 32×32) that do not scale
5. THE web app SHALL use `object-fit: cover` or `object-fit: contain` on all `<img>` tags
6. Images in web cards SHALL use `w-full h-auto` or `aspect-ratio` CSS

### Requirement 16: Performance Optimization

**User Story:** As a user, I want the app to remain smooth and fast on all devices even with many list items.

#### Acceptance Criteria

1. ALL `FlatList` components SHALL specify `getItemLayout` when item heights are fixed
2. ALL `FlatList` components SHALL specify `keyExtractor` returning a unique string
3. `React.memo` SHALL be applied to all list item components (doctor cards, appointment cards, notification items)
4. `useMemo` SHALL be applied to expensive computations (filtered lists, chart data transformations)
5. Chart components in the web app SHALL be wrapped in `React.lazy` with `<Suspense>` fallback
6. Images SHALL use lazy loading: `loading="lazy"` on web, and deferred rendering on React Native lists
7. THE `FlatList` `initialNumToRender` SHALL be set to the number of items visible in the viewport
8. `removeClippedSubviews={true}` SHALL be set on all long `FlatList` components
