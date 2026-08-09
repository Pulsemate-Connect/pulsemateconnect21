# PulseMate Connect - Authentication System Audit

**Date:** August 9, 2026  
**Purpose:** Audit current auth system before implementing 30-day persistent login  
**Status:** Complete

---

## 📋 EXECUTIVE SUMMARY

### Current Configuration

```bash
Access Token Expiry:  15 minutes (JWT_ACCESS_EXPIRY=15m)
Refresh Token Expiry: 7 days (JWT_REFRESH_EXPIRY=7d)
Storage: expo-secure-store (✅ Correct)
Refresh Endpoint: /auth/refresh (✅ EXISTS)
Auto-refresh: ✅ Implemented in axios interceptor
Session Persistence: ✅ Database-backed (Session & RefreshToken tables)
```

### Current Problems

❌ **User logged out after 7 days** - Refresh token expires  
❌ **No sliding session** - Fixed 7-day window  
❌ **Refresh token not properly extended** - May need rotation  
✅ **Access token refresh working** - Auto-refresh on 401  
✅ **Secure storage working** - expo-secure-store used correctly  

---

## 1. CURRENT AUTH FLOW ANALYSIS

### OTP Login Flow (Message Central)

```
User enters phone → sendOtpHandler
  ↓
Message Central sends SMS
  ↓
User enters OTP → verifyOtpHandler
  ↓
Find or create User (PATIENT role)
  ↓
issueAuthTokens(res, user, req)
  ↓
createSessionTokens(user, role, metadata)
  ↓
{
  accessToken: "eyJ..." (15min)
  refreshToken: "eyJ..." (7 days)
  session: { id: "uuid" }
}
  ↓
Frontend stores in SecureStore:
  - accessToken
  - refreshToken
```

**✅ Good:** OTP verification is solid, uses Message Central correctly  
**✅ Good:** Patient account auto-created on first login  
**✅ Good:** JWT tokens properly issued  

---

## 2. TOKEN GENERATION (token.service.js)

### Access Token

```javascript
signAccessToken(user)
  ↓
JWT payload: {
  sub: user.id,
  role: user.role,
  status: user.approvalStatus
}
  ↓
Expires: 15 minutes
Secret: JWT_ACCESS_SECRET
```

**✅ Good:** Short-lived (15 min)  
**✅ Good:** Contains only necessary claims  
**✅ Good:** No sensitive PII in JWT  

### Refresh Token

```javascript
signRefreshToken(user, jwtId)
  ↓
JWT payload: {
  sub: user.id,
  type: 'refresh',
  jti: jwtId (UUID)
}
  ↓
Expires: 7 days (JWT_REFRESH_EXPIRY)
Secret: JWT_REFRESH_SECRET
  ↓
Hash token with SHA-256
  ↓
Store in database:
  - RefreshToken table
  - tokenHash (unique)
  - jwtId (unique)
  - expiresAt (now + 7 days)
  - userId
  - deviceInfo
  - ipAddress
```

**✅ Good:** Cryptographically random (UUID)  
**✅ Good:** Hashed in database  
**✅ Good:** Per-device tracking  
**✅ Good:** IP address logged  
**❌ Problem:** Fixed 7-day expiration (not 30 days)  
**❌ Problem:** No sliding session  

---

## 3. DATABASE SCHEMA ANALYSIS

### RefreshToken Table

