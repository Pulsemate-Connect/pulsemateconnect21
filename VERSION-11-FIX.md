# Version 11 - Expo Font Module Fix

## Date: June 28, 2026, 02:23 AM

## Issue Fixed
**Root Cause**: `expo-font` module version incompatibility causing `NoSuchMethodError` on app startup
- Error: `No static method getDirectConverter()` in `expo.modules.kotlin.types.ReturnTypeKt`
- Crash location: `expo.modules.font.FontLoaderModule.definition(FontLoaderModule.kt:98)`

## The Problem
Two conflicting versions of `expo-font` were installed:
1. Version 56.0.7 (incompatible - for Expo SDK 55+)
2. Version 14.0.12 (correct - for Expo SDK 54)

The newer incompatible version was being used at runtime, causing the crash.

## Solution Applied
Explicitly installed the correct `expo-font` version compatible with Expo SDK 54:
```bash
npm install expo-font@~14.0.12 --save-exact
```

This ensures only version 14.0.12 is used, matching the Expo SDK 54 requirements.

## Changes Made
1. **package.json**: Added `"expo-font": "14.0.12"` to dependencies
2. **android/app/build.gradle**: Incremented version to 11 (versionCode: 11, versionName: "1.0.6")

## Build Output
- **File**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Size**: 32.3 MB
- **Version Code**: 11
- **Version Name**: 1.0.6

## Previous Failed Attempts (Versions 9-10)
- ❌ Version 9: Built with New Architecture enabled - crashed
- ❌ Version 10: Disabled New Architecture (`newArchEnabled=false`) - still crashed
- ✅ Version 11: Fixed expo-font version - should work

## Why This Should Work
The error was NOT related to New Architecture, but to a simple version mismatch. The `expo-font` module version 56.0.7 has breaking API changes that require Expo modules-core APIs not present in Expo SDK 54. By locking to version 14.0.12, we ensure compatibility.

## Next Steps
1. Upload `app-release.aab` to Google Play Console Internal Testing
2. Install on OPPO CPH2487 (device ID: 9b90e608) via Play Store
3. Test app startup - should NOT crash now
4. If it works, proceed to production rollout

## Verification Command
If you need to verify which expo-font version is in use after reinstalling node_modules:
```bash
npm list expo-font
```
Should show: `expo-font@14.0.12`

## Alternative If This Doesn't Work
If the crash persists (unlikely), we can:
1. Remove `@expo/vector-icons` and use only React Native's built-in icons
2. Wait until July 1, 2026 when EAS build monthly limit resets and use EAS build instead
