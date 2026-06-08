# Implementation Plan: Mobile-First Design System

## Overview

Introduce a unified design token system into the PulseMate React Native (Expo) patient app. The work is divided into four phases: (1) create the token module and barrel, (2) set up the test infrastructure, (3) migrate all seven screens and MainNavigator, and (4) write and validate all property-based and unit tests. Every task is incremental — each step leaves the app in a runnable state.

---

## Tasks

- [ ] 1. Create `designSystem.js` token module
  - [ ] 1.1 Create `PulseMateApp/src/theme/designSystem.js` with all base constants
    - Export `BASE_SCREEN`, `BREAKPOINTS`, `TOUCH_TARGET`, `CONTENT_MAX_WIDTH`
    - Export `SPACING`, `RADIUS`, `TYPOGRAPHY`, `COMPONENT_SIZES`, `accessibilityMinSize`
    - Apply `Object.freeze` on all token objects inside `if (__DEV__)` guard
    - Add `Dimensions` zero-width fallback: `const screenWidth = _w > 0 ? _w : BASE_SCREEN.width`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 13.1, 13.3_

  - [ ] 1.2 Add `scale`, `isTablet`, and `getResponsiveSpacing` functions to `designSystem.js`
    - Implement `scale(value)` using `Math.round(value * (screenWidth / BASE_SCREEN.width))`
    - Implement `isTablet()` returning `screenWidth >= BREAKPOINTS.tablet`
    - Implement `getResponsiveSpacing()` with three multiplier tiers (0.92 / 1.00 / 1.15)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 1.3 Add `ContentContainer` React Native component to `designSystem.js`
    - Render a plain `View` with no constraints when `screenWidth < CONTENT_MAX_WIDTH`
    - Apply `maxWidth: CONTENT_MAX_WIDTH`, `alignSelf: 'center'`, `width: '100%'` when `screenWidth >= CONTENT_MAX_WIDTH`
    - Accept and merge optional `style` prop
    - _Requirements: 3.1, 3.2_

- [ ] 2. Create `src/theme/index.js` barrel
  - [ ] 2.1 Create `PulseMateApp/src/theme/index.js`
    - Re-export all named exports from `./designSystem`
    - Re-export `colors`, `STATUS_COLORS`, `shadow`, `radius` from `../theme` (the existing `src/theme.js`)
    - Verify `import { SPACING, TYPOGRAPHY, colors, shadow } from '../theme'` resolves correctly in a screen file
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Set up fast-check and the test file
  - [ ] 3.1 Install `fast-check` as a dev dependency
    - Run `npm install --save-dev fast-check` inside `PulseMateApp/`
    - Confirm the package appears in `devDependencies` in `PulseMateApp/package.json`
    - _Requirements: (test infrastructure)_

  - [ ] 3.2 Create `PulseMateApp/src/theme/__tests__/designSystem.test.js` skeleton
    - Add `describe` blocks for: Token values, `scale()`, `getResponsiveSpacing()`, `isTablet()`, `ContentContainer`, Screen touch targets, Bottom nav height
    - Add a `mockDimensionsWidth(w)` helper using `jest.mock` / `jest.resetModules` pattern
    - Leave all `test(...)` bodies as `test.todo(...)` placeholders for now
    - _Requirements: (test infrastructure)_

- [ ] 4. Checkpoint — verify token module and barrel import cleanly
  - Run the Jest suite (`npx jest --testPathPattern=designSystem --passWithNoTests`) to confirm no import or syntax errors.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Migrate HomeScreen
  - [ ] 5.1 Update `PulseMateApp/src/screens/HomeScreen.jsx` to use design tokens
    - Add import: `import { SPACING, TYPOGRAPHY, RADIUS, COMPONENT_SIZES, accessibilityMinSize, ContentContainer } from '../theme';`
    - Replace `paddingHorizontal: 20` (header, sections) → `SPACING.horizontal`
    - Replace `marginBottom: 24` (quickGrid gap) → `SPACING.verticalSectionGap`
    - Replace `padding: 16` (card internals) → `SPACING.cardPadding`
    - Replace `borderRadius: 16/18/20/24` on cards → `RADIUS.card` / `RADIUS.appointmentCard`
    - Replace `fontSize: 17` (section title) → `TYPOGRAPHY.sectionTitle.fontSize`
    - Replace `width: 58, height: 58` (quickIcon container) → `COMPONENT_SIZES.iconContainerSize`
    - Add `style={accessibilityMinSize}` to each Quick Action `TouchableOpacity`
    - Wrap scroll content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top/bottom padding if not already present
    - _Requirements: 3.3, 4.1, 5.1, 5.8, 5.9, 7.1, 7.3, 7.4, 7.5, 13.2, 14.1, 15.1_

