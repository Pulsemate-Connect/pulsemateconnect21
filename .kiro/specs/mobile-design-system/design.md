# Design Document — Mobile-First Design System

## Overview

This document describes the technical design for introducing a unified design system into the PulseMate React Native (Expo) patient app (`PulseMateApp/`). The core deliverable is a new module at `PulseMateApp/src/theme/designSystem.js` that exports all spacing, typography, colour, and component tokens as named constants, along with responsive utility functions and a `ContentContainer` layout component. All seven key screens and `MainNavigator` are then migrated to consume these tokens instead of inline magic numbers.

---

## Architecture

### Directory Structure

```
PulseMateApp/
└── src/
    ├── theme/
    │   ├── designSystem.js   ← NEW: all tokens, utilities, ContentContainer
    │   └── index.js          ← NEW: re-exports designSystem + existing theme.js
    ├── navigation/
    │   └── MainNavigator.js  ← UPDATED: import tokens
    ├── screens/
    │   ├── HomeScreen.jsx         ← UPDATED
    │   ├── ProfileScreen.jsx      ← UPDATED
    │   ├── BookingScreen.jsx      ← UPDATED
    │   ├── AppointmentsScreen.jsx ← UPDATED
    │   ├── LiveQueueScreen.jsx    ← UPDATED
    │   ├── SearchScreen.jsx       ← UPDATED
    │   └── DoctorDetailScreen.jsx ← UPDATED
    └── theme.js              ← UNCHANGED (colours, shadows, radius)
```

### Co-existence with `theme.js`

The existing `src/theme.js` exports `colors`, `STATUS_COLORS`, `shadow`, and `radius`. These remain untouched. `designSystem.js` is a separate module that imports nothing from `theme.js` — it is self-contained. The new `src/theme/index.js` barrel re-exports both so screens can do:

```js
import { SPACING, TYPOGRAPHY, colors, shadow } from '../theme';
```

---

## Module Design — `designSystem.js`

### 1. Base Constants

```js
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const BASE_SCREEN = { width: 390, height: 844 };

export const BREAKPOINTS = {
  smallAndroid: 360,
  standard:     390,
  largeAndroid: 412,
  tablet:       768,
};

export const TOUCH_TARGET      = 48;
export const CONTENT_MAX_WIDTH = 480;
```

### 2. SPACING Token

```js
export const SPACING = {
  horizontal:        20,
  verticalSectionGap: 24,
  cardPadding:       16,
};
```

### 3. RADIUS Token

```js
export const RADIUS = {
  card:            20,
  button:          16,
  input:           14,
  appointmentCard: 18,
  activePill:      16,
  statusBadge:     12,
};
```

### 4. TYPOGRAPHY Token

Each entry is a plain style object that screens spread directly into `StyleSheet.create`.

```js
export const TYPOGRAPHY = {
  pageTitle:    { fontSize: 36, fontWeight: '700' },
  sectionTitle: { fontSize: 24, fontWeight: '600' },
  cardTitle:    { fontSize: 18, fontWeight: '600' },
  body:         { fontSize: 16, fontWeight: '400' },
  small:        { fontSize: 14, fontWeight: '400' },
  caption:      { fontSize: 12, fontWeight: '400' },
};
```

### 5. COMPONENT_SIZES Token

```js
export const COMPONENT_SIZES = {
  profileCardHeight:           220,
  avatarSize:                   90,
  editButtonHeight:             52,
  quickActionCardHeight:        90,
  iconContainerSize:            56,
  primaryButtonHeight:          56,
  inputFieldHeight:             56,
  appointmentSummaryCardHeight: 90,
  appointmentSummaryCardMinWidth: 80,
  appointmentSummaryCardMaxWidth: 90,
  bottomNavHeight:              80,
  bottomNavIconSize:            24,
  bottomNavLabelSize:           12,
  liveQueueNumberFontSize:      64,
  statusBadgeHeight:            36,
  statsCardHeight:              90,
};
```

### 6. Accessibility Helper

```js
export const accessibilityMinSize = {
  minWidth:  TOUCH_TARGET,
  minHeight: TOUCH_TARGET,
};
```

---

## Responsive Utilities

### `scale(value)`

Scales a numeric value linearly from the base screen width (390 px) to the actual device width. Uses `Math.round` to avoid sub-pixel values.

```js
export function scale(value) {
  return Math.round(value * (screenWidth / BASE_SCREEN.width));
}
```

