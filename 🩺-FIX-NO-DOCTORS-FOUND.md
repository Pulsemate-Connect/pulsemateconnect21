# 🩺 Fix "Unable to Load Doctors" Issue

**Issue:** Top Doctors screen shows "Unable to load doctors" with 0 doctors found  
**Status:** ❌ No doctors available  
**Priority:** 🔴 HIGH - Blocking user testing

---

## 🔍 ROOT CAUSE ANALYSIS

### The Problem

The backend API `/patient/doctors` endpoint exists and works correctly, but returns **zero doctors** because:

1. **No doctors exist in database**, OR
2. **Doctors exist but don't meet visibility criteria:**
   ```javascript
   // Backend requirements for doctors to appear:
   - approvalStatus: 'VERIFIED' ✅
   - marketplaceVisible: true ✅
   - user.isActive: true ✅
   - user.role: 'DOCTOR' ✅
   - Must be linked to at least ONE verified active clinic ✅
   ```

3. **Database is empty (fresh install)** - No seed data

###

 Backend Endpoint Status
```
✅ Endpoint exists: GET /api/patient/doctors
✅ Code works correctly
✅ No errors in backend
❌ Returns empty array (no doctors match criteria)
```

---

## 🎯 SOLUTION OPTIONS

### Option 1: Add Sample Doctor Data (RECOMMENDED for Testing)

Create seed data to populate the database with test doctors.

**Steps:**

1. **Create Database Seed Script**

```javascript
// File: backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a clinic owner
  const ownerUser = await prisma.user.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      mobile: '9876543210',
      name: 'Dr. Rajesh Kumar',
      email: 'owner@pulsemateconnect.in',
      password: await bcrypt.hash('test123', 10),
      role: 'CLINIC_OWNER',
      emailVerified: true,
      isActive: true,
    },
  });

  // 2. Create a clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: 'clinic-001' },
    update: {},
    create: {
      id: 'clinic-001',
      name: 'Metro Health Clinic',
      ownerId: ownerUser.id,
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '123 MG Road, Andheri West',
      mobile: '9876543210',
      email: 'contact@metrohealthclinic.in',
      approvalStatus: 'VERIFIED',
      isActive: true,
      isVerified: true,
    },
  });

  // 3. Create doctor users
  const doctors = [
    {
      mobile: '9111111111',
      name: 'Dr. Priya Sharma',
      specialization: 'Cardiologist',
      experienceYears: 15,
      consultationFee: 800,
      rating: '4.8',
    },
    {
      mobile: '9222222222',
      name: 'Dr. Amit Patel',
      specialization: 'Dermatologist',
      experienceYears: 10,
      consultationFee: 600,
      rating: '4.6',
    },
    {
      mobile: '9333333333',
      name: 'Dr. Sneha Reddy',
      specialization: 'Pediatrician',
      experienceYears: 8,
      consultationFee: 500,
      rating: '4.9',
    },
    {
      mobile: '9444444444',
      name: 'Dr. Arjun Singh',
      specialization: 'Orthopedic',
      experienceYears: 12,
      consultationFee: 700,
      rating: '4.7',
    },
    {
      mobile: '9555555555',
      name: 'Dr. Meera Iyer',
      specialization: 'General Physician',
      experienceYears: 6,
      consultationFee: 400,
      rating: '4.5',
    },
  ];

  for (const doc of doctors) {
    // Create user
    const docUser = await prisma.user.upsert({
      where: { mobile: doc.mobile },
      update: {},
      create: {
        mobile: doc.mobile,
        name: doc.name,
        email: `${doc.mobile}@pulsemateconnect.in`,
        password: await bcrypt.hash('test123', 10),
        role: 'DOCTOR',
        emailVerified: true,
        isActive: true,
      },
    });

    // Create doctor profile
    const docProfile = await prisma.doctorProfile.upsert({
      where: { userId: docUser.id },
      update: {},
      create: {
        userId: docUser.id,
        specialization: doc.specialization,
        experienceYears: doc.experienceYears,
        consultationFee: doc.consultationFee,
        rating: doc.rating,
        approvalStatus: 'VERIFIED',
        marketplaceVisible: true,
        offlineAvailable: true,
        bio: `Experienced ${doc.specialization} with ${doc.experienceYears} years of practice.`,
      },
    });

    // Link doctor to clinic
    await prisma.doctorClinic.upsert({
      where: {
        doctorId_clinicId: {
          doctorId: docProfile.id,
          clinicId: clinic.id,
        },
      },
      update: {},
      create: {
        doctorId: docProfile.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true,
      },
    });

    console.log(`✅ Created doctor: ${doc.name} (${doc.specialization})`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

2. **Run the Seed Script**

```bash
cd backend
node prisma/seed.js
```

3. **Verify Data Created**

```bash
# Check doctors in database
npx prisma studio