- [ ] 6. Migrate ProfileScreen
  - [ ] 6.1 Update `PulseMateApp/src/screens/ProfileScreen.jsx` to use design tokens
    - Add import from `'../theme'`
    - Replace profile card `minHeight` → `COMPONENT_SIZES.profileCardHeight`
    - Replace avatar `width`/`height` → `COMPONENT_SIZES.avatarSize`
    - Replace edit button `minHeight` → `COMPONENT_SIZES.editButtonHeight`
    - Replace profile card `borderRadius` → `RADIUS.card`
    - Replace "My Profile" heading `fontSize` → `TYPOGRAPHY.pageTitle.fontSize`
    - Replace horizontal padding → `SPACING.horizontal`
    - Replace section gaps → `SPACING.verticalSectionGap`
    - Replace card padding → `SPACING.cardPadding`
    - Replace stats card `minHeight` → `COMPONENT_SIZES.statsCardHeight`
    - Replace appointment summary card `minHeight` / `width` range → `COMPONENT_SIZES.appointmentSummaryCardHeight` / `appointmentSummaryCardMinWidth` / `appointmentSummaryCardMaxWidth`
    - Replace summary card `borderRadius` → `RADIUS.appointmentCard`
    - Wrap scroll content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top/bottom padding
    - _Requirements: 3.4, 4.2, 5.2, 5.8, 5.9, 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.2, 10.3, 13.2, 14.2, 15.2_

- [ ] 7. Migrate BookingScreen
  - [ ] 7.1 Update `PulseMateApp/src/screens/BookingScreen.jsx` to use design tokens
    - Add import from `'../theme'`
    - Replace section heading `fontSize` → `TYPOGRAPHY.sectionTitle.fontSize`
    - Replace horizontal padding → `SPACING.horizontal`
    - Replace section gaps → `SPACING.verticalSectionGap`
    - Replace primary button `height` → `COMPONENT_SIZES.primaryButtonHeight`
    - Replace primary button `borderRadius` → `RADIUS.button`
    - Replace input field `height` → `COMPONENT_SIZES.inputFieldHeight`
    - Replace input field `borderRadius` → `RADIUS.input`
    - Replace input `fontSize` → `TYPOGRAPHY.body.fontSize`
    - Wrap scroll content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top/bottom padding
    - _Requirements: 3.5, 4.3, 5.3, 5.8, 5.9, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 13.2, 14.3, 15.3_

- [ ] 8. Migrate AppointmentsScreen
  - [ ] 8.1 Update `PulseMateApp/src/screens/AppointmentsScreen.jsx` to use design tokens
    - Add import from `'../theme'`
    - Replace screen title `fontSize` → `TYPOGRAPHY.pageTitle.fontSize`
    - Replace horizontal padding → `SPACING.horizontal`
    - Replace section gaps → `SPACING.verticalSectionGap`
    - Replace status badge `borderRadius` → `RADIUS.statusBadge`
    - Replace status badge `minHeight` → `COMPONENT_SIZES.statusBadgeHeight`
    - Wrap scroll content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top/bottom padding
    - _Requirements: 3.6, 4.4, 5.4, 5.8, 13.2, 14.4, 15.4_