**Correctness property:** For any `value >= 0`, `scale(value)` returns a non-negative integer and equals `value` exactly when `screenWidth === BASE_SCREEN.width`.

### `isTablet()`

```js
export function isTablet() {
  return screenWidth >= BREAKPOINTS.tablet;
}
```

### `getResponsiveSpacing()`

Returns the `SPACING` object with values multiplied by a breakpoint-dependent factor:

| Screen width condition                                              | Multiplier |
|---------------------------------------------------------------------|------------|
| `screenWidth < BREAKPOINTS.smallAndroid` (< 360 px)                | `0.92`     |
| `screenWidth >= BREAKPOINTS.smallAndroid` AND `< BREAKPOINTS.tablet` | `1.00`     |
| `screenWidth >= BREAKPOINTS.tablet` (≥ 768 px)                     | `1.15`     |

```js
export function getResponsiveSpacing() {
  let multiplier = 1.0;
  if (screenWidth < BREAKPOINTS.smallAndroid) {
    multiplier = 0.92;
  } else if (screenWidth >= BREAKPOINTS.tablet) {
    multiplier = 1.15;
  }
  return {
    horizontal:         Math.round(SPACING.horizontal         * multiplier),
    verticalSectionGap: Math.round(SPACING.verticalSectionGap * multiplier),
    cardPadding:        Math.round(SPACING.cardPadding        * multiplier),
  };
}
```

**Correctness property:** For a standard 390 px device, every value in `getResponsiveSpacing()` equals the corresponding value in `SPACING` exactly.

---

## ContentContainer Component

`ContentContainer` is a React Native functional component that constrains its children to `CONTENT_MAX_WIDTH` only when the device is wide enough to benefit from the constraint.

```jsx
import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export function ContentContainer({ children, style }) {
  const isWide = screenWidth >= CONTENT_MAX_WIDTH;

  return (
    <View
      style={[
        isWide && styles.constrained,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  constrained: {
    maxWidth:  CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    width:     '100%',
  },
});
```

**Decision rationale:** The constraint applies only when `screenWidth >= CONTENT_MAX_WIDTH`. On phones narrower than 480 px (the entire phone range), the container renders with no style, so there is zero layout cost for the common case.

---

## Per-Screen Migration Plan

Every screen migration follows the same three-step pattern:

1. **Import tokens** — add `import { SPACING, TYPOGRAPHY, RADIUS, COMPONENT_SIZES, accessibilityMinSize, ContentContainer } from '../theme';`
2. **Wrap scroll content** — place the root `<ScrollView>` or top-level `<View>` content inside `<ContentContainer>`.
3. **Replace magic numbers** — substitute each hard-coded px value with the corresponding token reference.

### HomeScreen

| Magic number currently used | Replace with token |
|---|---|
| `paddingHorizontal: 20` (header, sections) | `SPACING.horizontal` |
| `marginBottom: 24` (quickGrid) | `SPACING.verticalSectionGap` |
| `padding: 16` (card internals) | `SPACING.cardPadding` |
| `borderRadius: 16/18/20/24` (cards) | `RADIUS.card` / `RADIUS.appointmentCard` |
| `fontSize: 17` (sectionTitle) | `TYPOGRAPHY.sectionTitle.fontSize` |
| `width: 58, height: 58` (quickIcon) | `COMPONENT_SIZES.iconContainerSize` |
| Quick action `TouchableOpacity` — add `style={accessibilityMinSize}` | `TOUCH_TARGET` |

### ProfileScreen

| Area | Token |
|---|---|
| Profile card `minHeight` | `COMPONENT_SIZES.profileCardHeight` |
| Avatar `width`/`height` | `COMPONENT_SIZES.avatarSize` |
| Edit button `minHeight` | `COMPONENT_SIZES.editButtonHeight` |
| Profile card `borderRadius` | `RADIUS.card` |
| "My Profile" heading `fontSize` | `TYPOGRAPHY.pageTitle.fontSize` |
| Horizontal padding | `SPACING.horizontal` |
| Section gaps | `SPACING.verticalSectionGap` |
| Card padding | `SPACING.cardPadding` |
| Stats card `minHeight` | `COMPONENT_SIZES.statsCardHeight` |
| Appointment summary card `minHeight` / `width` range | `COMPONENT_SIZES.appointmentSummaryCardHeight` / `appointmentSummaryCardMinWidth` |
| Summary card `borderRadius` | `RADIUS.appointmentCard` |

