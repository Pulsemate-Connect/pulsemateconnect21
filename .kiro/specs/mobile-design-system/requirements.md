# Requirements Document

## Introduction

This feature defines a unified Mobile-First Design System for the PulseMate React Native (Expo) patient app. The design system establishes a single source of truth for spacing, typography, component dimensions, responsive breakpoints, and accessibility rules. All key screens — HomeScreen, ProfileScreen, BookingScreen, AppointmentsScreen, LiveQueueScreen, MainNavigator (bottom tab bar), SearchScreen, and DoctorDetailScreen — must conform to the system tokens and layout rules. The target audience includes all age groups, with explicit elderly-user and accessibility considerations.

---

## Glossary

- **Design_System**: The module (`src/theme/designSystem.js`) that exports all spacing, typography, colour, and component tokens.
- **Screen**: A React Native component that represents a full-page view routed through React Navigation.
- **Token**: A named constant (e.g. `SPACING.horizontal`, `TYPOGRAPHY.pageTitle`) that maps a design decision to a concrete value.
- **Safe_Area**: The device region that avoids notches, status bars, and home indicators, managed by `react-native-safe-area-context`.
- **Touch_Target**: The minimum tappable area of an interactive element as defined by accessibility guidelines.
- **Responsive_Breakpoint**: A screen-width threshold at which layout tokens adjust their values.
- **Bottom_Nav**: The custom bottom tab bar implemented in `MainNavigator.js`.
- **Profile_Card**: The hero card at the top of ProfileScreen displaying the user's avatar, name, and edit button.
- **Quick_Action_Card**: A tappable shortcut card used on HomeScreen and ProfileScreen.
- **Appointment_Summary_Card**: A compact horizontally-scrollable card summarising a single appointment on ProfileScreen.
- **Stats_Card**: A numeric summary tile (Total / Completed / Upcoming / Cancelled) displayed in a horizontal row.
- **Live_Queue_Screen**: The real-time queue tracker screen showing queue number, status badge, and stats cards.
- **Input_Field**: Any `TextInput` component used for data entry across all screens.
- **Primary_Button**: A full-width call-to-action button (e.g. "Proceed to Pay", "Save Changes", "Confirm Booking").
- **Content_Max_Width**: The maximum width constraint (`480px`) applied to all content containers to avoid over-stretching on tablets.

---

## Requirements

### Requirement 1: Design System Token Module

**User Story:** As a developer, I want a single shared token file, so that every screen references consistent values for spacing, typography, colours, and component dimensions rather than hard-coding magic numbers.

#### Acceptance Criteria

1. THE Design_System SHALL export a `SPACING` object containing: `horizontal: 20`, `verticalSectionGap: 24`, `cardPadding: 16`.
2. THE Design_System SHALL export a `RADIUS` object containing: `card: 20`, `button: 16`, `input: 14`, `appointmentCard: 18`, `activePill: 16`, `statusBadge: 12`.
3. THE Design_System SHALL export a `TYPOGRAPHY` object containing font-size and font-weight pairs for: `pageTitle` (36px Bold), `sectionTitle` (24px SemiBold), `cardTitle` (18px SemiBold), `body` (16px Regular), `small` (14px Regular), `caption` (12px Regular).
4. THE Design_System SHALL export a `COMPONENT_SIZES` object containing dimensions for: `profileCardHeight: 220`, `avatarSize: 90`, `editButtonHeight: 52`, `quickActionCardHeight: 90`, `iconContainerSize: 56`, `primaryButtonHeight: 56`, `inputFieldHeight: 56`, `appointmentSummaryCardHeight: 90`, `appointmentSummaryCardWidth` range `80–90`, `bottomNavHeight: 80`, `bottomNavIconSize: 24`, `bottomNavLabelSize: 12`, `liveQueueNumberFontSize: 64`, `statusBadgeHeight: 36`, `statsCardHeight: 90`.
5. THE Design_System SHALL export a `TOUCH_TARGET` constant with value `48`.
6. THE Design_System SHALL export a `CONTENT_MAX_WIDTH` constant with value `480`.
7. THE Design_System SHALL export a `BASE_SCREEN` object with `width: 390` and `height: 844`.
8. THE Design_System SHALL export a `BREAKPOINTS` object with entries: `smallAndroid: 360`, `standard: 390`, `largeAndroid: 412`, `tablet: 768`.