- [ ] 9. Migrate LiveQueueScreen
  - [ ] 9.1 Update `PulseMateApp/src/screens/LiveQueueScreen.jsx` to use design tokens
    - Add import from `'../theme'`
    - Replace queue number `fontSize` → `COMPONENT_SIZES.liveQueueNumberFontSize`
    - Replace status badge `minHeight` → `COMPONENT_SIZES.statusBadgeHeight`
    - Replace stats card `minHeight` → `COMPONENT_SIZES.statsCardHeight`
    - Replace horizontal padding → `SPACING.horizontal`
    - Replace section gaps → `SPACING.verticalSectionGap`
    - Wrap scroll content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top/bottom padding
    - _Requirements: 3.7, 5.5, 5.8, 12.1, 12.2, 12.3, 13.2, 14.5, 15.5_

- [ ] 10. Migrate SearchScreen
  - [ ] 10.1 Update `PulseMateApp/src/screens/SearchScreen.jsx` to use design tokens
    - Add import from `'../theme'`
    - Replace screen title `fontSize` → `TYPOGRAPHY.pageTitle.fontSize`
    - Replace horizontal padding → `SPACING.horizontal`
    - Replace input `height` → `COMPONENT_SIZES.inputFieldHeight`
    - Replace input `borderRadius` → `RADIUS.input`
    - Replace input `fontSize` → `TYPOGRAPHY.body.fontSize`
    - Wrap scroll/main content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top padding
    - _Requirements: 3.8, 4.6, 5.6, 9.1, 9.2, 9.3, 13.2, 14.6, 15.7_

- [ ] 11. Migrate DoctorDetailScreen
  - [ ] 11.1 Update `PulseMateApp/src/screens/DoctorDetailScreen.jsx` to use design tokens
    - Add import from `'../theme'`
    - Replace doctor name `fontSize` → `TYPOGRAPHY.sectionTitle.fontSize`
    - Replace horizontal padding → `SPACING.horizontal`
    - Replace primary button `height` → `COMPONENT_SIZES.primaryButtonHeight`
    - Replace primary button `borderRadius` → `RADIUS.button`
    - Replace body text `fontSize` → `TYPOGRAPHY.body.fontSize`
    - Wrap scroll content inside `<ContentContainer>`
    - Add `useSafeAreaInsets` top/bottom padding
    - _Requirements: 3.9, 4.7, 4.8, 5.7, 5.8, 8.1, 8.2, 8.3, 13.2, 14.7, 15.8_

- [ ] 12. Migrate MainNavigator (bottom tab bar)
  - [ ] 12.1 Update `PulseMateApp/src/navigation/MainNavigator.js` to use design tokens
    - Add import from `'../theme'`
    - Add `minHeight: COMPONENT_SIZES.bottomNavHeight` to the bar container style
    - Replace icon `size={22}` → `COMPONENT_SIZES.bottomNavIconSize`
    - Replace label `fontSize: 10` → `COMPONENT_SIZES.bottomNavLabelSize`
    - Replace `activePill` `borderRadius: 12` → `RADIUS.activePill`
    - Guard negative insets: `paddingBottom: Math.max(0, insets.bottom) + 6`
    - Add `minHeight: TOUCH_TARGET` to each `tabBtn` style
    - _Requirements: 4.10, 11.1, 11.2, 11.3, 11.4, 11.5, 13.4, 15.6_