### BookingScreen

| Area | Token |
|---|---|
| Section heading `fontSize` | `TYPOGRAPHY.sectionTitle.fontSize` |
| Horizontal padding | `SPACING.horizontal` |
| Section gaps | `SPACING.verticalSectionGap` |
| Primary button `height` | `COMPONENT_SIZES.primaryButtonHeight` |
| Primary button `borderRadius` | `RADIUS.button` |
| Input field `height` | `COMPONENT_SIZES.inputFieldHeight` |
| Input field `borderRadius` | `RADIUS.input` |
| Input `fontSize` | `TYPOGRAPHY.body.fontSize` |

### AppointmentsScreen

| Area | Token |
|---|---|
| Screen title `fontSize` | `TYPOGRAPHY.pageTitle.fontSize` |
| Horizontal padding | `SPACING.horizontal` |
| Section gaps | `SPACING.verticalSectionGap` |
| Status badge `borderRadius` | `RADIUS.statusBadge` |
| Status badge `minHeight` | `COMPONENT_SIZES.statusBadgeHeight` |

### LiveQueueScreen

| Area | Token |
|---|---|
| Queue number `fontSize` | `COMPONENT_SIZES.liveQueueNumberFontSize` |
| Status badge `minHeight` | `COMPONENT_SIZES.statusBadgeHeight` |
| Stats cards `minHeight` | `COMPONENT_SIZES.statsCardHeight` |
| Horizontal padding | `SPACING.horizontal` |
| Section gaps | `SPACING.verticalSectionGap` |

### SearchScreen

| Area | Token |
|---|---|
| Screen title `fontSize` | `TYPOGRAPHY.pageTitle.fontSize` |
| Horizontal padding | `SPACING.horizontal` |
| Input `height` / `borderRadius` / `fontSize` | `COMPONENT_SIZES.inputFieldHeight` / `RADIUS.input` / `TYPOGRAPHY.body.fontSize` |

### DoctorDetailScreen

| Area | Token |
|---|---|
| Doctor name `fontSize` | `TYPOGRAPHY.sectionTitle.fontSize` |
| Horizontal padding | `SPACING.horizontal` |
| Primary button `height` / `borderRadius` | `COMPONENT_SIZES.primaryButtonHeight` / `RADIUS.button` |
| Body text `fontSize` | `TYPOGRAPHY.body.fontSize` |

### MainNavigator (Bottom Tab Bar)

| Magic number currently used | Replace with token |
|---|---|
| Bar height logic (currently `insets.bottom + 6` with no explicit base height) | Add `minHeight: COMPONENT_SIZES.bottomNavHeight`, keep `paddingBottom: Math.max(0, insets.bottom) + 6` |
| Icon `size={22}` | `COMPONENT_SIZES.bottomNavIconSize` |
| Label `fontSize: 10` | `COMPONENT_SIZES.bottomNavLabelSize` |
| `activePill` `borderRadius: 12` | `RADIUS.activePill` |
| Each `tabBtn` implicit height | Add `minHeight: TOUCH_TARGET` |

---

## `src/theme/index.js` Barrel

```js
// Tokens & utilities
export * from './designSystem';

// Colours, shadows, radius (existing)
export { colors, STATUS_COLORS, shadow, radius } from '../theme';
```

> **Note:** The path `'../theme'` resolves to `src/theme.js`. The barrel lives at `src/theme/index.js`, which is one directory deeper, so `..` navigates back to `src/`.

---

## Safe Area Integration