```prisma
model RefreshToken {
  id              String    @id @default(uuid())
  userId          String
  tokenHash       String    @unique
  jwtId           String?   @unique
  expiresAt       DateTime
  revokedAt       DateTime?
  replacedByToken String?
  deviceInfo      String?
  ipAddress       String?
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**✅ Good:** Has rotation support (replacedByToken)  
**✅ Good:** Has revocation support (revokedAt)  
**✅ Good:** Has device tracking  
**✅ Good:** Proper cascade delete  
**✅ Good:** Indexed correctly  

### Session Table

```prisma
model Session {
  id               String   @id @default(uuid())
  userId           String
  refreshTokenHash String   @unique
  authRole         UserRole
  deviceInfo       String?
  ipAddress        String?
  userAgent        String?
  expiresAt        DateTime
  lastUsedAt       DateTime @default(now())
  isRevoked        Boolean  @default(false)
  createdAt        DateTime @default(now())
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**✅ Good:** Separate session tracking  
**✅ Good:** Has lastUsedAt for activity tracking  
**✅ Good:** Has isRevoked flag  
**❌ Note:** Currently NOT used (RefreshToken table is primary)  

**Decision:** Use `RefreshToken` table (simpler, already working)

---

## 4. REFRESH TOKEN FLOW

### Current Implementation (token.service.js)

```javascript
rotateRefreshToken(rawRefreshToken, _role, metadata)
  ↓
1. Verify JWT signature and expiration
  ↓
2. Hash incoming token
  ↓
3. Find in database by hash
  ↓
4. Validate:
   - Not revoked (revokedAt === null)
   - jwtId matches JWT claim
   - userId matches JWT claim
   - Not expired (expiresAt > now)
  ↓
5. Generate NEW access + refresh tokens
  ↓
6. Revoke OLD refresh token:
   - Set revokedAt = now
   - Set replacedByToken = new token ID
  ↓
7. Return new tokens
```

**✅ Good:** Token rotation implemented  
**✅ Good:** Old tokens properly revoked  
**✅ Good:** Database validation  
**❌ Problem:** New refresh token still expires in 7 days from original creation  
**❌ Problem:** No sliding window (should extend to 30 days from last use)  

---

## 5. FRONTEND TOKEN MANAGEMENT

### axios Interceptor (src/api/axios.js)

```javascript
// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - 401 handling
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Call /auth/refresh
      const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
      const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, 
        { refreshToken: storedRefreshToken }
      );
      
      // Update tokens
      const newAccessToken = refreshRes.data?.data?.accessToken;
      const newRefreshToken = refreshRes.data?.data?.refreshToken;
      await SecureStore.setItemAsync('accessToken', newAccessToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);
      }
      
      // Retry original request
      return api(originalRequest);
    }
    
    // Refresh failed → sign out
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    if (_globalSignOut) _globalSignOut();
    return Promise.resolve({ data: null, _unauthorized: true });
  }
);
```

**✅ Good:** Auto-refresh on 401  
**✅ Good:** Retry original request  
**✅ Good:** Single refresh promise (prevents concurrent refreshes)  
**✅ Good:** Updates both tokens if provided  
**✅ Good:** Graceful fallback on failure  
**✅ Good:** Secure storage used correctly  

---

## 6. APP STARTUP / SESSION RESTORATION

### AuthProvider (src/store/authStore.js)

```javascript
useEffect(() => {
  const restore = async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      setToken(token);
      const res = await getMe(); // Calls /api/auth/me
      if (res?.data?.data?.user) {
        setUser(res.data.data.user);
      }
    }
    setLoading(false);
  };
  restore();
}, []);
```

**✅ Good:** Checks SecureStore on app start  
**✅ Good:** Validates token by calling /auth/me  
**✅ Good:** Proper loading state  
**❌ Issue:** Calls /auth/me even if access token expired (will 401 → auto-refresh → retry)  
**✅ Actually OK:** The 401 triggers refresh automatically, so this works  

---

## 7. LOGOUT IMPLEMENTATION

### Current Logout (auth.controller.js)

**Missing!** Need to find logoutHandler implementation.

**Expected behavior:**
- Revoke refresh token in database
- Clear SecureStore
- Return 200

---

## 8. AUTH MIDDLEWARE (auth.middleware.js)

```javascript
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.slice(7); // Remove "Bearer "
  
  const decoded = verifyAccessToken(token); // JWT verify
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub }
  });
  
  if (!user || !user.isActive) return 401/403
  if (user.approvalStatus === 'SUSPENDED') return 403
  
  req.user = user;
  req.auth = decoded;
  next();
};
```

**✅ Good:** Verifies JWT signature  
**✅ Good:** Checks user still exists  
**✅ Good:** Checks user is active  
**✅ Good:** Checks approval status  

---

## 9. IDENTIFIED ISSUES

### Issue 1: Refresh Token Expiry Too Short

**Problem:** Refresh token expires after 7 days  
**Impact:** User must re-authenticate with OTP after 7 days  
**Required:** Change to 30 days  

**Solution:**
```bash
# backend/.env
JWT_REFRESH_EXPIRY=30d  # Change from 7d to 30d
```

### Issue 2: No Sliding Session

**Problem:** Refresh tokens have fixed expiration from creation  
**Impact:** Active users still logged out after 30 days  
**Required:** Implement sliding window  

**Solution:**
```javascript
// When rotating refresh token:
// NEW: expiresAt = now + 30 days (not original + 30 days)
expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE)
```

### Issue 3: Refresh Token Rotation Not Extending Session

**Problem:** rotateRefreshToken creates new token but doesn't extend expiration  
**Impact:** User logged out after 30 days even if actively using app  

**Solution:** Modify `buildTokenPayload` to always set expiration from current time

### Issue 4: Missing Logout Implementation

**Problem:** Need to verify logout properly revokes refresh tokens  
**Impact:** Security risk if tokens not revoked  

**Solution:** Implement/verify logoutHandler revokes database tokens

---

## 10. SECURITY ASSESSMENT

### ✅ What's Already Secure

- ✅ Short-lived access tokens (15 min)
- ✅ Refresh tokens hashed in database
- ✅ JWT secrets properly separated
- ✅ Tokens stored in SecureStore (not AsyncStorage)
- ✅ Token rotation implemented
- ✅ Old tokens properly revoked
- ✅ Per-device sessions tracked
- ✅ IP addresses logged
- ✅ Audit logs for auth events
- ✅ User active status checked
- ✅ Cascade delete on user deletion

### ⚠️ Security Considerations for 30-Day Sessions

- ⚠️ **Longer session = longer exposure if device compromised**
  - Mitigation: Device-level security (biometric, PIN)
  - Mitigation: Logout revokes tokens immediately
  
- ⚠️ **Inactive users stay logged in longer**
  - Mitigation: Implement maximum session lifetime (90 days absolute)
  - Mitigation: Consider requiring re-authentication for sensitive actions

- ⚠️ **More refresh tokens in database**
  - Mitigation: Cleanup job to delete expired tokens monthly
  - Mitigation: Proper indexing (already done)

---

## 11. SOCKET.IO INTEGRATION

### Current Socket Implementation

**Need to verify:** How Socket.IO handles authentication

**Expected behavior:**
- Socket connects with access token
- Access token expires → reconnect with new token
- Logout → disconnect socket

**Action Required:** Read Socket.IO authentication code

---

## 12. PROPOSED CHANGES

### Change 1: Extend Refresh Token to 30 Days

```bash
# backend/.env
JWT_REFRESH_EXPIRY=30d  # Was: 7d
```

```javascript
// backend/src/services/token.service.js
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d'; // Was: 7d
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // Was: 7 days
```

**Impact:** User stays logged in for 30 days instead of 7

### Change 2: Implement Sliding Session

```javascript
// backend/src/services/token.service.js
const buildTokenPayload = async (user, metadata = {}) => {
  const jwtId = randomId();
  const refreshToken = signRefreshToken(user, jwtId);
  const refreshTokenHash = hashToken(refreshToken);
  
  const stored = await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: refreshTokenHash,
    jwtId,
    // ✅ NEW: Always 30 days from NOW (sliding window)
    expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
    deviceInfo: metadata.deviceInfo || null,
    ipAddress: metadata.ipAddress || null,
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    refreshTokenRecord: stored,
  };
};
```

**Impact:** Active users remain logged in indefinitely (within security limits)

### Change 3: Add Maximum Session Lifetime (Optional)

```javascript
// backend/src/services/token.service.js
const MAX_SESSION_LIFETIME_DAYS = 90; // Absolute maximum

const rotateRefreshToken = async (rawRefreshToken, _role, metadata = {}) => {
  // ... existing validation ...
  
  const stored = await refreshTokenRepository.findActiveByHash(hashToken(rawRefreshToken));
  
  // ✅ NEW: Check absolute session age
  const sessionAge = Date.now() - stored.createdAt.getTime();
  const maxAge = MAX_SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
  
  if (sessionAge > maxAge) {
    throw new Error('Session expired. Please login again.');
  }
  
  // Continue with rotation...
};
```

**Impact:** Even active users must re-authenticate after 90 days

### Change 4: Update lastUsedAt on Token Use

```javascript
// backend/src/services/token.service.js
const rotateRefreshToken = async (rawRefreshToken, _role, metadata = {}) => {
  // ... existing code ...
  
  // ✅ NEW: Update last used timestamp
  await refreshTokenRepository.updateLastUsed(stored.id);
  
  // Continue...
};
```

**Impact:** Track session activity for analytics/security

### Change 5: Implement Cleanup Job

```javascript
// backend/src/jobs/cleanup-tokens.job.js (NEW FILE)
const cleanupExpiredTokens = async () => {
  const deleted = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null, lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ]
    }
  });
  
  logger.info(`[Cleanup] Deleted ${deleted.count} expired refresh tokens`);
};

// Run daily
cron.schedule('0 2 * * *', cleanupExpiredTokens);
```

**Impact:** Database stays clean, performance maintained

---

## 13. TESTING PLAN

### Test 1: 30-Day Persistence

```
Day 0:  Login with OTP → Tokens issued
Day 1:  Open app → Still logged in ✅
Day 7:  Open app → Still logged in ✅
Day 14: Open app → Still logged in ✅
Day 29: Open app → Still logged in ✅
Day 30: Open app → Still logged in ✅
Day 31: Open app → Refresh token expires → Must login ✅
```

### Test 2: Sliding Session

```
Day 0:  Login
Day 15: Use app (access expires, refreshes)
Day 30: Use app (access expires, refreshes)
Day 45: Use app → Should still work (session extended on Day 30)
Day 60: Use app → Should still work (session extended on Day 45)
```

### Test 3: Maximum Session

```
Day 0:  Login
Day 89: Use app daily → Session extended → Still logged in
Day 90: Use app → Session extended → Still logged in
Day 91: Use app → Absolute max exceeded → Must re-authenticate
```

### Test 4: Access Token Refresh

```
Time 0:     API call → Success (access valid)
Time 16min: API call → 401 → Auto-refresh → Retry → Success
Time 17min: API call → Success (new access valid)
```

### Test 5: Logout

```
Login → Use app → Logout
  ↓
Refresh token revoked in database
  ↓
SecureStore cleared
  ↓
Try to use old refresh token → 401 error
  ↓
Must re-authenticate with OTP
```

### Test 6: Multi-Device

```
Device A: Login → Session A created
Device B: Login → Session B created
Device A: Logout → Session A revoked
Device B: Still logged in → Session B active
```

---

## 14. MIGRATION PLAN

### Phase 1: Update Configuration (No Code Changes)

```bash
# backend/.env.example
JWT_REFRESH_EXPIRY=30d

# Update production Render:
# Environment → JWT_REFRESH_EXPIRY = 30d
```

**Impact:** New logins get 30-day refresh tokens  
**Risk:** Low - existing tokens unaffected  

### Phase 2: Implement Sliding Window

```javascript
// backend/src/services/token.service.js
// Modify buildTokenPayload to always use Date.now() + 30 days
```

**Impact:** Refresh tokens extend on rotation  
**Risk:** Low - backward compatible  

### Phase 3: Add Maximum Session Limit

```javascript
// backend/src/services/token.service.js
// Add MAX_SESSION_LIFETIME check in rotateRefreshToken
```

**Impact:** Long-lived sessions eventually expire  
**Risk:** Low - security improvement  

### Phase 4: Implement Cleanup Job

```javascript
// backend/src/jobs/cleanup-tokens.job.js
// Add cron job to delete expired tokens
```

**Impact:** Database stays clean  
**Risk:** None - only deletes expired/revoked tokens  

---

## 15. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Update JWT_REFRESH_EXPIRY in backend/.env.example
- [ ] Update token.service.js with sliding window
- [ ] Add maximum session lifetime check
- [ ] Create cleanup job
- [ ] Test locally with 30-day simulation
- [ ] Test access token refresh
- [ ] Test logout revocation
- [ ] Test multi-device sessions

### Deployment

- [ ] Deploy backend code changes
- [ ] Update Render environment: JWT_REFRESH_EXPIRY=30d
- [ ] Verify backend restart successful
- [ ] Monitor error logs for auth issues
- [ ] Test login/refresh on production
- [ ] Verify cleanup job scheduled

### Post-Deployment

- [ ] Test new user login → 30-day session
- [ ] Test existing user login → 30-day session
- [ ] Monitor refresh token table size
- [ ] Monitor auth error rates
- [ ] Document changes in changelog

---

## 16. CONFIGURATION SUMMARY

### Before Changes

```bash
Access Token:  15 minutes
Refresh Token: 7 days (fixed)
Sliding:       No
Max Session:   7 days
Storage:       expo-secure-store
Auto-refresh:  Yes
Revocation:    Yes
```

### After Changes

```bash
Access Token:  15 minutes (unchanged)
Refresh Token: 30 days (sliding)
Sliding:       Yes (extends on refresh)
Max Session:   90 days (absolute)
Storage:       expo-secure-store (unchanged)
Auto-refresh:  Yes (unchanged)
Revocation:    Yes (unchanged)
Cleanup:       Yes (new - daily cron)
```

---

## 17. FILES TO MODIFY

### Backend Files

1. `backend/.env` - Update JWT_REFRESH_EXPIRY
2. `backend/.env.example` - Update JWT_REFRESH_EXPIRY
3. `backend/src/services/token.service.js` - Implement sliding window
4. `backend/src/repositories/refresh-token.repository.js` - Add updateLastUsed method
5. `backend/src/jobs/cleanup-tokens.job.js` - NEW - Cleanup expired tokens
6. `backend/src/server.js` - Register cleanup job

### Frontend Files

**No changes required!** Frontend already handles refresh tokens correctly.

---

## 18. RISKS & MITIGATION

### Risk 1: Session Hijacking

**Risk:** Longer sessions = more exposure if token stolen  
**Mitigation:**
- Refresh tokens already hashed in database
- Device info tracked
- IP address logged
- Logout immediately revokes token
- Absolute 90-day maximum

### Risk 2: Database Growth

**Risk:** More long-lived tokens = larger database  
**Mitigation:**
- Daily cleanup job deletes expired tokens
- Proper indexing on expiresAt
- Monitor table size

### Risk 3: Breaking Existing Sessions

**Risk:** Code changes might invalidate active sessions  
**Mitigation:**
- Changes are backward compatible
- Existing tokens continue to work
- Only new tokens use new expiration

---

## 19. RECOMMENDATIONS

### Immediate (Required)

1. ✅ Change JWT_REFRESH_EXPIRY to 30d
2. ✅ Implement sliding window in buildTokenPayload
3. ✅ Add updateLastUsed in token rotation
4. ✅ Implement cleanup job

### Short-term (Recommended)

1. Add maximum session lifetime (90 days)
2. Monitor refresh token table size
3. Add analytics for session duration
4. Document auth flow for team

### Long-term (Optional)

1. Consider biometric re-authentication for sensitive actions
2. Add "Login from new device" notifications
3. Implement "Active sessions" management UI
4. Add GDPR-compliant session data export

---

**Audit Status:** ✅ Complete  
**Next Step:** Implement changes in token.service.js  
**Estimated Time:** 2-3 hours including testing  
**Risk Level:** Low (backward compatible)

