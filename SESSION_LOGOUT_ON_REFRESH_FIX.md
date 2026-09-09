# Session Logout on Refresh - Analysis & Fix

## 🎯 Problem

**User gets logged out after page refresh (F5, Ctrl+Shift+R, or browser restart)**

## 🔍 Current Architecture

### Session-Based Authentication (Secure)
- Access tokens are NOT stored in localStorage (security improvement)
- Session managed via HttpOnly cookies
- JavaScript cannot access the cookie
- Session restored by calling `/auth/me` on app start

### Flow After Refresh:
1. Page refreshes
2. Zustand rehydrates from localStorage (gets user data)
3. Sets `isInitialized = false` to trigger session restoration
4. App.jsx calls `restoreSession(getMe)`
5. Backend validates cookie and returns user
6. User stays logged in ✅

### What's Going Wrong:
One of these is happening:
1. **Cookie is being cleared** on hard refresh
2. **Backend session expired** (session timeout too short)
3. **`/auth/me` API failing** (CORS, network, or backend error)
4. **Session not being created properly** during login

## 🧪 Debugging Steps

### Step 1: Check if Cookie Exists After Refresh
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Look for cookie (likely named `connect.sid` or `sessionId`)
4. **After refresh, is the cookie still there?**

**If NO cookie after refresh:**
→ Cookie is being cleared (browser issue or cookie settings)

**If cookie EXISTS after refresh:**
→ Cookie is there but `/auth/me` is failing

### Step 2: Check Network Tab
1. Open DevTools (F12) → Network tab
2. Refresh page (F5)
3. Look for `/auth/me` request
4. **Check:**
   - Is request being sent? ✅
   - What's the response status? (200, 401, 500?)
   - Is cookie being sent in request headers?

**If 401 Unauthorized:**
→ Backend doesn't recognize the session

**If 500 Server Error:**
→ Backend crash (check backend logs)

**If no request at all:**
→ `restoreSession` not being called

### Step 3: Check Console Logs
After refresh, you should see:
```
[AuthStore] Rehydrated user profile from localStorage
[App] Restoring session on app start...
[AuthStore] Attempting session restoration...
[AuthStore] Session restored successfully
```

**If you see:**
```
[AuthStore] Session restoration failed
```
→ Backend rejected the session

## 🔧 Possible Fixes

### Fix 1: Increase Backend Session Timeout
**If sessions expire too quickly:**

```javascript
// backend/src/config/session.js or similar
session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (increase from default)
  }
})
```

### Fix 2: Fix Cookie SameSite Settings
**If cookies not being sent:**

```javascript
// backend session config
cookie: {
  sameSite: 'lax', // or 'none' if cross-domain
  secure: false, // set to true in production (HTTPS only)
  httpOnly: true,
}
```

### Fix 3: Add Cookie Domain
**If subdomain issues:**

```javascript
cookie: {
  domain: '.yourdomain.com', // Works for all subdomains
}
```

### Fix 4: Handle Session Restoration Failure Gracefully
**Instead of logging out, keep user data and show re-login:**

```javascript
// In authStore.js restoreSession()
catch (error) {
  console.log('[AuthStore] Session restoration failed:', error.message);
  
  // DON'T clear user data immediately
  // Just mark as not authenticated and let user re-authenticate
  set({
    isAuthenticated: false, // Mark as not authenticated
    isLoading: false,
    isInitialized: true,
    // Keep user data so we can attempt re-authentication
  });
  
  return false;
}
```

## 🎯 Most Likely Causes

Based on your system using session-based auth:

### 1. **Cookie Not Being Created During Login** (MOST LIKELY)
The login flow might not be setting the cookie properly:
- Check if backend sends `Set-Cookie` header after login
- Verify frontend axios is configured with `withCredentials: true`

### 2. **Cookie Not Being Sent on Refresh**
Browser might not be sending cookie due to:
- SameSite restrictions
- Secure flag issues (HTTP vs HTTPS)
- Domain mismatch

### 3. **Backend Session Store Issue**
Session might not be persisting:
- Using memory store (clears on backend restart)
- Need Redis or database session store

## ✅ Immediate Fix (Client-Side)

To prevent user from being completely logged out, update the store:

```javascript
// In authStore.js - restoreSession() catch block
} catch (error) {
  console.error('[AuthStore] Session restoration failed:', error.message);
  
  // Keep user data if it exists, just mark as not authenticated
  const currentUser = get().user;
  
  set({
    user: currentUser, // KEEP user data
    isAuthenticated: false, // But mark as not authenticated
    isLoading: false,
    isInitialized: true,
  });
  
  // Optionally show a toast to re-login
  // toast.info('Please log in again');
  
  return false;
}
```

This way:
- User sees their data
- Can continue navigation
- But needs to re-authenticate for protected actions

## 📝 Next Steps

**To fix this properly, I need you to check:**

1. **After refresh, open DevTools → Console**
   - Share the logs (especially `[AuthStore]` and `[App]` messages)

2. **Open DevTools → Network tab after refresh**
   - Is `/auth/me` being called?
   - What's the status code?
   - Is cookie being sent in Request Headers?

3. **Open DevTools → Application → Cookies**
   - Is there a session cookie?
   - What's its name?
   - Does it have `HttpOnly` flag?

Send me screenshots of these and I can pinpoint the exact issue!

## 🚀 Temporary Workaround

If you need users to stay logged in for now, we can temporarily switch back to localStorage tokens (less secure but works):

**NOT RECOMMENDED but available as emergency fallback**
