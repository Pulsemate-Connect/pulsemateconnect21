# 🔄 Multi-Role Support - Current Status & Workaround

**Date:** 2026-08-12 02:40 AM  
**Issue:** User 9999999999 is PATIENT but wants to register as CLINIC_OWNER  
**Status:** ⚠️ Temporary Workaround Applied (Full multi-role not yet implemented)

---

## Current Situation

### What You Experienced

```
Mobile: 9999999999
OTP: 123456
Result: ✅ Login successful
BUT: Redirected to /patient/home instead of /clinic/onboarding/step-1
```

### Why This Happened

The user account has:
- **Role:** PATIENT (single role only)
- **Profile:** patient_profile exists
- **Intent:** Wants to become CLINIC_OWNER too

The system currently uses **single-role architecture**:
- One user = ONE role (enum: PATIENT, DOCTOR, CLINIC_OWNER, etc.)
- Cannot have multiple roles simultaneously
- Redirect based on that single role

---

## ✅ Temporary Workaround Applied

I've made two quick fixes to allow PATIENT users to access clinic onboarding:

### Fix 1: Frontend Route Access

**File:** `frontend/src/App.jsx`

**Before:**
```javascript
<Route 
  path="/clinic/onboarding/*" 
  element={<ProtectedRoute requiredRole="CLINIC_OWNER">
    <ClinicOnboarding />
  </ProtectedRoute>} 
/>
```

**After:**
```javascript
{/* Allow both CLINIC_OWNER and PATIENT to access onboarding */}
<Route 
  path="/clinic/onboarding/*" 
  element={<ProtectedRoute requiredRole={["CLINIC_OWNER", "PATIENT"]}>
    <ClinicOnboarding />
  </ProtectedRoute>} 
/>
```

### Fix 2: Clinic Auth Modal Logic

**File:** `frontend/src/components/modals/ClinicAuthModal.jsx`

```javascript
if (user.role === 'PATIENT') {
  storeLogin({ user, token });
  toast.success('Account found! Please complete clinic registration.', { duration: 5000 });
  onClose();
  // Redirect PATIENT to clinic onboarding (they're trying to become clinic owner)
  navigate('/clinic/onboarding/step-1');
  return;
}
```

### What This Achieves

✅ PATIENT users can now login through clinic partner page  
✅ PATIENT users can access `/clinic/onboarding/step-1`  
✅ PATIENT users can fill out clinic registration form  
❌ Still uses single-role (user remains PATIENT only)  
❌ After clinic submission, backend doesn't add CLINIC_OWNER role yet

---

## ⚠️ Known Limitations

### 1. User Stays as PATIENT

Even after completing clinic onboarding:
- User role: **PATIENT** (unchanged)
- User cannot access `/clinic/dashboard` (requires CLINIC_OWNER role)
- User cannot manage clinic (requires CLINIC_OWNER role)

### 2. Clinic Owner Profile Not Created

When PATIENT completes clinic onboarding:
- Backend creates `clinic` record ✅
- Backend does NOT create `clinic_owner_profile` ❌
- Backend does NOT change user role ❌

### 3. Workspace Switching Not Available

User cannot switch between:
- Patient workspace
- Clinic Owner workspace

Because they only have ONE role.

---

## 🎯 Full Multi-Role Implementation (TODO)

To properly support multi-role, we need to implement the architecture from the spec:

### Step 1: Create `user_roles` Junction Table

**File:** `backend/prisma/schema.prisma`

```prisma
model UserRole {
  id         String   @id @default(uuid())
  userId     String
  role       Role     // PATIENT, DOCTOR, CLINIC_OWNER, etc.
  assignedAt DateTime @default(now())
  assignedBy String?
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  assigner   User?    @relation("AssignedRoles", fields: [assignedBy], references: [id])
  
  @@unique([userId, role])
  @@index([userId])
  @@map("user_roles")
}

model User {
  id            String     @id @default(uuid())
  mobile        String     @unique
  // Keep 'role' for backward compatibility, but use UserRole for actual roles
  role          Role       @default(PATIENT)  // Deprecated - use userRoles instead
  
  // Multi-role support
  userRoles     UserRole[] // NEW: Many-to-many relationship
  assignedRoles UserRole[] @relation("AssignedRoles") // Roles this user assigned to others
  
  // ... rest of user model
}
```

**Run migration:**
```bash
cd backend
npx prisma migrate dev --name add_user_roles_table
```

### Step 2: Update `verifyOtpHandler`

**File:** `backend/src/controllers/auth.controller.js`

```javascript
const verifyOtpHandler = async (req, res, next) => {
  // ... OTP verification code ...
  
  // Find user
  let user = await prisma.user.findUnique({
    where: { mobile: cleanNumber },
    include: { 
      userRoles: true,  // Include roles
      // ... other includes
    }
  });
  
  if (!user) {
    // Create new user with requested role
    user = await prisma.user.create({
      data: {
        mobile: cleanNumber,
        role: userRole,  // Keep for backward compatibility
        userRoles: {
          create: { role: userRole }  // NEW: Add to user_roles
        },
        // Create appropriate profile based on role
        ...(userRole === 'PATIENT' && { patientProfile: { create: {} } }),
        ...(userRole === 'CLINIC_OWNER' && { clinicOwnerProfile: { create: { profileCompleted: false } } }),
      },
      include: { userRoles: true }
    });
  } else {
    // Existing user - check if they have this role
    const hasRole = user.userRoles.some(r => r.role === userRole);
    
    if (!hasRole) {
      // Add new role to existing user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          role: userRole
        }
      });
      
      // Create profile if needed
      if (userRole === 'CLINIC_OWNER' && !user.clinicOwnerProfile) {
        await prisma.clinicOwnerProfile.create({
          data: {
            userId: user.id,
            profileCompleted: false
          }
        });
      }
      
      // If PATIENT role doesn't exist, ensure patient profile exists
      if (userRole === 'PATIENT' && !user.patientProfile) {
        await prisma.patientProfile.create({
          data: { userId: user.id }
        });
      }
      
      // Reload user with updated roles
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { userRoles: true, /* ... */ }
      });
    }
  }
  
  // Issue JWT with roles array
  const tokens = await issueAuthTokens(res, user, req);
  // ... rest
};
```