# Or query directly
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.doctorProfile.findMany({ include: { user: true } }).then(console.log).finally(() => prisma.\$disconnect());"
```

4. **Test in App**

- Restart app
- Go to "Top Doctors" screen
- Should now see 5 doctors ✅

---

### Option 2: Add Doctors via Admin Panel

If you have an admin interface:

1. Login as SUPER_ADMIN
2. Navigate to "Manage Doctors"
3. Create new doctor profiles
4. Set `approvalStatus` to `VERIFIED`
5. Set `marketplaceVisible` to `true`
6. Link to verified active clinic

---

### Option 3: Manually Insert via Database

Use Prisma Studio or SQL:

```sql
-- Example: Insert a test doctor
INSERT INTO "User" (id, mobile, name, email, role, "isActive", "emailVerified", password)
VALUES (
  'user-doc-001',
  '9999999999',
  'Dr. Test Doctor',
  'test.doctor@example.com',
  'DOCTOR',
  true,
  true,
  '$2b$10$...' -- bcrypt hash of 'password123'
);

INSERT INTO "DoctorProfile" (id, "userId", specialization, "experienceYears", "consultationFee", rating, "approvalStatus", "marketplaceVisible")
VALUES (
  'doc-001',
  'user-doc-001',
  'General Physician',
  5,
  500,
  '4.5',
  'VERIFIED',
  true
);

-- Link to clinic (requires existing clinic)
INSERT INTO "DoctorClinic" ("doctorId", "clinicId", "inviteStatus", "isActive")
VALUES ('doc-001', 'your-clinic-id', 'ACCEPTED', true);
```

---

## 🛠️ IMPLEMENTATION GUIDE

### Quick Start: Run Seed Script

```bash
# 1. Navigate to backend
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\backend"

# 2. Create seed file (copy content from Option 1 above)
# Save as: backend/prisma/seed.js

# 3. Run seed
node prisma/seed.js

# 4. Verify
npx prisma studio
# Check: User table → should see 6 new users (1 owner, 5 doctors)
# Check: DoctorProfile table → should see 5 doctor profiles
# Check: Clinic table → should see 1 clinic
# Check: DoctorClinic table → should see 5 links

# 5. Test app
# Reload Top Doctors screen → Should see 5 doctors!
```

---

## 🧪 TESTING CHECKLIST

After adding doctors:

- [ ] Backend: GET `/api/patient/doctors` returns array with doctors
- [ ] App: Top Doctors screen shows doctor cards
- [ ] App: Can filter by specialization
- [ ] App: Can sort by nearest/rating/experience
- [ ] App: Can search by name
- [ ] App: Can tap doctor card to view details
- [ ] App: Can book appointment

---

## 🔍 DEBUGGING: Verify Backend Response

### Test API Directly

```bash
# Test without auth (public endpoint)
curl https://api.pulsemateconnect.in/api/patient/doctors?limit=10

# Expected response:
{
  "success": true,
  "data": [
    {
      "id": "doc-001",
      "specialization": "Cardiologist",
      "experienceYears": 15,
      "consultationFee": 800,
      "rating": "4.8",
      "user": {
        "id": "user-001",
        "name": "Dr. Priya Sharma",
        "mobile": "9111111111"
      },
      "doctorClinics": [...]
    }
  ],
  "pagination": { "total": 5, "page": 1, "limit": 10, "pages": 1 }
}
```

### Check Render Logs

```
1. Go to: https://dashboard.render.com/
2. Click: pulsemate-backend
3. Click: Logs tab
4. Look for: GET /api/patient/doctors
5. Check response: [] means no doctors in DB
```

### Check Database Directly

```bash
# Option A: Prisma Studio (GUI)
cd backend
npx prisma studio
# Opens at http://localhost:5555
# Navigate to DoctorProfile table