---

### Requirement 2: Responsive Layout Utility

**User Story:** As a developer, I want a responsive scaling utility, so that spacing and font sizes adapt to the device screen width without manual per-screen calculations.

#### Acceptance Criteria

1. THE Design_System SHALL export a `scale(value)` function that returns `Math.round(value * (screenWidth / BASE_SCREEN.width))` for any numeric input.
2. WHEN the device screen width is less than `BREAKPOINTS.smallAndroid`, THE Design_System SHALL apply a `0.92` multiplier to all spacing tokens when accessed via a `getResponsiveSpacing()` helper.
3. WHEN the device screen width is greater than or equal to `BREAKPOINTS.tablet`, THE Design_System SHALL apply a `1.15` multiplier to all spacing tokens when accessed via `getResponsiveSpacing()`.
4. WHEN the device screen width is between `BREAKPOINTS.smallAndroid` and `BREAKPOINTS.tablet` (exclusive), THE Design_System SHALL return spacing tokens unmodified via `getResponsiveSpacing()`.
5. THE Design_System SHALL export a `isTablet()` boolean function that returns `true` when screen width is greater than or equal to `BREAKPOINTS.tablet`.

---

### Requirement 3: Content Width Constraint

**User Story:** As a user on a tablet or large Android device, I want content to stay centred and not stretch to the full screen width, so that the UI remains readable and aesthetically balanced.

#### Acceptance Criteria

1. THE Design_System SHALL export a `ContentContainer` React Native component that wraps its children in a `View` with `maxWidth: CONTENT_MAX_WIDTH` and `alignSelf: 'center'` and `width: '100%'`.
2. WHEN the screen width is less than `CONTENT_MAX_WIDTH`, THE ContentContainer SHALL apply no horizontal constraints — including no `maxWidth` and no `alignSelf: 'center'` — and display content at full width.
3. THE HomeScreen SHALL wrap its main scroll content inside `ContentContainer`.
4. THE ProfileScreen SHALL wrap its main scroll content inside `ContentContainer`.
5. THE BookingScreen SHALL wrap its main scroll content inside `ContentContainer`.
6. THE AppointmentsScreen SHALL wrap its main scroll content inside `ContentContainer`.
7. THE LiveQueueScreen SHALL wrap its main scroll content inside `ContentContainer`.
8. THE SearchScreen SHALL wrap its main scroll content inside `ContentContainer`.
9. THE DoctorDetailScreen SHALL wrap its main scroll content inside `ContentContainer`.

---

### Requirement 4: Typography Compliance

**User Story:** As a user, I want consistent and legible text across all screens, so that I can read information without confusion or eye strain.

#### Acceptance Criteria

1. THE HomeScreen SHALL display the page title using `TYPOGRAPHY.pageTitle` (36px Bold).
2. THE ProfileScreen SHALL display the "My Profile" heading using `TYPOGRAPHY.pageTitle` (36px Bold).
3. THE BookingScreen SHALL display section headings using `TYPOGRAPHY.sectionTitle` (24px SemiBold).
4. THE AppointmentsScreen SHALL display the screen title using `TYPOGRAPHY.pageTitle` (36px Bold).
5. THE LiveQueueScreen SHALL display the queue number using `COMPONENT_SIZES.liveQueueNumberFontSize` (64px Bold).
6. THE SearchScreen SHALL display the screen title using `TYPOGRAPHY.pageTitle` (36px Bold).
7. THE DoctorDetailScreen SHALL display the doctor's name using `TYPOGRAPHY.sectionTitle` (24px SemiBold).
8. WHEN any body text is rendered on any Screen, THE Screen SHALL use `TYPOGRAPHY.body` (16px Regular) as the base font size.
9. WHEN any caption or label text is rendered on any Screen, THE Screen SHALL use `TYPOGRAPHY.caption` (12px Regular) or `TYPOGRAPHY.small` (14px Regular) as appropriate.
10. THE Bottom_Nav SHALL display tab labels using `COMPONENT_SIZES.bottomNavLabelSize` (12px).

---

### Requirement 5: Spacing Compliance

**User Story:** As a designer, I want all screens to use the defined spacing tokens for padding and gaps, so that the layout looks harmonious across all devices.

#### Acceptance Criteria