All screens must use `useSafeAreaInsets` from `react-native-safe-area-context` to protect top and bottom content regions. The recommended wrapper pattern is:

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ContentContainer>
        {/* screen content */}
      </ContentContainer>
    </View>
  );
}
```

Screens that already use `<SafeAreaView edges={['top']}>` (e.g. HomeScreen) continue to do so. The key addition is ensuring `paddingBottom` accounts for `insets.bottom`.

For `MainNavigator`, the existing `paddingBottom: insets.bottom + 6` is kept but guarded against negative insets:

```js
paddingBottom: Math.max(0, insets.bottom) + 6,
```

---

## Property-Based Testing Strategy

### Test file location

```
PulseMateApp/src/theme/__tests__/designSystem.test.js
```

### Framework

Use Jest (already present via `react-native`'s Jest preset) with `fast-check` for property-based test generation. Install `fast-check` as a dev dependency.

### Correctness Properties

#### P1 — Token value invariants

All token values must equal their specified constants. These are unit tests, not PBT, but serve as a formal check that no accidental mutation occurs.

```js
test('SPACING.horizontal is 20', () => {
  expect(SPACING.horizontal).toBe(20);
});
// ...repeat for all token entries
```

#### P2 — `scale` linearity

For any non-negative integer `n`, `scale(n)` must be a non-negative integer and must be consistent with the formula.

```js
fc.assert(
  fc.property(fc.nat(1000), (n) => {
    const result = scale(n);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(0);
    // At standard width, scale is identity
    // (tested by mocking Dimensions to 390)
  })
);
```

#### P3 — `scale` identity at base width

When `screenWidth === BASE_SCREEN.width`, `scale(value) === value` for all non-negative integers ≤ 10 000.

```js
// Mock Dimensions to return BASE_SCREEN.width before importing module
fc.assert(
  fc.property(fc.nat(10000), (n) => {
    expect(scale(n)).toBe(n);
  })
);
```

#### P4 — `getResponsiveSpacing` multiplier correctness

For each of three synthetic screen widths (320 px, 390 px, 800 px), verify that each spacing value matches `SPACING[key] * expectedMultiplier` (rounded).

```js
const cases = [
  { width: 320, multiplier: 0.92 },
  { width: 390, multiplier: 1.00 },
  { width: 800, multiplier: 1.15 },
];
cases.forEach(({ width, multiplier }) => {
  // Mock Dimensions.width, re-require module
  const responsive = getResponsiveSpacing();
  Object.keys(SPACING).forEach((key) => {
    expect(responsive[key]).toBe(Math.round(SPACING[key] * multiplier));
  });
});
```

#### P5 — `isTablet` threshold

`isTablet()` returns `true` iff `screenWidth >= BREAKPOINTS.tablet`.

```js
fc.assert(
  fc.property(fc.integer({ min: 100, max: 1500 }), (w) => {
    // Mock Dimensions
    const result = isTablet();
    expect(result).toBe(w >= BREAKPOINTS.tablet);
  })
);
```

#### P6 — `ContentContainer` conditional style

When `screenWidth < CONTENT_MAX_WIDTH`, `ContentContainer` renders its children in a plain `View` with no `maxWidth` or `alignSelf` style. When `screenWidth >= CONTENT_MAX_WIDTH`, those styles are applied.

Test with React Test Renderer, mocking `Dimensions.get` to the two boundary widths (479 and 480).

#### P7 — TOUCH_TARGET minimum on interactive elements

All screen tests (shallow render) must confirm that every `TouchableOpacity` receives a style containing `minHeight >= 48` either directly or via `accessibilityMinSize`.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Separate `designSystem.js` from `theme.js` | Avoids breaking changes to existing colour/shadow imports used throughout the app. Both files can be merged in a future cleanup pass. |
| Tokens as plain objects, not functions | Simpler to tree-shake, easier to spread into `StyleSheet.create`, no runtime overhead. |
| `ContentContainer` uses `Dimensions` at module load time | Avoids a `useWindowDimensions` hook dependency, keeping the component usable in non-hook contexts. A future upgrade can add orientation-change support via a hook. |
| `getResponsiveSpacing()` called at render time | The screen width is fixed for a given app session (orientation lock is typical for healthcare apps), so calling at render time rather than subscription is acceptable. |
| `Math.round` in `scale()` | Prevents sub-pixel rendering artifacts on Android, where fractional dp values can cause blurry borders. |
| No new third-party UI library | Avoids bundle size increase and version conflicts with existing Expo dependencies. |

---

## Data Models

The design system has no server-side data models. All data is compile-time constants stored in `designSystem.js`. The relevant data shapes are:

### SpacingTokens

```typescript
type SpacingTokens = {
  horizontal:         number; // 20
  verticalSectionGap: number; // 24
  cardPadding:        number; // 16
};
```

### TypographyToken

```typescript
type TypographyToken = {
  fontSize:   number;
  fontWeight: string; // React Native weight string e.g. '700'
};

