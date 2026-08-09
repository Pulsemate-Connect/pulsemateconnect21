# 🚀 Persistent Login - Deployment Checklist

**Feature:** 30-Day Persistent Login with Sliding Session  
**Status:** Ready for Production  
**Date:** August 9, 2026

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Code Changes

- [✅] Updated `JWT_REFRESH_EXPIRY` in `backend/.env` (7d → 30d)
- [✅] Updated `JWT_REFRESH_EXPIRY` in `backend/.env.example` (for documentation)
- [✅] Modified `REFRESH_EXPIRY` in `backend/src/services/token.service.js`
- [✅] Modified `REFRESH_COOKIE_MAX_AGE` in `backend/src/services/token.service.js`
- [✅] Updated `issueAuthTokens` cookie max age in `backend/src/controllers/auth.controller.js`
- [✅] Updated `refreshTokenHandler` cookie max age in `backend/src/controllers/auth.controller.js`
- [✅] Fixed `logoutHandler` to support mobile refresh tokens in `backend/src/controllers/auth.controller.js`
- [✅] Created `backend/src/jobs/cleanup-tokens.job.js`
- [✅] Registered cleanup job in `backend/src/server.js`

### Testing

- [✅] Tested token expiry (30 days confirmed)
- [✅] Tested sliding window (session extends on refresh)
- [✅] Tested access token auto-refresh
- [✅] Tested logout revocation
- [✅] Tested mobile refresh token in request body
- [✅] Tested cleanup job execution

### Documentation

- [✅] Created `PERSISTENT-LOGIN-AUDIT.md` (system audit)
- [✅] Created `PERSISTENT-LOGIN-IMPLEMENTATION.md` (complete documentation)
- [✅] Created `PERSISTENT-LOGIN-DEPLOY-CHECKLIST.md` (this file)

---

## 📋 DEPLOYMENT STEPS

### Step 1: Update Render Environment (5 minutes)

1. Go to: https://dashboard.render.com/
2. Click: **pulsemate-backend**
3. Click: **Environment** tab
4. Find or add variable:
   ```
   Key:   JWT_REFRESH_EXPIRY
   Value: 30d
   ```
5. Click: **Save Changes**
6. Render will automatically redeploy

**Wait:** 2-3 minutes for deployment to complete

### Step 2: Verify Backend Restart

1. Go to: **Logs** tab
2. Watch for:
   ```
   🚀 PulseMate API running on port 5000
   📡 Socket.io ready
   Token cleanup job scheduled (daily at 2:00 AM)
   ```
3. Verify no errors in startup

### Step 3: Test in Production (10 minutes)

**Test A: New Login**
```
1. Open app on mobile/emulator
2. Login with OTP
3. Verify tokens stored
4. Close app completely
5. Reopen app
6. Verify still logged in ✅
```

**Test B: Token Refresh**
```
1. Login
2. Wait 16+ minutes (access token expires)
3. Make API call (any screen that loads data)
4. Verify no login prompt
5. Check Metro logs for:
   [API] POST .../auth/refresh
   Token refreshed ✅
```

**Test C: Logout**
```
1. Login
2. Navigate to Profile
3. Tap Logout
4. Verify login screen shown
5. Try to reopen app
6. Verify still logged out ✅
```

### Step 4: Monitor for 24 Hours

**Check these metrics daily for 1 week:**

1. **Login Success Rate**
   - Should remain >99%
   - No increase in auth failures

2. **Refresh Token Errors**
   - Check Render logs for:
     ```
     [Auth] ❌ Refresh token expired
     [Auth] ❌ Invalid refresh token
     ```
   - Should be minimal (<0.1%)

3. **Database Size**
   - Check RefreshToken table:
     ```sql
     SELECT COUNT(*) FROM "refresh_tokens";
     SELECT COUNT(*) FROM "refresh_tokens" WHERE "expiresAt" < NOW();
     ```
   - Expired tokens should be auto-deleted

4. **Cleanup Job**
   - Check logs at 2:00 AM daily:
     ```
     [Cleanup] Deleted X expired/revoked refresh tokens
     ```

### Step 5: Update Frontend (If Needed)

**Current frontend already compatible!** No changes needed.

But if deploying new frontend build:
```bash
# React Native / Expo
cd pulsemateconnect21
eas build --platform android
```

---

## 🧪 PRODUCTION TESTING SCRIPT

### Test Case 1: 30-Day Persistence

```
Day 0:  ✅ Login with OTP
Day 1:  ✅ Open app → Still logged in
Day 3:  ✅ Open app → Still logged in
Day 7:  ✅ Open app → Still logged in
Day 14: ✅ Open app → Still logged in
Day 21: ✅ Open app → Still logged in
Day 29: ✅ Open app → Still logged in
Day 30: ✅ Open app → Still logged in
Day 31: ❌ Session expires → Login required

Expected: User stays logged in for 30+ days
```

### Test Case 2: Sliding Session

```
Day 0:  Login (session expires Day 30)
Day 15: Use app → Access refreshed (session now expires Day 45)
Day 30: Use app → Access refreshed (session now expires Day 60)
Day 45: Use app → Access refreshed (session now expires Day 75)

Expected: Active users never logged out
```

### Test Case 3: Access Token Auto-Refresh

```
1. Login
2. Make API call → Success
3. Wait 16 minutes
4. Make API call → 401 → Auto-refresh → Retry → Success
5. Check SecureStore: new access token saved

Expected: Seamless refresh, no user interruption
```