1. THE HomeScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
2. THE ProfileScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
3. THE BookingScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
4. THE AppointmentsScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
5. THE LiveQueueScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
6. THE SearchScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
7. THE DoctorDetailScreen SHALL apply `SPACING.horizontal` (20px) as horizontal padding to all content.
8. WHEN rendering vertical spacing between sections on any Screen, THE Screen SHALL use `SPACING.verticalSectionGap` (24px) as the gap value.
9. WHEN rendering card content on any Screen, THE Screen SHALL use `SPACING.cardPadding` (16px) as the internal card padding.

---

### Requirement 6: Component Dimension Compliance — Profile Card

**User Story:** As a user, I want the profile card to display at a consistent and spacious size, so that my avatar, name, and edit button are easily visible and tappable.

#### Acceptance Criteria

1. THE Profile_Card SHALL have a minimum height of `COMPONENT_SIZES.profileCardHeight` (220px).
2. THE Profile_Card SHALL span the full available width within its parent container.
3. THE Profile_Card avatar SHALL be `COMPONENT_SIZES.avatarSize` × `COMPONENT_SIZES.avatarSize` (90×90px).
4. THE Profile_Card edit button SHALL have a minimum height of `COMPONENT_SIZES.editButtonHeight` (52px) and width of at least `TOUCH_TARGET` (48px).
5. THE Profile_Card SHALL apply `RADIUS.card` (20px) as its border radius.

---

### Requirement 7: Component Dimension Compliance — Quick Action Cards

**User Story:** As a user, I want quick action cards to be large enough to tap easily, especially for elderly users who may have reduced motor precision.

#### Acceptance Criteria

1. THE Quick_Action_Card SHALL have a minimum height of `COMPONENT_SIZES.quickActionCardHeight` (90px).
2. THE Quick_Action_Card SHALL span the full available width within its column.
3. THE Quick_Action_Card icon container SHALL be `COMPONENT_SIZES.iconContainerSize` × `COMPONENT_SIZES.iconContainerSize` (56×56px).
4. THE Quick_Action_Card SHALL apply `RADIUS.card` (20px) as its border radius.
5. THE Quick_Action_Card touch area SHALL be at least `TOUCH_TARGET` × `TOUCH_TARGET` (48×48px).

---

### Requirement 8: Component Dimension Compliance — Primary Buttons

**User Story:** As a user, I want primary action buttons to be tall and full-width, so that they are easy to tap with one hand.

#### Acceptance Criteria

1. THE Primary_Button SHALL have a height of `COMPONENT_SIZES.primaryButtonHeight` (56px).
2. THE Primary_Button SHALL span the full available width within its container.
3. THE Primary_Button SHALL apply `RADIUS.button` (16px) as its border radius.
4. IF a Primary_Button is rendered in a disabled state, THEN THE Primary_Button SHALL maintain its height and width while visually indicating the disabled state through reduced opacity.

---

### Requirement 9: Component Dimension Compliance — Input Fields

**User Story:** As a user, I want input fields to be tall enough and have a large enough font, so that I can read and enter text comfortably.

#### Acceptance Criteria

1. THE Input_Field SHALL have a height of `COMPONENT_SIZES.inputFieldHeight` (56px) for single-line inputs.
2. THE Input_Field SHALL apply `RADIUS.input` (14px) as its border radius.
3. THE Input_Field SHALL use a font size of `TYPOGRAPHY.body` (16px) for all input text.

---

### Requirement 10: Component Dimension Compliance — Appointment Summary Cards

**User Story:** As a user, I want appointment summary cards to be compact and visually distinct, so that I can quickly scan my upcoming appointments.

#### Acceptance Criteria

1. THE Appointment_Summary_Card SHALL have a minimum height of `COMPONENT_SIZES.appointmentSummaryCardHeight` (90px).
2. THE Appointment_Summary_Card width SHALL be between `COMPONENT_SIZES.appointmentSummaryCardWidth` minimum (80px) and maximum (90px) when displayed in a horizontal scroll context.
3. THE Appointment_Summary_Card SHALL apply `RADIUS.appointmentCard` (18px) as its border radius.

---

### Requirement 11: Component Dimension Compliance — Bottom Navigation

**User Story:** As a user, I want the bottom navigation bar to be tall and have clearly labelled icons, so that switching between tabs is comfortable with my thumb.