### Step 3: Update JWT Payload

**File:** `backend/src/utils/jwt.utils.js`

```javascript
const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    roles: user.userRoles?.map(r => r.role) || [user.role],  // Include all roles
    role: user.role,  // Keep for backward compatibility
  };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
};
```

### Step 4: Frontend Role Switching

**File:** `frontend/src/components/WorkspaceSwitcher.jsx` (NEW)

```javascript
const WorkspaceSwitcher = () => {
  const { user } = useAuthStore();
  const roles = user.roles || [user.role];  // Support both multi-role and single-role
  
  if (roles.length <= 1) return null;  // No need to switch
  
  return (
    <div>
      {roles.includes('PATIENT') && <button onClick={() => switchTo('PATIENT')}>Patient</button>}
      {roles.includes('CLINIC_OWNER') && <button onClick={() => switchTo('CLINIC_OWNER')}>Clinic Owner</button>}
      {roles.includes('DOCTOR') && <button onClick={() => switchTo('DOCTOR')}>Doctor</button>}
      {/* ... */}
    </div>
  );
};
```

---

## 🧪 Testing Current Workaround

### Test: PATIENT Can Access Clinic Onboarding

1. **Login as PATIENT through clinic partner page:**
   ```
   URL: http://localhost:3000/clinic-partner
   Mobile: 9999999999
   OTP: 123456
   ```

2. **Expected Result:**
   - ✅ Toast: "Account found! Please complete clinic registration."
   - ✅ Redirected to: `/clinic/onboarding/step-1`
   - ✅ Can see clinic registration form
   - ✅ Can fill out clinic details

3. **After Submitting Clinic Form:**
   - ⚠️ Clinic created in database
   - ⚠️ User still has PATIENT role only
   - ⚠️ Cannot access `/clinic/dashboard` yet

### Test: New User Registers as CLINIC_OWNER

1. **Register new number through clinic partner page:**
   ```
   Mobile: 8888888888  (test number)
   OTP: 123456
   Name: New Clinic Owner
   ```

2. **Expected Result:**
   - ✅ New user created with CLINIC_OWNER role
   - ✅ clinic_owner_profile created
   - ✅ Redirected to clinic onboarding
   - ✅ Can complete clinic registration
   - ✅ Can access clinic dashboard after

---

## 📊 Current vs Target Architecture

### Current (Single Role)
```
User
├── mobile: "9999999999"
├── role: "PATIENT" (enum, single value)
└── patientProfile: { ... }
```

### Target (Multi Role)
```
User
├── mobile: "9999999999"
├── role: "PATIENT" (deprecated, kept for backward compatibility)
├── userRoles: [
│   { role: "PATIENT", assignedAt: "2026-08-10" },
│   { role: "CLINIC_OWNER", assignedAt: "2026-08-12" }  ← NEW
│ ]
└── Profiles:
    ├── patientProfile: { ... }
    └── clinicOwnerProfile: { ... }  ← NEW
```

---

## 🚀 Next Steps

### Immediate (Test Workaround)

1. **Test PATIENT accessing clinic onboarding:**
   - Mobile: 9999999999, OTP: 123456
   - Should reach `/clinic/onboarding/step-1` now ✅

2. **Fill out clinic registration form**

3. **Report what happens after submission:**
   - Does it create a clinic?
   - What error/success message?
   - Where does it redirect?

### Short-term (Implement Multi-Role)

1. **Create `user_roles` table** (Prisma migration)
2. **Update `verifyOtpHandler`** (add role to existing user)
3. **Update JWT generation** (include roles array)
4. **Update frontend** (handle multi-role, workspace switching)
5. **Test multi-role scenarios**

### Long-term (Remove Password Auth)

1. Remove password login routes
2. Migrate existing users to OTP-only
3. Update all auth flows to use OTP

---

## 💡 Key Points

1. **Workaround is temporary** - User still has single role (PATIENT)
2. **Proper solution requires database changes** - Create `user_roles` table
3. **Backend needs role assignment logic** - Add role when user signs up as clinic owner
4. **Frontend needs workspace switching** - Allow users to switch between roles

---

## ❓ Questions to Answer

After testing the workaround:

1. Does PATIENT user (9999999999) now reach clinic onboarding? ✅ / ❌
2. Can they fill out the clinic form? ✅ / ❌
3. What happens when they submit the clinic form? (error/success?)
4. Should we implement full multi-role now, or is workaround sufficient for testing?

---

**Status:** ⚠️ Workaround applied. Test now with mobile 9999999999 and let me know the results!