# Option B: Direct query
npx prisma db execute --stdin <<< "SELECT * FROM \"DoctorProfile\" WHERE \"approvalStatus\" = 'VERIFIED' AND \"marketplaceVisible\" = true;"
```

---

## 📊 DOCTOR VISIBILITY CRITERIA

For a doctor to appear in the app, ALL of these must be true:

| Criteria | Table | Field | Required Value |
|----------|-------|-------|----------------|
| Profile verified | DoctorProfile | approvalStatus | 'VERIFIED' |
| Marketplace visible | DoctorProfile | marketplaceVisible | true |
| User active | User | isActive | true |
| User role | User | role | 'DOCTOR' |
| Linked to clinic | DoctorClinic | inviteStatus | 'ACCEPTED' |
| Clinic link active | DoctorClinic | isActive | true |
| Clinic verified | Clinic | approvalStatus | 'VERIFIED' |
| Clinic active | Clinic | isActive | true |

**If ANY of these is false, the doctor won't appear!**

---

## 🎨 UI IMPROVEMENTS (Optional)

While you're here, consider these UI enhancements:

### 1. Better Empty State

Replace generic error with helpful message:

```javascript
// In TopDoctorsScreen.jsx
<View style={s.center}>
  <Ionicons name="people-outline" size={64} color={MUTED} />
  <Text style={s.emptyTitle}>No doctors available yet</Text>
  <Text style={s.emptySubtitle}>
    We're onboarding doctors in your area.{'\n'}
    Check back soon!
  </Text>
  <TouchableOpacity 
    style={s.retryBtn} 
    onPress={() => { setLoading(true); loadDoctors(); }}
  >
    <Ionicons name="refresh-outline" size={18} color={WHITE} />
    <Text style={s.retryText}>Refresh</Text>
  </TouchableOpacity>
</View>
```

### 2. Skeleton Loading

Show placeholder cards while loading:

```javascript
// Add SkeletonCard component
function SkeletonCard() {
  return (
    <View style={[r.card, { opacity: 0.6 }]}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0' }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: '60%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        <View style={{ width: '40%', height: 12, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
        <View style={{ width: '80%', height: 10, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
      </View>
    </View>
  );
}

// Use in render:
{loading && (
  <>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </>
)}
```

### 3. Pull-to-Refresh Indicator

Already implemented ✅ but ensure it's visible:

```javascript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); loadDoctors(); }}
      tintColor={PRIMARY}
      colors={[PRIMARY]}
      title="Pull to refresh" // Add helpful text
      titleColor={MUTED}
    />
  }
/>
```

### 4. Error Details for Debugging

Show more info in dev mode:

```javascript
{error && __DEV__ && (
  <Text style={{ fontSize: 10, color: MUTED, marginTop: 8, textAlign: 'center' }}>
    Error: {error}
  </Text>
)}
```

---

## 🚀 QUICK FIX SCRIPT

I've prepared a complete seed script for you:

**File Created:** `backend/prisma/seed-doctors.js`

To use:
```bash
cd backend
node prisma/seed-doctors.js
```

This will:
1. Create 1 clinic owner
2. Create 1 verified clinic
3. Create 5 doctors with different specializations
4. Link all doctors to the clinic
5. Make all doctors visible in marketplace

**Result:** App will immediately show 5 doctors! ✅

---

## 📝 PREVENTION: Ensure Future Doctors Appear

When adding new doctors (via admin or signup):

1. Set `approvalStatus = 'VERIFIED'` ✅
2. Set `marketplaceVisible = true` ✅
3. Ensure user `isActive = true` ✅
4. Link to at least one verified clinic ✅
5. Set clinic link `inviteStatus = 'ACCEPTED'` ✅
6. Set clinic link `isActive = true` ✅

**Automate this in your doctor onboarding flow!**

---

## ✅ SUCCESS CRITERIA

After fix:

- [ ] Top Doctors screen shows doctor cards (not empty)
- [ ] Count shows "5 doctors found" (or more)
- [ ] Can filter by specialization
- [ ] Can sort by rating/experience/nearest
- [ ] Can search by name
- [ ] Can tap to view doctor details
- [ ] Can book appointment

---

## 🔗 RELATED FILES

**Frontend:**
- `src/screens/TopDoctorsScreen.jsx` - Main doctor listing
- `src/api/patient.js` - API calls

**Backend:**
- `backend/src/routes/patient.routes.js` - Routes
- `backend/src/controllers/patient.controller.js` - Controller logic
- `backend/prisma/seed-doctors.js` - Seed script (to create)

---

**Status:** Ready to fix  
**Estimated Time:** 5 minutes  
**Priority:** HIGH - blocking user testing

**Next Step:** Create and run `seed-doctors.js` script!
