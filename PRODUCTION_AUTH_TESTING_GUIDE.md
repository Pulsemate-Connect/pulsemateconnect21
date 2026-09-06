# ═══════════════════════════════════════════════════════════════════════════
# PRODUCTION AUTHENTICATION TESTING GUIDE
# PulseMate Connect — Session-Based Authentication System
# ═══════════════════════════════════════════════════════════════════════════

## Overview

This document provides comprehensive testing procedures for the production-grade session-based authentication system implemented for PulseMate Connect.

**Testing Priority**: Critical for production deployment
**Estimated Testing Time**: 4-6 hours
**Required Environments**: Development, Staging, Production

---

## Testing Categories

1. [Authentication Flow Testing](#1-authentication-flow-testing)
2. [Session Persistence Testing](#2-session-persistence-testing)
3. [Security Testing](#3-security-testing)
4. [Authorization Testing](#4-authorization-testing)
5. [Cross-Browser Testing](#5-cross-browser-testing)
6. [Performance Testing](#6-performance-testing)
7. [Edge Case Testing](#7-edge-case-testing)

---

## 1. Authentication Flow Testing

### 1.1 Login Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| AUTH-001 | Normal login with valid credentials | 1. Navigate to login<br>2. Enter valid email/mobile + password<br>3. Click login | User logged in, redirected to dashboard, session cookie set | ⬜ NOT TESTED |
| AUTH-002 | Login with invalid password | 1. Navigate to login<br>2. Enter valid email, wrong password<br>3. Click login | Error message: "Invalid credentials", no session created | ⬜ NOT TESTED |
| AUTH-003 | Login with non-existent user | 1. Navigate to login<br>2. Enter fake email + password<br>3. Click login | Error message: "Invalid credentials", no session created | ⬜ NOT TESTED |
| AUTH-004 | Login rate limiting | 1. Attempt login 10 times with wrong password<br>2. Try again | Rate limit error, temporary block | ⬜ NOT TESTED |
| AUTH-005 | Login with suspended account | 1. Login with suspended account credentials | Error message with suspension reason, no session | ⬜ NOT TESTED |
| AUTH-006 | Login with pending approval | 1. Login with pending account credentials | Error message: "Account pending approval" | ⬜ NOT TESTED |

**How to test:**
```bash
# Development environment
1. Start backend: cd backend && npm start
2. Start frontend: cd frontend && npm run dev
3. Open browser: http://localhost:3000
4. Test each scenario above
```

**Verification:**
- Check browser DevTools → Application → Cookies
- Look for `pm_session` cookie with:
  - HttpOnly: ✓ (should NOT be accessible via JavaScript)
  - Secure: ✓ (in production)
  - SameSite: Lax
  - Path: /

---

## 2. Session Persistence Testing

### 2.1 Hard Refresh Tests (CRITICAL)

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| PERSIST-001 | Normal refresh (F5) | 1. Login<br>2. Press F5 | User remains logged in, no login prompt | ⬜ NOT TESTED |
| PERSIST-002 | Hard refresh (Ctrl+Shift+R) | 1. Login<br>2. Press Ctrl+Shift+R | User remains logged in, session restored from cookie | ⬜ NOT TESTED |
| PERSIST-003 | Browser close & reopen | 1. Login<br>2. Close browser completely<br>3. Reopen browser<br>4. Navigate to app | User remains logged in (if session not expired) | ⬜ NOT TESTED |
| PERSIST-004 | New tab | 1. Login in tab 1<br>2. Open new tab<br>3. Navigate to app | User automatically logged in (session shared) | ⬜ NOT TESTED |
| PERSIST-005 | Direct URL access | 1. Login<br>2. Copy protected URL<br>3. Paste in new tab | Access granted without login prompt | ⬜ NOT TESTED |

**Critical Test: Hard Refresh**
```bash
1. Login to PulseMate Connect
2. Navigate to dashboard
3. Press Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
4. Verify: User MUST remain logged in
5. Check DevTools Console for session restoration log
```

**Expected Console Logs:**
```
[AuthStore] Attempting session restoration...
[AuthStore] Session restored successfully { userId: '...', authSource: 'SESSION_COOKIE' }
```

---

### 2.2 Session Expiration Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| EXPIRE-001 | Max age expiration (30 days) | 1. Login<br>2. Wait 30 days (or mock time)<br>3. Refresh page | Session expired, redirect to login | ⬜ NOT TESTED |
| EXPIRE-002 | Idle timeout (7 days inactivity) | 1. Login<br>2. Leave idle for 7 days<br>3. Try API call | Session expired, 401 error, redirect to login | ⬜ NOT TESTED |
| EXPIRE-003 | Admin session expiry (7 days max) | 1. Login as admin<br>2. Wait 7 days<br>3. Refresh | Admin session expired (stricter than normal user) | ⬜ NOT TESTED |
| EXPIRE-004 | Admin idle timeout (1 day) | 1. Login as admin<br>2. Idle for 1 day<br>3. Try action | Session expired due to idle timeout | ⬜ NOT TESTED |

**How to test expiration (without waiting):**
```sql
-- Manually expire session in database
UPDATE sessions 
SET "expiresAt" = NOW() - INTERVAL '1 day'
WHERE "userId" = '<user-id>';

-- Then refresh browser and verify redirect to login
```

---

## 3. Security Testing

### 3.1 Cookie Security Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SEC-001 | HttpOnly flag | 1. Login<br>2. Open DevTools Console<br>3. Try: `document.cookie` | Session cookie NOT visible in output | ⬜ NOT TESTED |
| SEC-002 | Secure flag (production) | 1. Login on production (HTTPS)<br>2. Check cookie in DevTools | Secure: ✓ (only sent over HTTPS) | ⬜ NOT TESTED |
| SEC-003 | SameSite protection | 1. Login<br>2. Check cookie SameSite attribute | SameSite: Lax (CSRF protection) | ⬜ NOT TESTED |
| SEC-004 | Session token in localStorage | 1. Login<br>2. DevTools → Application → Local Storage | NO session token or accessToken present | ⬜ NOT TESTED |
| SEC-005 | Session token hashing | 1. Login<br>2. Check database sessions table | sessionTokenHash is SHA-256 hash (64 chars hex) | ⬜ NOT TESTED |

**JavaScript Cookie Access Test:**
```javascript
// Run in browser console after login
console.log(document.cookie);
// Expected: pm_session cookie should NOT appear in the output
// Only non-HttpOnly cookies will be visible
```

---

### 3.2 CSRF Protection Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| CSRF-001 | Cross-origin POST request | 1. Create malicious HTML page<br>2. Include form that posts to app<br>3. Try to submit | Request blocked by SameSite or CORS | ⬜ NOT TESTED |
| CSRF-002 | Cross-origin with credentials | 1. External site tries fetch with credentials<br>2. Target PulseMate API | CORS error, request blocked | ⬜ NOT TESTED |
| CSRF-003 | Valid same-origin request | 1. Login<br>2. Submit form from app | Request succeeds (same-origin allowed) | ⬜ NOT TESTED |

**CSRF Attack Simulation:**
```html
<!-- Save as csrf-test.html and open in browser -->
<!-- This should FAIL if protection works -->
<html>
<body>
<form action="https://pulsemateconnect.in/api/auth/logout" method="POST">
  <button type="submit">Click me</button>
</form>
<script>
  // This should be blocked by SameSite and CORS
  fetch('https://pulsemateconnect.in/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  }).catch(err => console.log('Blocked:', err));
</script>
</body>
</html>
```

---

### 3.3 Session Revocation Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| REV-001 | Logout revokes session | 1. Login<br>2. Copy session cookie value<br>3. Logout<br>4. Try API call with old cookie | 401 Unauthorized, session revoked in DB | ⬜ NOT TESTED |
| REV-002 | Logout all devices | 1. Login on 2 devices<br>2. Logout all on device 1<br>3. Try API on device 2 | Device 2 logged out, session revoked | ⬜ NOT TESTED |
| REV-003 | Password change revokes sessions | 1. Login<br>2. Change password<br>3. Check old session | Old sessions should be revoked (optional) | ⬜ NOT TESTED |
| REV-004 | Revoked session cannot be reused | 1. Save session cookie<br>2. Logout<br>3. Manually set old cookie<br>4. Try API call | 401 Unauthorized, cannot reuse revoked session | ⬜ NOT TESTED |

---

## 4. Authorization Testing

### 4.1 Role-Based Access Control

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| AUTHZ-001 | Patient → Admin API | 1. Login as patient<br>2. Try: GET /api/admin/dashboard | 403 Forbidden | ⬜ NOT TESTED |
| AUTHZ-002 | Doctor → Patient data | 1. Login as doctor<br>2. Try: GET /api/patient/:otherId/profile | 403 Forbidden (unless authorized) | ⬜ NOT TESTED |
| AUTHZ-003 | Clinic Owner → Own clinic | 1. Login as clinic owner<br>2. GET /api/clinics/:ownClinicId | 200 OK, data returned | ⬜ NOT TESTED |
| AUTHZ-004 | Clinic Owner → Other clinic | 1. Login as clinic owner<br>2. GET /api/clinics/:otherClinicId | 403 Forbidden | ⬜ NOT TESTED |
| AUTHZ-005 | Admin → All resources | 1. Login as admin<br>2. Access various endpoints | Access granted based on admin level | ⬜ NOT TESTED |

**Quick Authorization Test Script:**
```bash
# Test role boundaries
# 1. Login as PATIENT
# 2. Try these requests (should all fail with 403):

curl http://localhost:5000/api/admin/dashboard \
  -H "Cookie: pm_session=<patient-session-cookie>"
# Expected: 403 Forbidden

curl http://localhost:5000/api/doctor/availability \
  -H "Cookie: pm_session=<patient-session-cookie>"
# Expected: 403 Forbidden
```

---

## 5. Cross-Browser Testing

### 5.1 Browser Compatibility

| Browser | Version | Login | Hard Refresh | Logout | Session Persist | Status |
|---------|---------|-------|--------------|--------|-----------------|--------|
| Chrome | Latest | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ NOT TESTED |
| Firefox | Latest | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ NOT TESTED |
| Safari | Latest | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ NOT TESTED |
| Edge | Latest | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ NOT TESTED |
| Mobile Safari (iOS) | Latest | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ NOT TESTED |
| Mobile Chrome (Android) | Latest | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ NOT TESTED |

**Testing Steps for Each Browser:**
1. Login
2. Perform hard refresh (Ctrl+Shift+R)
3. Close browser and reopen
4. Open multiple tabs
5. Test logout
6. Verify session cookie settings in DevTools

---

## 6. Performance Testing

### 6.1 Session Performance

| Test ID | Test Case | Expected Performance | Status |
|---------|-----------|---------------------|--------|
| PERF-001 | Session validation time | < 50ms per request | ⬜ NOT TESTED |
| PERF-002 | User cache hit rate | > 80% cache hits | ⬜ NOT TESTED |
| PERF-003 | Session restoration time (/auth/me) | < 200ms | ⬜ NOT TESTED |
| PERF-004 | Concurrent sessions | Support 1000+ active sessions | ⬜ NOT TESTED |
| PERF-005 | Database session queries | Indexed, < 10ms | ⬜ NOT TESTED |

**Load Testing Script:**
```bash
# Install Apache Bench
# Test session endpoint under load

ab -n 1000 -c 50 -C "pm_session=<valid-session-cookie>" \
   http://localhost:5000/api/auth/me

# Expected:
# - 100% success rate
# - < 200ms average response time
# - No 401 errors
```

---

## 7. Edge Case Testing

### 7.1 Edge Cases

| Test ID | Test Case | Expected Behavior | Status |
|---------|-----------|------------------|--------|
| EDGE-001 | Simultaneous login (2 devices) | Both sessions valid, separate tracking | ⬜ NOT TESTED |
| EDGE-002 | Cookie deleted manually | Next request fails with 401, redirect to login | ⬜ NOT TESTED |
| EDGE-003 | Network interruption during auth | Graceful error, retry mechanism | ⬜ NOT TESTED |
| EDGE-004 | Database session record deleted | Validation fails, 401, redirect to login | ⬜ NOT TESTED |
| EDGE-005 | Clock skew (server vs client) | Session validation works (uses server time) | ⬜ NOT TESTED |
| EDGE-006 | Very long session (> 30 days) | Session expires, user must re-login | ⬜ NOT TESTED |
| EDGE-007 | Rapid logout/login cycles | No errors, sessions properly created/revoked | ⬜ NOT TESTED |
| EDGE-008 | Session during server restart | Session persists (stored in DB, not memory) | ⬜ NOT TESTED |

---

## Testing Checklist

### Pre-Production Verification

- [ ] All critical tests passed (PERSIST-001, PERSIST-002, PERSIST-003)
- [ ] Security tests passed (SEC-001 through SEC-005)
- [ ] Authorization tests passed (no role escalation possible)
- [ ] Cross-browser compatibility verified
- [ ] CSRF protection verified
- [ ] Session revocation works correctly
- [ ] Performance meets requirements
- [ ] Audit logs generated for all auth events
- [ ] Error messages are safe (no information leakage)
- [ ] HTTPS enforced in production

### Post-Deployment Monitoring

- [ ] Session creation rate monitored
- [ ] Failed login attempts tracked
- [ ] Session revocations logged
- [ ] Performance metrics collected
- [ ] Error rates acceptable
- [ ] No security incidents reported

---

## Known Limitations & Future Enhancements

### Current Limitations:
1. **No explicit CSRF tokens** — Relies on SameSite cookies (adequate for most cases)
2. **Manual testing required** — Automated E2E tests not yet implemented
3. **Session restoration UX** — Brief loading screen on hard refresh (acceptable)

### Planned Enhancements:
1. **Automated E2E tests** — Playwright/Cypress test suite
2. **CSRF tokens** — For highly sensitive operations (payments, admin actions)
3. **Session management UI** — Users can view/revoke active sessions
4. **Suspicious login detection** — IP/location-based alerts
5. **2FA/MFA** — Additional security layer for admin accounts

---

## Reporting Issues

If tests fail, document:
1. **Test ID** that failed
2. **Environment** (dev/staging/production)
3. **Browser** and version
4. **Steps to reproduce**
5. **Expected vs actual result**
6. **Console logs** and network requests
7. **Database session state**

Report to: development team via issue tracker

---

## Testing Sign-off

**Tester Name:** ___________________________

**Date:** ___________________________

**Environment Tested:** ☐ Development  ☐ Staging  ☐ Production

**Test Coverage:**
- Critical Tests: _____ / _____
- Security Tests: _____ / _____  
- Browser Tests: _____ / _____

**Overall Status:** ☐ PASS  ☐ FAIL  ☐ PARTIAL

**Comments:**
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________

**Signature:** ___________________________

---

**End of Testing Guide**
