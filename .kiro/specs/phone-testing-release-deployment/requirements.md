# Phone Testing, Release Build & Production Deployment

**Feature Name:** phone-testing-release-deployment  
**Version:** 1.0.0  
**Status:** Requirements  
**Date:** July 24, 2026

---

## Overview

This specification defines requirements for three final phases to take Firebase Phone Authentication from development to production:

1. **Phone Testing & Validation** - Verify end-to-end SMS login on real devices
2. **Release Build** - Create production-ready APK/AAB signed and tested
3. **Production Deployment** - Deploy backend and release to Google Play Store

---

## Glossary

| Term | Definition |
|------|-----------|
| **OTP** | One-Time Password - 6-digit code sent via SMS |
| **APK** | Android Package - app binary for direct device installation |
| **AAB** | Android App Bundle - app package format for Play Store distribution |
| **Firebase ID Token** | JWT token from Firebase after successful phone verification |
| **JWT** | JSON Web Token - authentication token issued by backend |
| **Play Store** | Google Play Console - Android app distribution platform |
| **Render** | Backend hosting service (render.com) |
| **Production** | Live environment accessible to real users |

---

## Introduction

Firebase Phone Authentication implementation is complete and tested in development. This spec covers the final three phases:

- **Phase 1** validates the complete flow works on real Android devices with actual SMS
- **Phase 2** creates a production-ready signed app binary ready for Play Store
- **Phase 3** deploys the backend and launches the app publicly

Each phase has clear acceptance criteria and deliverables.

---

## Phase 1: Phone Testing & Validation

### Requirement 1.1: Setup Prerequisites

**User Story:** As a developer, I want to confirm all prerequisites are met, so that testing can proceed without blockers.

#### Acceptance Criteria

1. Firebase project "pulsemateconnect" has Phone Authentication enabled
2. Android app SHA-1 and SHA-256 registered in Firebase Console
3. google-services.json file present in `android/app/`
4. google-services.json contains correct Firebase project ID and package name
5. Expo development server running successfully on local network
6. At least 2 real Android devices available for testing
7. Test devices have working phone numbers for SMS receipt
8. Expo Go app installed on all test devices
9. All test devices connected to same network as dev server
10. No build errors or warnings blocking development build

### Requirement 1.2: Test SMS Delivery

**User Story:** As a tester, I want to verify Firebase can send real SMS to my phone, so that I know the authentication flow will work for users.

#### Acceptance Criteria

1. User enters valid phone number in +E.164 format
2. User clicks [Send OTP] button
3. SMS arrives on phone within 10 seconds
4. SMS sender identified as Google/Firebase
5. SMS contains exactly 6-digit OTP code
6. SMS not filtered as spam or promotional
7. Loading state shown while SMS sends
8. Success message displayed after SMS sent
9. OTP code correctly received on device

### Requirement 1.3: Test OTP Verification

**User Story:** As a tester, I want to verify OTP verification works correctly, so that the login process can complete successfully.

#### Acceptance Criteria

1. OTP input field accepts exactly 6 digits
2. Code entered matches SMS received
3. Firebase client-side verification completes successfully
4. Firebase ID Token obtained from verification
5. Verification completes in less than 2 seconds
6. Success animation or message displayed
7. User transitions to authenticated state
8. No errors or crashes during verification

### Requirement 1.4: Test Backend Authentication

**User Story:** As a tester, I want to verify the backend receives and processes the Firebase ID Token correctly, so that the complete authentication flow works end-to-end.

#### Acceptance Criteria

1. Backend receives Firebase ID Token from app
2. Backend verifies token using Firebase Admin SDK
3. New user account created on first login with `authProvider: FIREBASE_PHONE`
4. User account includes `firebaseUid` field
5. User account includes `lastLoginAt` timestamp
6. JWT access token generated and returned
7. JWT refresh token generated and returned
8. User data returned with profile fields
9. Tokens stored securely in app's SecureStore
10. Second login updates `lastLoginAt` without creating duplicate

### Requirement 1.5: Test Error Handling

**User Story:** As a tester, I want to verify all error scenarios are handled gracefully, so that users see helpful messages and can retry.

#### Acceptance Criteria

1. Invalid phone number shows error: "Invalid phone number"
2. Wrong OTP code shows error: "Invalid OTP"
3. Expired OTP shows error: "OTP expired"
4. Too many requests shows error with retry time
5. Network failure shows error: "Network error - please check connection"
6. Each error allows user to retry
7. User can request new OTP after expiration
8. Error messages are user-friendly and actionable
9. No exposing of internal error codes or stack traces

### Requirement 1.6: Test Edge Cases

**User Story:** As a tester, I want to verify edge cases don't cause crashes or unexpected behavior, so that the app is robust.

#### Acceptance Criteria

