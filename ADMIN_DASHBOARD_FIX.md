# ✅ ADMIN DASHBOARD 403 ERROR - FIXED!

**Date:** August 23, 2026  
**Status:** ✅ FIXED - User roles updated

---

## 🐛 Problem

You were getting **403 Forbidden** errors when accessing the admin dashboard:

```
Failed to load resource: the server responded with a status of 403
- /api/admin/dashboard
- /api/admin/notifications
- /api/admin/users
- /api/admin/all-doctors
```

---

## 🔍 Root Cause

**Issue:** Your JWT token had `activeRole: "PATIENT"` but you were trying to access admin routes that require `SUPER_ADMIN`.

**Why?** Your account had:
- `role` (legacy): `SUPER_ADMIN` ✅
- `roles` (new): `["PATIENT", "CLINIC_OWNER"]` ❌ (missing SUPER_ADMIN!)
- `primaryRole`: `PATIENT` ❌ (should be SUPER_ADMIN!)

When you logged in, the JWT was generated with:
```javascript
{
  activeRole: "PATIENT",  // ❌ Wrong!
  roles: ["PATIENT", "CLINIC_OWNER"],  // ❌ Missing SUPER_ADMIN!
  primaryRole: "PATIENT"  // ❌ Wrong!
}
```

So the auth middleware rejected your requests because `activeRole !== "SUPER_ADMIN"`.

---

## ✅ Solution Applied

**Fixed your user account:**

```
Before:
  roles: ["PATIENT", "CLINIC_OWNER"]
  primaryRole: PATIENT
  activeRole: PATIENT (on login)

After:
  roles: ["PATIENT", "CLINIC_OWNER", "SUPER_ADMIN"] ✅
  primaryRole: SUPER_ADMIN ✅
  activeRole: SUPER_ADMIN (on next login) ✅
```

---

## 🚀 **ACTION REQUIRED: LOGOUT AND LOGIN AGAIN**

### **You MUST logout and login again for the fix to work!**

**Steps:**
1. **Logout** from the admin dashboard
2. **Login** again with your credentials
3. Your JWT will now have `activeRole: "SUPER_ADMIN"`
4. Admin dashboard will work! ✅

---

## 🧪 Verify It's Working

After logout + login:

1. **Open browser console** (F12)
2. **Check local storage:**
   ```javascript
   // Get access token
   const token = localStorage.getItem('accessToken');
   
   // Decode JWT (paste in console)
   JSON.parse(atob(token.split('.')[1]));
   
   // Should show:
   {
     "activeRole": "SUPER_ADMIN",  // ✅ Correct!
     "roles": ["PATIENT", "CLINIC_OWNER", "SUPER_ADMIN"],  // ✅ All roles!
     "primaryRole": "SUPER_ADMIN"  // ✅ Correct!
   }
   ```

3. **Try admin dashboard:**
   - Go to `/admin/dashboard`
   - Should load without 403 errors ✅
   - All admin API calls should work ✅

---

## 🎯 Your Account Now

```
User: Sahil Naik
Mobile: +917022818878
ID: b8b7cf17-ba45-4594-baab-6cde6cfa1492

Available Roles:
✅ SUPER_ADMIN (Primary, Default on login)
✅ CLINIC_OWNER (Can switch to)
✅ PATIENT (Can switch to)

Login Behavior:
- Default login → SUPER_ADMIN ✅
- Can switch to CLINIC_OWNER or PATIENT anytime
- Can switch back to SUPER_ADMIN anytime
```

---

## 🔄 Role Switching (Optional)

Now that you have all 3 roles, you can **switch between them without logging out**:

### Using the Role Selector UI:

1. Click **"Switch Role"** button (if integrated)
2. Select the role you want
3. Dashboard updates with new permissions

### Using API directly:

```javascript
// Get current token
const token = localStorage.getItem('accessToken');

// Switch to CLINIC_OWNER
const response = await fetch('https://api.pulsemateconnect.in/api/auth/switch-role', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ newRole: 'CLINIC_OWNER' })
});

const data = await response.json();

// Update token
localStorage.setItem('accessToken', data.data.accessToken);

// Reload page
window.location.reload();
```

---

## 📝 Scripts Created

1. **`fix-user-roles.js`** - Fixed your account (already run)
2. **`set-primary-role.js`** - Change primary role anytime
3. **`approve-role.js`** - Approve pending roles

---

## ❓ Troubleshooting

### Still getting 403 after logout/login?

**Check 1: Did you actually logout?**
```javascript
// Clear everything
localStorage.clear();
sessionStorage.clear();
// Then login again
```

**Check 2: Is the token correct?**
```javascript
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Active Role:', payload.activeRole);
// Should be: "SUPER_ADMIN"
```

**Check 3: Check backend logs**
```bash
# In backend terminal, look for:
[AUTH FAILURE] ...
  userRole: "PATIENT"  // If you see this, token is wrong
```

### Token shows correct role but still 403?

**Possible issue:** Backend might have old code cached

**Solution:**
```bash
# Restart backend
cd backend
npm run dev
```

### Want to switch primary role to something else?

```bash
# Switch to PATIENT as primary
cd backend
node scripts/set-primary-role.js b8b7cf17-ba45-4594-baab-6cde6cfa1492 PATIENT

# Switch to CLINIC_OWNER as primary
node scripts/set-primary-role.js b8b7cf17-ba45-4594-baab-6cde6cfa1492 CLINIC_OWNER

# Switch back to SUPER_ADMIN as primary
node scripts/set-primary-role.js b8b7cf17-ba45-4594-baab-6cde6cfa1492 SUPER_ADMIN
```

---

## 🎉 Summary

**Problem:** JWT had wrong activeRole  
**Cause:** User data migration didn't include SUPER_ADMIN in roles array  
**Fix:** Added SUPER_ADMIN to roles array, set as primaryRole  
**Action:** **LOGOUT AND LOGIN AGAIN** to get new JWT  

---

## ⚠️ **IMPORTANT REMINDER**

**YOU MUST LOGOUT AND LOGIN AGAIN!**

The old JWT in your browser still has `activeRole: "PATIENT"`.  
Logging out clears it.  
Logging in generates a new JWT with `activeRole: "SUPER_ADMIN"`.

**Then the admin dashboard will work perfectly!** ✅

---

**Questions? Let me know!** 😊