type TypographyTokens = {
  pageTitle:    TypographyToken;
  sectionTitle: TypographyToken;
  cardTitle:    TypographyToken;
  body:         TypographyToken;
  small:        TypographyToken;
  caption:      TypographyToken;
};
```

### ComponentSizes

```typescript
type ComponentSizes = {
  profileCardHeight:              number;
  avatarSize:                     number;
  editButtonHeight:               number;
  quickActionCardHeight:          number;
  iconContainerSize:              number;
  primaryButtonHeight:            number;
  inputFieldHeight:               number;
  appointmentSummaryCardHeight:   number;
  appointmentSummaryCardMinWidth: number;
  appointmentSummaryCardMaxWidth: number;
  bottomNavHeight:                number;
  bottomNavIconSize:              number;
  bottomNavLabelSize:             number;
  liveQueueNumberFontSize:        number;
  statusBadgeHeight:              number;
  statsCardHeight:                number;
};
```

### Breakpoints

```typescript
type Breakpoints = {
  smallAndroid: number; // 360
  standard:     number; // 390
  largeAndroid: number; // 412
  tablet:       number; // 768
};
```

### ContentContainerProps

```typescript
type ContentContainerProps = {
  children: React.ReactNode;
  style?:   StyleProp<ViewStyle>;
};
```

---

## Components and Interfaces

### `ContentContainer`

**File:** `PulseMateApp/src/theme/designSystem.js`

**Props:** `ContentContainerProps` (see Data Models)

**Behaviour:**
- When `screenWidth >= CONTENT_MAX_WIDTH` (480): renders a `View` with `maxWidth: 480`, `alignSelf: 'center'`, `width: '100%'`.
- When `screenWidth < CONTENT_MAX_WIDTH`: renders a plain `View` with no width constraints, content fills the full screen.
- Additional `style` prop is merged after the constraint style, allowing per-screen overrides.

**Usage example:**
```jsx
import { ContentContainer } from '../theme';

<ContentContainer>
  <ScrollView>...</ScrollView>
</ContentContainer>
```

### Token Exports Interface

All token exports from `designSystem.js` are plain JavaScript objects/constants. They satisfy the following interface contract:

```typescript
// Numeric scalar constants
export const TOUCH_TARGET:      number; // === 48
export const CONTENT_MAX_WIDTH: number; // === 480

// Object tokens
export const BASE_SCREEN:       { width: number; height: number };
export const BREAKPOINTS:       Breakpoints;
export const SPACING:           SpacingTokens;
export const RADIUS:            RadiusTokens;
export const TYPOGRAPHY:        TypographyTokens;
export const COMPONENT_SIZES:   ComponentSizes;

// Style helper
export const accessibilityMinSize: { minWidth: 48; minHeight: 48 };

// Functions
export function scale(value: number): number;
export function isTablet(): boolean;
export function getResponsiveSpacing(): SpacingTokens;

// Component
export function ContentContainer(props: ContentContainerProps): JSX.Element;
```

### Barrel Re-export (`src/theme/index.js`)

```typescript
// From designSystem.js
export { SPACING, RADIUS, TYPOGRAPHY, COMPONENT_SIZES, TOUCH_TARGET,
         CONTENT_MAX_WIDTH, BASE_SCREEN, BREAKPOINTS, accessibilityMinSize,
         scale, isTablet, getResponsiveSpacing, ContentContainer } from './designSystem';