1. Returning user (same phone) logs in without duplicate account
2. Resend OTP blocked for 60 seconds with countdown
3. Resend after 60 seconds sends new code and invalidates old
4. Multiple devices can login independently
5. Force-killing app during login returns to login screen without crash
6. Rotating device during OTP entry doesn't lose state
7. Background/foreground transitions don't cause crashes
8. Network switch (WiFi ↔ Mobile) handled gracefully

### Requirement 1.7: Device Compatibility

**User Story:** As a developer, I want to test on multiple Android versions and device types, so that the app works for most users.

#### Acceptance Criteria

1. App tested on Android 12 or higher (minimum)
2. App tested on at least 2 different device manufacturers
3. App tested on both mid-range and high-end devices
4. All test scenarios pass on each device
5. No device-specific crashes or issues
6. Performance acceptable on slower devices

### Requirement 1.8: Testing Documentation

**User Story:** As a team member, I want clear documentation of testing results, so that we have evidence the app is production-ready.

#### Acceptance Criteria

1. Testing checklist completed with pass/fail for each scenario
2. Bug report documenting any issues found
3. Performance metrics recorded (SMS delivery time, login duration)
4. Screenshots or video showing successful login flow
5. Device compatibility matrix documented
6. Go/No-Go decision recorded
7. Known issues or limitations documented

---

## Phase 2: Release Build

### Requirement 2.1: Release Signing Setup

**User Story:** As a developer, I want to set up proper release signing, so that the app can be published to Play Store.

#### Acceptance Criteria

1. Release keystore file exists (pulsemateconnect.jks or similar)
2. Keystore password documented securely
3. Key alias documented
4. Key password documented securely
5. Keystore backed up in secure location
6. Backup location documented for team
7. Keystore rotation policy in place if applicable

### Requirement 2.2: Firebase Fingerprints for Release

**User Story:** As a developer, I want to register release signing fingerprints with Firebase, so that Firebase Phone Auth works with the production app.

#### Acceptance Criteria

1. SHA-1 fingerprint extracted from release keystore
2. SHA-256 fingerprint extracted from release keystore
3. Both fingerprints registered in Firebase Console under Android app settings
4. Firebase Console shows both fingerprints as verified
5. 24-hour processing period noted and documented
6. Verification complete before testing release build

### Requirement 2.3: Build Configuration

**User Story:** As a developer, I want the build system configured for release, so that the APK/AAB can be generated correctly.

#### Acceptance Criteria

1. `android/app/build.gradle` has release signing configuration
2. Signing config points to correct keystore file
3. Signing config uses correct key alias and password
4. ProGuard/R8 rules configured for code obfuscation
5. Build types properly defined (debug, release, staging)
6. Version code incremented for new release
7. Version name follows semantic versioning
8. Package name set to `com.pulsemate.app`
9. Minimum SDK version set (Android 12+)
10. Target SDK version current (API 34+)

### Requirement 2.4: APK Build

**User Story:** As a developer, I want to build a signed APK, so that it can be tested on devices.

#### Acceptance Criteria

1. Build command: `./gradlew assembleRelease` completes without errors
2. APK generated at `app/build/outputs/apk/release/app-release.apk`
3. APK file size reasonable (40-100 MB depending on dependencies)
4. APK signed with release keystore
5. APK signature verifiable with jarsigner
6. Build time acceptable (5-10 minutes)
7. No critical warnings during build
8. Build output shows all dependencies resolved

### Requirement 2.5: AAB Build for Play Store

**User Story:** As a developer, I want to build an AAB for Play Store distribution, so that the app can be submitted.

#### Acceptance Criteria

1. Build command: `./gradlew bundleRelease` completes without errors
2. AAB generated at `app/build/outputs/bundle/release/app-release.aab`
3. AAB file size smaller than APK (dynamic delivery)
4. AAB signed with release keystore
5. AAB signature verifiable
6. Build time acceptable (5-10 minutes)
7. AAB contains all required modules

### Requirement 2.6: Release Build Quality Assurance

**User Story:** As a QA engineer, I want to thoroughly test the release build, so that we're confident it works correctly.

#### Acceptance Criteria

1. Release APK installed on at least 2 test devices
2. Full login test scenario runs without crashes
3. SMS delivery works identically to development build
4. OTP verification works identically to development build
5. Backend communication works
6. User creation confirmed in production database
7. Performance metrics identical to or better than dev build
8. App startup time less than 5 seconds
9. Login flow completion time less than 2 minutes
10. Zero crashes during comprehensive testing

### Requirement 2.7: Performance Validation

**User Story:** As a developer, I want to measure and validate release build performance, so that the app meets performance standards.

#### Acceptance Criteria