### Test Case 4: Logout Works

```
1. Login on Device A
2. Login on Device B
3. Logout on Device A
4. Verify Device A logged out
5. Verify Device B still logged in
6. Try to refresh on Device A
7. Expect 401 error (token revoked)

Expected: Device-specific logout
```

### Test Case 5: Force Stop Recovery

```
1. Login
2. Force stop app (Android: Settings → Apps → Force Stop)
3. Reopen app
4. Verify still logged in

Expected: Session persists after force stop
```

### Test Case 6: Network Recovery

```
1. Login
2. Enable airplane mode
3. Close app
4. Disable airplane mode
5. Reopen app
6. Verify still logged in (may show loading briefly)

Expected: Session restored after network outage
```

---

## 🔍 MONITORING QUERIES

### Check Active Sessions

```sql
-- Total active refresh tokens
SELECT COUNT(*) 
FROM "refresh_tokens" 
WHERE "revokedAt" IS NULL 
  AND "expiresAt" > NOW();

-- Sessions per user
SELECT "userId", COUNT(*) as sessions
FROM "refresh_tokens"
WHERE "revokedAt" IS NULL
  AND "expiresAt" > NOW()
GROUP BY "userId"
ORDER BY sessions DESC
LIMIT 10;

-- Oldest active sessions
SELECT "userId", "createdAt", "expiresAt", "lastUsedAt"
FROM "refresh_tokens"
WHERE "revokedAt" IS NULL
  AND "expiresAt" > NOW()
ORDER BY "createdAt" ASC
LIMIT 10;
```

### Check Expired Tokens

```sql
-- Count expired tokens (should be 0 after cleanup)
SELECT COUNT(*) 
FROM "refresh_tokens" 
WHERE "expiresAt" < NOW();

-- Count revoked tokens
SELECT COUNT(*) 
FROM "refresh_tokens" 
WHERE "revokedAt" IS NOT NULL;
```

### Check Session Activity

```sql
-- Most active users (frequent refreshes)
SELECT "userId", COUNT(*) as refresh_count
FROM "refresh_tokens"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY "userId"
ORDER BY refresh_count DESC
LIMIT 10;

-- Average session duration
SELECT AVG(EXTRACT(EPOCH FROM ("revokedAt" - "createdAt")) / 86400) as avg_days
FROM "refresh_tokens"
WHERE "revokedAt" IS NOT NULL;
```

---

## ⚠️ ROLLBACK PLAN

If issues occur after deployment:

### Step 1: Revert Environment Variable

```
Render Dashboard → pulsemate-backend → Environment
Change:
  JWT_REFRESH_EXPIRY = 7d  (back to original)
Save changes
```

### Step 2: Restart Backend

Render will auto-restart after environment change.

### Step 3: Verify Rollback

```
Check logs for:
  🚀 PulseMate API running on port 5000
  
New tokens will have 7-day expiry again.
Existing 30-day tokens will continue to work until they expire.
```

### Step 4: Notify Users (if needed)

```
If widespread issues:
  - Send in-app notification
  - Ask users to logout and login again
  - This forces new 7-day tokens
```

---

## 📊 SUCCESS METRICS

### Week 1 Goals

- ✅ Zero critical auth errors
- ✅ Login success rate >99%
- ✅ Refresh token errors <0.1%
- ✅ Cleanup job runs daily
- ✅ No database performance issues

### Month 1 Goals

- ✅ OTP usage reduced by 80%
- ✅ User retention improved
- ✅ No security incidents
- ✅ Database size stable
- ✅ Positive user feedback

---

## 🎯 POST-DEPLOYMENT TASKS

### Immediate (Day 1)

- [ ] Verify deployment successful
- [ ] Test login/logout on mobile
- [ ] Check Render logs for errors
- [ ] Monitor error tracking (if using Sentry)

### Short-term (Week 1)

- [ ] Monitor daily cleanup job logs
- [ ] Check RefreshToken table size
- [ ] Review user feedback
- [ ] Test on multiple devices
- [ ] Document any issues

### Long-term (Month 1)

- [ ] Analyze OTP cost savings
- [ ] Review session duration analytics
- [ ] Consider adding max session lifetime
- [ ] Evaluate adding "Active sessions" UI
- [ ] Update user documentation

---

## 📞 SUPPORT CONTACTS

### If Issues Occur

**Backend Issues:**
- Check: Render dashboard logs
- Contact: DevOps team

**Frontend Issues:**
- Check: Metro bundler logs
- Contact: Mobile team

**Database Issues:**
- Check: Render database metrics
- Contact: Database admin

---

## ✅ DEPLOYMENT SIGN-OFF

```
Pre-Deployment:
  [✅] Code changes reviewed
  [✅] All tests passing
  [✅] Documentation complete
  [✅] Rollback plan prepared

Deployment:
  [ ] Environment updated on Render
  [ ] Backend restarted successfully
  [ ] Production tests completed
  [ ] Monitoring enabled

Post-Deployment:
  [ ] No critical errors (24 hours)
  [ ] User feedback positive
  [ ] Metrics within targets
  [ ] Team notified

Signed off by: _______________________
Date: _______________________
```

---

**Deployment Status:** Ready  
**Risk Level:** Low  
**Rollback Time:** <5 minutes  
**Expected Impact:** Positive (better UX, lower costs)

**READY TO DEPLOY! 🚀**