- [ ] 13. Checkpoint — ensure all screens render without errors
  - Run `npx jest --passWithNoTests` from `PulseMateApp/` to confirm no regressions.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Write property-based and unit tests for designSystem
  - [ ] 14.1 Implement Property 1 — token value invariant unit tests
    - Assert `SPACING` equals `{ horizontal: 20, verticalSectionGap: 24, cardPadding: 16 }`
    - Assert `RADIUS`, `TYPOGRAPHY`, `COMPONENT_SIZES` values match spec exactly
    - Assert `TOUCH_TARGET === 48` and `CONTENT_MAX_WIDTH === 480`
    - Assert `BASE_SCREEN` and `BREAKPOINTS` values match spec
    - **Property 1: Token value invariants**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**

  - [ ]* 14.2 Write property test for `scale` linearity — Property 2
    - Use `fc.nat(10000)` to generate non-negative integers
    - Assert `Number.isInteger(scale(n))` is true for all inputs
    - Assert result satisfies `scale(n) === Math.round(n * (screenWidth / 390))`
    - **Property 2: Scale linearity**
    - **Validates: Requirements 2.1**

  - [ ]* 14.3 Write property test for `scale` identity at base width — Property 3
    - Mock `Dimensions.get` to return `{ width: 390 }` before importing module
    - Use `fc.nat(10000)` and assert `scale(n) === n`
    - **Property 3: Scale identity at base width**
    - **Validates: Requirements 2.1**

  - [ ]* 14.4 Write property test for `scale` non-negativity — Property 4
    - Use `fc.nat(10000)` and assert `scale(n) >= 0` for all inputs
    - **Property 4: Scale non-negativity**
    - **Validates: Requirements 2.1**

  - [ ]* 14.5 Write property test for `getResponsiveSpacing` completeness — Property 5
    - For each of three synthetic widths (320, 390, 800), mock `Dimensions` and re-require module
    - Assert returned object has exactly the same keys as `SPACING`
    - Assert each value equals `Math.round(SPACING[key] * expectedMultiplier)`
    - **Property 5: Responsive spacing completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [ ]* 14.6 Write property test for `getResponsiveSpacing` multiplier tiers — Property 6
    - Use `fc.integer({ min: 100, max: 1500 })` to generate screen widths
    - Derive expected multiplier: `w < 360 → 0.92`, `360 <= w < 768 → 1.00`, `w >= 768 → 1.15`
    - Assert each spacing value matches `Math.round(SPACING[key] * multiplier)`
    - **Property 6: Responsive spacing multiplier tiers**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [ ]* 14.7 Write property test for `isTablet` threshold — Property 7
    - Use `fc.integer({ min: 100, max: 1500 })` to generate screen widths
    - Mock `Dimensions` and re-require module for each value
    - Assert `isTablet() === (w >= BREAKPOINTS.tablet)`
    - **Property 7: isTablet threshold**
    - **Validates: Requirements 2.5**

  - [ ]* 14.8 Write render test for `ContentContainer` conditional constraint — Property 8
    - Use React Test Renderer; mock `Dimensions` to 479 and assert no `maxWidth` or `alignSelf` in rendered style
    - Mock `Dimensions` to 480 and assert `maxWidth: 480` and `alignSelf: 'center'` are present
    - **Property 8: ContentContainer constraint applied only when wide**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 14.9 Write touch target minimum tests for all migrated screens — Property 9
    - Shallow-render each of the seven screens and `MainNavigator` using React Test Renderer
    - Walk the component tree and assert every `TouchableOpacity` has `minHeight >= 48` in its effective style (directly or via `accessibilityMinSize`)
    - **Property 9: Touch target minimum**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

  - [ ]* 14.10 Write bottom nav minimum height test — Property 10
    - Assert `COMPONENT_SIZES.bottomNavHeight === 80`
    - Render `MainNavigator` with mocked insets (including a negative inset case) and assert the bar container style satisfies `minHeight >= 80`
    - **Property 10: Bottom nav minimum height**
    - **Validates: Requirements 11.1, 11.4**

- [ ] 15. Final checkpoint — all tests pass
  - Run `npx jest --passWithNoTests` from `PulseMateApp/` and confirm the full suite is green.
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the implementation tasks (unmarked) must be completed first.
- Each task references specific requirements for full traceability.
- The design uses JavaScript (React Native / Expo) — all code should match the existing Expo/RN conventions in `PulseMateApp/`.
- `fast-check` property tests rely on module re-requiring after mocking `Dimensions`; use `jest.resetModules()` before each mock scenario.
- The existing `src/theme.js` is never modified — `designSystem.js` and the barrel are purely additive.
- Checkpoints at tasks 4, 13, and 15 are non-coding validation steps for the developer; they are not automated tasks.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1", "8.1", "9.1", "10.1", "11.1", "12.1"] },
    { "id": 6, "tasks": ["14.1"] },
    { "id": 7, "tasks": ["14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8"] },
    { "id": 8, "tasks": ["14.9", "14.10"] }
  ]
}
```