1. App startup time measured and logged
2. Login screen load time measured
3. OTP send response time measured
4. OTP verification time measured
5. All metrics within acceptable ranges
6. Release build performance at least as good as development build
7. No memory leaks detected during extended use
8. Battery consumption reasonable

### Requirement 2.8: Network Resilience Testing

**User Story:** As a QA engineer, I want to test network failure scenarios in the release build, so that users get appropriate error handling.

#### Acceptance Criteria

1. App tested on 3G network speed (throttled)
2. App tested with no network (airplane mode)
3. App tested with network switching (WiFi to mobile)
4. Each scenario shows appropriate error message
5. User can retry each operation
6. No data loss during network interruptions
7. App recovers when network restored

### Requirement 2.9: Release Build Acceptance

**User Story:** As the project lead, I want clear sign-off that the release build is production-ready, so that we can proceed to deployment.

#### Acceptance Criteria

1. All QA tests passed
2. All performance metrics acceptable
3. No known critical bugs
4. Bug report compiled (if any issues found)
5. QA sign-off obtained and documented
6. Release notes prepared
7. Go/No-Go decision made and recorded

---

## Phase 3: Production Deployment

### Requirement 3.1: Backend Firebase Credentials

**User Story:** As a developer, I want to deploy Firebase credentials to the backend, so that the backend can verify Firebase tokens in production.

#### Acceptance Criteria

1. Firebase Service Account JSON obtained from Firebase Console
2. Service account key has `editor` role for Firebase Auth
3. JSON credentials converted to single-line format (no newlines)
4. Credentials added to Render environment as `FIREBASE_SERVICE_ACCOUNT_JSON`
5. Render backend environment updated and saved
6. Backend auto-restarts after environment change
7. Deployment logs show no errors

### Requirement 3.2: Backend Firebase Integration Verification

**User Story:** As a developer, I want to verify the backend can access and use Firebase credentials, so that token verification will work in production.

#### Acceptance Criteria

1. Backend logs show `[Firebase] Auth initialized successfully` message
2. Firebase Admin SDK connection successful
3. Backend can verify Firebase ID tokens
4. Test token verification call completes successfully
5. User creation works with Firebase tokens
6. No "Firebase not configured" errors

### Requirement 3.3: Play Store Developer Account

**User Story:** As a team member, I want the Play Store developer account set up, so that we can publish the app.

#### Acceptance Criteria

1. Play Store developer account exists (individual or organization)
2. Account registration fee paid ($25)
3. Account in good standing (no violations)
4. Team members have appropriate access levels
5. Payment method configured for fees

### Requirement 3.4: Play Store App Setup

**User Story:** As a product manager, I want the app created in Play Store, so that the listing can be completed and the app uploaded.

#### Acceptance Criteria

1. New app created in Play Store Console
2. App name: "PulseMate Connect"
3. Package name: `com.pulsemate.app` registered
4. Category set to "Medical"
5. Content rating form completed
6. App appears in Play Store Console dashboard

### Requirement 3.5: Play Store Listing Details

**User Story:** As a product manager, I want to complete the app listing with compelling content, so that users can understand what the app does.

#### Acceptance Criteria

1. App title: "PulseMate Connect" (clear and concise)
2. Short description: Under 80 characters, describes main benefit
3. Full description: Includes key features, benefits, and use cases
4. Screenshots: 3-5 high-quality screenshots showing key features
5. App icon: 512x512px PNG with transparency (if applicable)
6. Feature graphic: 1024x500px banner image
7. Privacy policy link provided and accurate
8. Terms of service link provided (if applicable)
9. Contact support email configured
10. Content rating accurate (completed questionnaire)

### Requirement 3.6: App Submission

**User Story:** As a developer, I want to upload the release bundle to Play Store, so that the app can be reviewed and published.

#### Acceptance Criteria

1. Release AAB file uploaded to internal testing track
2. Upload completes without errors
3. Play Store processes AAB and shows "Ready to install"
4. Internal testing version available for testing team
5. Testing link generated and shareable
6. Testing team can install from link

### Requirement 3.7: Internal Testing Phase

**User Story:** As a QA engineer, I want to test the app installed from Play Store, so that we confirm it works through the Play Store distribution channel.

#### Acceptance Criteria

1. App installed on test device from Play Store link
2. App launches successfully
3. Firebase Phone Auth works end-to-end
4. SMS delivery confirmed
5. User creation confirmed
6. No crashes or errors
7. App functions identical to release APK
8. QA sign-off on Play Store version

### Requirement 3.8: Closed Beta (Optional)

**User Story:** As a product manager, I want to run a closed beta with external testers, so that we can get feedback before public launch.

#### Acceptance Criteria

1. Closed beta track created in Play Store
2. External testers invited (10-50 people if possible)
3. Beta duration: 1-2 weeks
4. Feedback collection mechanism in place
5. Critical issues tracked and fixed
6. No go-live blockers identified