#### Acceptance Criteria

1. THE Bottom_Nav SHALL have a height of `COMPONENT_SIZES.bottomNavHeight` (80px), excluding the safe area inset.
2. THE Bottom_Nav icons SHALL be `COMPONENT_SIZES.bottomNavIconSize` (24px) in size.
3. THE Bottom_Nav active pill SHALL apply `RADIUS.activePill` (16px) as its border radius.
4. THE Bottom_Nav SHALL support safe area insets by adding the device's bottom inset (treated as zero when the inset is negative) to its base height, such that the total height never falls below `COMPONENT_SIZES.bottomNavHeight` (80px).
5. THE Bottom_Nav touch area for each tab SHALL be at least `TOUCH_TARGET` (48px) in height.

---

### Requirement 12: Component Dimension Compliance — Live Queue Screen

**User Story:** As a patient waiting in a queue, I want to see my queue number in a large, bold font and my status badge clearly, so that I can track my position at a glance.

#### Acceptance Criteria

1. THE Live_Queue_Screen queue number display SHALL use `COMPONENT_SIZES.liveQueueNumberFontSize` (64px) Bold.
2. THE Live_Queue_Screen status badge SHALL have a minimum height of `COMPONENT_SIZES.statusBadgeHeight` (36px).
3. THE Live_Queue_Screen stats cards SHALL have a minimum height of `COMPONENT_SIZES.statsCardHeight` (90px).

---

### Requirement 13: Touch Target and Accessibility

**User Story:** As an elderly user or user with motor impairments, I want all interactive elements to be large enough to tap without difficulty, so that I can use the app independently.

#### Acceptance Criteria

1. THE Design_System SHALL define `TOUCH_TARGET` as `48` (pixels), conforming to WCAG 2.1 minimum touch target guidelines.
2. WHEN any interactive element is rendered on any Screen, THE Screen SHALL ensure the touch area is at least `TOUCH_TARGET` × `TOUCH_TARGET` (48×48px).
3. THE Design_System SHALL export an `accessibilityMinSize` style object (`{ minWidth: 48, minHeight: 48 }`) that screens apply to interactive elements.
4. THE Bottom_Nav tab buttons SHALL each have a touch area of at least `TOUCH_TARGET` (48px) in height.

---

### Requirement 14: No Horizontal Scroll on Main Content

**User Story:** As a user, I want the main content area of every screen to not require horizontal scrolling, so that I can read all information without sideways swiping.

#### Acceptance Criteria

1. THE HomeScreen SHALL NOT display any horizontally-scrollable main content container (horizontal scroll is permitted only for carousels within the screen such as specialisation chips or doctor lists).
2. THE ProfileScreen SHALL NOT require horizontal scrolling to access any primary content.
3. THE BookingScreen SHALL NOT require horizontal scrolling to access any primary content.
4. THE AppointmentsScreen SHALL NOT require horizontal scrolling to access any primary content.
5. THE LiveQueueScreen SHALL NOT require horizontal scrolling to access any primary content.
6. THE SearchScreen SHALL NOT require horizontal scrolling to access any primary content.
7. THE DoctorDetailScreen SHALL NOT require horizontal scrolling to access any primary content.

---

### Requirement 15: Safe Area Support

**User Story:** As a user on devices with notches, punch-hole cameras, or home indicators, I want UI elements to not be obscured by hardware features, so that all content and interactive elements are fully visible.

#### Acceptance Criteria

1. THE HomeScreen SHALL use `useSafeAreaInsets` from `react-native-safe-area-context` to pad the top and bottom of its content.
2. THE ProfileScreen SHALL use `useSafeAreaInsets` to pad the top and bottom of its content.
3. THE BookingScreen SHALL use `useSafeAreaInsets` to pad the top and bottom of its content.
4. THE AppointmentsScreen SHALL use `useSafeAreaInsets` to pad the top and bottom of its content.
5. THE LiveQueueScreen SHALL use `useSafeAreaInsets` to pad the top and bottom of its content.
6. THE Bottom_Nav SHALL add the device bottom safe area inset to the bar height.
7. THE SearchScreen SHALL use `useSafeAreaInsets` to pad the top of its content.
8. THE DoctorDetailScreen SHALL use `useSafeAreaInsets` to pad the top and bottom of its content.