// From existing theme.js
export { colors, STATUS_COLORS, shadow, radius } from '../theme';
```

---

## Correctness Properties

These are the formal, executable correctness properties the implementation must satisfy. They map directly to the property-based tests described in the Testing Strategy section.

### Property 1: Token value invariants

Every exported token constant (`SPACING`, `TYPOGRAPHY`, `RADIUS`, `COMPONENT_SIZES`, `TOUCH_TARGET`, `CONTENT_MAX_WIDTH`) has the exact numeric values specified in the requirements. No value deviates by even 1.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**

### Property 2: Scale linearity

`scale(v) = Math.round(v * (W / 390))` for all non-negative integers `v`, where `W` is the device screen width at module load time.

**Validates: Requirements 2.1**

### Property 3: Scale identity at base width

When `W = 390`, `scale(v) = v` for all integers `v` in `[0, 10 000]`.

**Validates: Requirements 2.1**

### Property 4: Scale non-negativity

For all `v >= 0`, `scale(v) >= 0`.

**Validates: Requirements 2.1**

### Property 5: Responsive spacing completeness

`getResponsiveSpacing()` returns an object with exactly the same keys as `SPACING`, and each value equals `Math.round(SPACING[key] * m)` where `m` is the multiplier for the current screen width tier.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 6: Responsive spacing multiplier tiers

For `W < 360`, `m = 0.92`. For `360 <= W < 768`, `m = 1.00`. For `W >= 768`, `m = 1.15`.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 7: isTablet threshold

`isTablet()` returns `true` iff `W >= 768`.

**Validates: Requirements 2.5**

### Property 8: ContentContainer constraint applied only when wide

`ContentContainer` applies `maxWidth` and `alignSelf: 'center'` only when `W >= CONTENT_MAX_WIDTH`. For `W < CONTENT_MAX_WIDTH`, neither property appears in the rendered style.

**Validates: Requirements 3.1, 3.2**

### Property 9: Touch target minimum

Every `TouchableOpacity` element across all migrated screens has a touch area of at least 48 × 48 dp. This is verified by checking that `minHeight >= 48` is present in the element's effective style (directly or via `accessibilityMinSize`).

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 10: Bottom nav minimum height

`COMPONENT_SIZES.bottomNavHeight = 80`. After migration, the bottom nav bar's rendered height is never less than 80 dp regardless of device safe-area inset.

**Validates: Requirements 11.1, 11.4**

---

> Legacy inline documentation (kept for reference):

**C1 — Token immutability:** Every exported token constant (`SPACING`, `TYPOGRAPHY`, `RADIUS`, `COMPONENT_SIZES`, `TOUCH_TARGET`, `CONTENT_MAX_WIDTH`) has the exact numeric values specified in the requirements. No value deviates by even 1.

**C2 — Scale linearity:** `scale(v) = Math.round(v * (W / 390))` for all non-negative integers `v`, where `W` is the device screen width at module load time.

**C3 — Scale identity at base width:** When `W = 390`, `scale(v) = v` for all integers `v` in `[0, 10 000]`.

**C4 — Scale non-negativity:** For all `v >= 0`, `scale(v) >= 0`.

**C5 — Responsive spacing completeness:** `getResponsiveSpacing()` returns an object with exactly the same keys as `SPACING`, and each value equals `Math.round(SPACING[key] * m)` where `m` is the multiplier for the current screen width tier.

**C6 — Responsive spacing multiplier tiers:** For `W < 360`, `m = 0.92`. For `360 <= W < 768`, `m = 1.00`. For `W >= 768`, `m = 1.15`.

**C7 — isTablet threshold:** `isTablet()` returns `true` iff `W >= 768`.

**C8 — ContentContainer constraint applied only when wide:** `ContentContainer` applies `maxWidth` and `alignSelf: 'center'` only when `W >= CONTENT_MAX_WIDTH`. For `W < CONTENT_MAX_WIDTH`, neither property appears in the rendered style.

**C9 — Touch target minimum:** Every `TouchableOpacity` element across all migrated screens has a touch area of at least 48 × 48 dp. This is verified by checking that `minHeight >= 48` is present in the element's effective style (directly or via `accessibilityMinSize`).

**C10 — Bottom nav minimum height:** `COMPONENT_SIZES.bottomNavHeight = 80`. After migration, the bottom nav bar's rendered height is never less than 80 dp regardless of device safe-area inset.

---

## Error Handling

### Dimension API unavailability

`Dimensions.get('window')` is synchronous and always returns a valid object in React Native. If the width returned is `0` (which can occur in certain test environments), `scale(value)` would return `0` for any positive input. Guard:

```js
const { width: _w } = Dimensions.get('window');
const screenWidth = _w > 0 ? _w : BASE_SCREEN.width;
```

This ensures `scale` and `getResponsiveSpacing` degrade gracefully to base-width behaviour in test environments that do not mock `Dimensions`.

### Negative safe-area insets

On some Android devices, `useSafeAreaInsets().bottom` can return a negative value. The bottom nav bar must never become smaller than `COMPONENT_SIZES.bottomNavHeight`. Guard in `MainNavigator`:

```js
paddingBottom: Math.max(0, insets.bottom) + 6,
```

and enforce `minHeight: COMPONENT_SIZES.bottomNavHeight` on the bar container.

### Missing token reference

If a developer references a non-existent token key (e.g. `SPACING.missingKey`), JavaScript returns `undefined`, which React Native silently ignores for most style properties. No runtime crash occurs. As a safeguard, the `designSystem.js` module is frozen in development:

```js
if (__DEV__) {
  Object.freeze(SPACING);
  Object.freeze(RADIUS);
  Object.freeze(TYPOGRAPHY);
  Object.freeze(COMPONENT_SIZES);
  Object.freeze(BREAKPOINTS);
}
```

`Object.freeze` causes an assignment to a non-existent frozen property to throw in strict mode, surfacing the error during development.

---

## Testing Strategy

### Framework

- **Jest** — present via `react-native`'s Jest preset (configured in `babel.config.js` and `package.json`)
- **fast-check** — install as `devDependency` for property-based generation: `npm install --save-dev fast-check`
- **React Test Renderer** — included with `react-native` for component render tests

### Test file

```
PulseMateApp/src/theme/__tests__/designSystem.test.js
```

### Test categories

#### Unit tests — token value assertions

Verify every exported constant matches the specification exactly. These tests are the executable version of correctness properties C1.

```js
describe('Token values', () => {
  test('SPACING matches spec', () => {
    expect(SPACING).toEqual({ horizontal: 20, verticalSectionGap: 24, cardPadding: 16 });
  });
  test('TOUCH_TARGET is 48', () => expect(TOUCH_TARGET).toBe(48));
  test('CONTENT_MAX_WIDTH is 480', () => expect(CONTENT_MAX_WIDTH).toBe(480));
  // ...all other tokens
});
```

#### Property-based tests — `scale`

Cover correctness properties C2, C3, C4.

```js
import * as fc from 'fast-check';