### Requirement 3.9: Production Release

**User Story:** As a developer, I want to release the app to all users, so that everyone can download from Play Store.

#### Acceptance Criteria

1. App moved to production track in Play Store
2. Release strategy chosen (instant or phased rollout)
3. Phased rollout recommended: 25% → 50% → 75% → 100%
4. Each phase monitored before proceeding to next
5. Release submitted for Google review
6. App approved by Google (typically 24-48 hours)
7. App goes live and visible in Play Store
8. Download link shared with team

### Requirement 3.10: Production Monitoring

**User Story:** As a developer, I want to monitor the production app for errors and issues, so that we can quickly respond to any problems.

#### Acceptance Criteria

1. Error tracking set up (Sentry, LogRocket, or similar)
2. Performance monitoring enabled (Firebase Performance)
3. Crash reporting enabled
4. Alerts configured for critical errors
5. Team notified immediately of issues
6. Error logs accessible and searchable
7. Response protocol documented

### Requirement 3.11: End-to-End Production Testing

**User Story:** As a QA engineer, I want to test the production app on real devices with real users, so that we confirm everything works correctly in production.

#### Acceptance Criteria

1. App downloaded from Play Store on test device
2. User account created in production database
3. SMS sent and received successfully
4. OTP verified successfully
5. User authenticated and tokens stored
6. User can access app features
7. Multiple users tested
8. Error scenarios tested in production
9. Performance acceptable in production
10. Zero critical issues

### Requirement 3.12: Go-Live Validation

**User Story:** As the project lead, I want final confirmation that production is ready, so that we can officially declare the feature complete.

#### Acceptance Criteria

1. Backend verified with real Firebase credentials
2. App released to Play Store and approved
3. Internal testing completed successfully
4. All production tests passed
5. Error monitoring active and functional
6. Team briefed on monitoring and support
7. Rollback plan documented and understood
8. Go-live approval obtained from stakeholders

---

## Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| SMS Delivery Time | <10 seconds | Users expect quick OTP delivery |
| OTP Verification Time | <2 seconds | Firebase client-side verification is instant |
| Login Flow Duration | <2 minutes | Complete flow from phone input to authentication |
| App Startup Time | <5 seconds | Users expect responsive app launch |
| Crash Rate | <0.1% | High quality bar for production |
| Error Rate | <1% | Minimal failures during normal operation |
| Play Store Rating | 4.0+ stars | Positive user feedback indicator |

---

## Dependencies & Prerequisites

### Before Phase 1 (Testing)
- Development build running successfully
- Real Android devices available
- Firebase project configured with Phone Auth
- google-services.json in place

### Before Phase 2 (Release Build)
- Phase 1 testing complete and passed
- Release keystore created and secured
- Firebase fingerprints registered
- Build configuration properly set

### Before Phase 3 (Production Deployment)
- Phase 2 release build complete and tested
- Play Store account created
- App listing details ready
- Backend Firebase credentials obtained
- Team ready for Go-Live support

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Firebase credentials fail in production | Medium | High | Test thoroughly in staging before deployment |
| Play Store rejects app | Low | Medium | Follow guidelines; pre-review with policy team |
| SMS delivery unreliable | Low | High | Have backup SMS provider researched |
| Significant bugs in production | Low | High | Comprehensive testing before release |
| Backend down during launch | Very Low | Critical | Monitoring alerts; quick response team ready |

---

## Open Questions & Clarifications

1. **Rollout Strategy**: Should the Play Store release be instant (100% immediately) or phased (25/50/75/100%)?
   - **Recommended**: Phased rollout for safer launch
   - **Rationale**: Allows quick rollback if issues discovered

2. **Beta Testing**: Should we run a closed beta before public release?
   - **Recommended**: Yes, 1-2 weeks with 10-50 testers
   - **Rationale**: Gets real-world feedback; discovers issues early

3. **Monitoring**: Which error tracking service to use (Sentry, LogRocket, Firebase Crashlytics)?
   - **Recommended**: Firebase Crashlytics (already integrated with Firebase)
   - **Rationale**: Minimal setup; native Firebase integration

4. **Support**: Who handles production support issues?
   - **Action**: Assign on-call engineer for first week post-launch
   - **Rationale**: Quick response to any issues

---

## Acceptance Criteria Summary

The specification is **COMPLETE** when:

- ✅ All Phase 1 phone testing requirements satisfied
- ✅ All Phase 2 release build requirements satisfied  
- ✅ All Phase 3 production deployment requirements satisfied
- ✅ App successfully released to Google Play Store
- ✅ Real users can download and use the app
- ✅ Production monitoring confirmed active
- ✅ Team confident in production stability

---

**Status**: ✅ Requirements Complete  
**Created**: July 24, 2026  
**Next Step**: Create Design Document