describe('scale()', () => {
  beforeAll(() => {
    jest.mock('react-native', () => ({
      Dimensions: { get: () => ({ width: 390, height: 844 }) },
    }));
  });

  test('identity at base width (C3)', () => {
    fc.assert(fc.property(fc.nat(10000), (n) => {
      expect(scale(n)).toBe(n);
    }));
  });

  test('non-negative (C4)', () => {
    fc.assert(fc.property(fc.nat(10000), (n) => {
      expect(scale(n)).toBeGreaterThanOrEqual(0);
    }));
  });

  test('integer output (C2)', () => {
    fc.assert(fc.property(fc.nat(10000), (n) => {
      expect(Number.isInteger(scale(n))).toBe(true);
    }));
  });
});
```

#### Property-based tests — `getResponsiveSpacing`

Cover correctness properties C5 and C6 by mocking `Dimensions` to each tier.

```js
const tiers = [
  { width: 320, multiplier: 0.92 },
  { width: 390, multiplier: 1.00 },
  { width: 800, multiplier: 1.15 },
];

tiers.forEach(({ width, multiplier }) => {
  describe(`getResponsiveSpacing at ${width}px`, () => {
    beforeAll(() => mockDimensionsWidth(width));
    test('all keys match formula (C5, C6)', () => {
      const result = getResponsiveSpacing();
      Object.entries(SPACING).forEach(([key, base]) => {
        expect(result[key]).toBe(Math.round(base * multiplier));
      });
    });
  });
});
```

#### Property-based tests — `isTablet`

Cover correctness property C7.

```js
test('isTablet threshold (C7)', () => {
  fc.assert(fc.property(fc.integer({ min: 100, max: 1500 }), (w) => {
    mockDimensionsWidth(w);
    expect(isTablet()).toBe(w >= BREAKPOINTS.tablet);
  }));
});
```

#### Render tests — `ContentContainer`

Cover correctness property C8.

```js
import renderer from 'react-test-renderer';

test('applies maxWidth when wide (C8)', () => {
  mockDimensionsWidth(480);
  const tree = renderer.create(<ContentContainer><View /></ContentContainer>).toJSON();
  expect(tree.props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ maxWidth: 480 })])
  );
});

test('no maxWidth when narrow (C8)', () => {
  mockDimensionsWidth(375);
  const tree = renderer.create(<ContentContainer><View /></ContentContainer>).toJSON();
  const styles = [tree.props.style].flat().filter(Boolean);
  styles.forEach((s) => {
    expect(s.maxWidth).toBeUndefined();
  });
});
```

#### Integration smoke tests — screen render

Each migrated screen is rendered with `renderer.create(...)` wrapped in a `NavigationContainer` mock. The test verifies:
- No render errors are thrown.
- At least one element with `minHeight >= 48` exists (C9).
- No `paddingHorizontal` value other than `SPACING.horizontal` (20) appears in top-level section containers.
