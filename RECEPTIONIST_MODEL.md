# Receptionist Model Documentation

## Overview
The Receptionist role in PulseMate Connect allows clinic owners to add staff members who can manage appointments, check-in patients, and handle the clinic's queue system.

---

## Database Schema

### User Table (for Receptionist)
```prisma
model User {
  id              String   @id @default(uuid())
  mobile          String   @unique
  name            String
  email           String?  @unique
  role            Role     @default(PATIENT)
  primaryRole     Role?
  roles           Role[]   @default([PATIENT])
  passwordHash    String?
  approvalStatus  ApprovalStatus @default(PENDING)
  isActive        Boolean  @default(true)
  isPhoneVerified Boolean  @default(false)
  
  // Receptionist relationship
  receptionistProfile ReceptionistProfile?
  clinicStaff        ClinicStaff[]
}
```

### ReceptionistProfile Table
```prisma
model ReceptionistProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  // Profile fields
  fullName    String?
  designation String?  // e.g., "Senior Receptionist", "Front Desk Manager"
  
  // Work details
  joiningDate DateTime @default(now())
  isActive    Boolean  @default(true)
  
  // Permissions (optional - can be added later)
  canCheckIn       Boolean @default(true)
  canManageQueue   Boolean @default(true)
  canViewReports   Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ClinicStaff Table (Links Receptionist to Clinic)
```prisma
model ClinicStaff {
  id        String   @id @default(uuid())
  clinicId  String
  userId    String
  role      StaffRole // RECEPTIONIST, DOCTOR, etc.
  isActive  Boolean  @default(true)
  joinedAt  DateTime @default(now())
  
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([clinicId, userId])
}

enum StaffRole {
  RECEPTIONIST
  DOCTOR
  NURSE
  ADMIN
}
```

---

## How It Works

### 1. Adding a Receptionist (Clinic Owner Workflow)

**Frontend Flow:**
```
Clinic Owner Dashboard
  → Manage Receptionists
    → Click "+ Add Receptionist"
      → Fill Form:
         - Name: Required
         - Mobile: Required (unique, +91 format)
         - Email: Optional
         - Password: Required (min 6 chars)
      → Submit
        → API: POST /api/clinics/:clinicId/staff
```

**Backend Flow:**
```javascript
// File: backend/src/controllers/clinic.controller.js

const addStaff = async (req, res, next) => {
  const { clinicId } = req.params;
  const { mobile, name, email, role, password } = req.body;
  
  // 1. Validate clinic ownership
  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, ownerId: req.user.id }
  });
  
  // 2. Check if user already exists
  let user = await prisma.user.findUnique({ 
    where: { mobile } 
  });
  
  if (!user) {
    // 3. Create new user account
    user = await prisma.user.create({
      data: {
        mobile,
        name,
        email,
        role: 'RECEPTIONIST',
        primaryRole: 'RECEPTIONIST',
        roles: ['PATIENT', 'RECEPTIONIST'],
        passwordHash: await hashPassword(password),
        approvalStatus: 'VERIFIED',
        isPhoneVerified: true,
        isActive: true,
      }
    });
    
    // 4. Create receptionist profile
    await prisma.receptionistProfile.create({
      data: {
        userId: user.id,
        fullName: name,
        isActive: true,
      }
    });
  }
  
  // 5. Link receptionist to clinic
  await prisma.clinicStaff.create({
    data: {
      clinicId,
      userId: user.id,
      role: 'RECEPTIONIST',
      isActive: true,
    }
  });
  
  return sendSuccess(res, user, 'Receptionist added successfully');
};
```

---

## API Endpoints

### 1. Add Receptionist
```http
POST /api/clinics/:clinicId/staff
Authorization: Bearer {token}
Content-Type: application/json

{
  "mobile": "+919876543210",
  "name": "Sanjana",
  "email": "sanjana@example.com",
  "role": "RECEPTIONIST",
  "password": "secure123"
}

Response 200:
{
  "success": true,
  "message": "Receptionist added successfully",
  "data": {
    "id": "uuid",
    "name": "Sanjana",
    "mobile": "+919876543210",
    "role": "RECEPTIONIST"
  }
}
```

### 2. Get All Staff (includes Receptionists)
```http
GET /api/clinics/:clinicId/staff
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "staff-uuid",
        "role": "RECEPTIONIST",
        "isActive": true,
        "user": {
          "id": "user-uuid",
          "name": "Sanjana",
          "mobile": "+919876543210",
          "email": "sanjana@example.com"
        },
        "joinedAt": "2026-09-11T10:00:00Z"
      }
    ]
  }
}
```

### 3. Update Receptionist Status
```http
PATCH /api/clinics/:clinicId/staff/:staffId/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "isActive": false
}

Response 200:
{
  "success": true,
  "message": "Staff status updated"
}
```

### 4. Remove Receptionist
```http
DELETE /api/clinics/:clinicId/staff/:staffId
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Staff removed successfully"
}
```

---

## Frontend Components

### 1. ManageStaff Component
**Location:** `frontend/src/pages/owner/ManageStaff.jsx`

**Usage:**
```jsx
// In App.jsx routes:
<Route 
  path="/clinic/receptionists" 
  element={
    <ProtectedRoute requiredRole="CLINIC_OWNER">
      <ManageStaff staffRole="RECEPTIONIST" />
    </ProtectedRoute>
  } 
/>

// Component handles both DOCTOR and RECEPTIONIST roles
// Prop: staffRole="RECEPTIONIST" or staffRole="DOCTOR"
```

**Key Features:**
- List all receptionists for a clinic
- Add new receptionist (modal form)
- Activate/Deactivate receptionist
- Shows status badges (Active/Inactive)
- Mobile-first responsive design

### 2. Add Receptionist Form
```jsx
// Modal form fields:
<Form onSubmit={handleAddStaff}>
  <Input 
    label="Full Name"
    name="name"
    required
    placeholder="Enter full name"
  />
  
  <Input 
    label="Mobile Number"
    name="mobile"
    required
    placeholder="+91 9876543210"
    pattern="^\+91[0-9]{10}$"
  />
  
  <Input 
    label="Email (Optional)"
    name="email"
    type="email"
    placeholder="receptionist@example.com"
  />
  
  <Input 
    label="Password"
    name="password"
    type="password"
    required
    minLength={6}
    placeholder="Minimum 6 characters"
  />
  
  <Button type="submit">
    Add Receptionist
  </Button>
</Form>
```

---

## Receptionist Dashboard & Permissions

### Default Permissions
When a receptionist logs in, they have access to:

1. **Dashboard** → `/receptionist/dashboard`
   - Today's appointment summary
   - Current queue status
   - Quick actions

2. **Queue Management** → `/receptionist/queue`
   - View live queue
   - Check-in patients
   - Mark patients as "In Consultation"
   - Mark patients as "Completed"

3. **Appointments** → `/receptionist/appointments`
   - View today's appointments
   - View upcoming appointments
   - Check appointment details
   - Check-in patients from appointments

4. **Check-In** → `/receptionist/checkin`
   - Search patients by mobile/name
   - Add walk-in patients
   - Check-in for appointments
   - Add to queue

### Restricted Access
Receptionists CANNOT access:
- ❌ Financial reports/revenue
- ❌ Doctor schedules (edit)
- ❌ Clinic settings
- ❌ Staff management
- ❌ Patient medical records (full access)

---

## Security & Validation

### 1. Mobile Number Validation
```javascript
// Format: +91 followed by 10 digits
const mobileRegex = /^\+91[0-9]{10}$/;

// Normalization function
function normalizeMobileNumber(mobile) {
  // Remove spaces, dashes, parentheses
  let cleaned = mobile.replace(/[\s\-\(\)]/g, '');
  
  // Add +91 if not present
  if (!cleaned.startsWith('+91')) {
    if (cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    }
  }
  
  return cleaned;
}
```

### 2. Password Requirements
- Minimum 6 characters
- Hashed using bcrypt (salt rounds: 10)
- Stored in `passwordHash` field
- Never exposed in API responses

### 3. Role-Based Access Control
```javascript
// Middleware: requireRole
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.primaryRole || req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    next();
  };
}

// Usage in routes:
router.post(
  '/clinics/:clinicId/staff',
  authenticate,
  requireRole(['CLINIC_OWNER']),
  addStaff
);
```

---

## Common Workflows

### Workflow 1: Adding First Receptionist
```
1. Clinic owner logs in
2. Navigate to "Receptionists" in sidebar
3. Click "+ Add Receptionist"
4. Fill form:
   - Name: "Sanjana"
   - Mobile: "+918762697831"
   - Password: "secure123"
5. Submit → Success
6. Receptionist can immediately login with mobile + password
```

### Workflow 2: Receptionist Login
```
1. Go to login page
2. Select "Staff Login" or enter mobile
3. Enter mobile: +918762697831
4. Enter password: secure123
5. System detects role: RECEPTIONIST
6. Redirect to: /receptionist/dashboard
```

### Workflow 3: Deactivating Receptionist
```
1. Clinic owner → Receptionists page
2. Find receptionist in list
3. Click "Deactivate" button
4. Confirm action
5. Status changes to "Inactive"
6. Receptionist can no longer login
7. Can reactivate later if needed
```

---

## Database Queries

### Get All Receptionists for a Clinic
```javascript
const receptionists = await prisma.clinicStaff.findMany({
  where: {
    clinicId: 'clinic-uuid',
    role: 'RECEPTIONIST',
    isActive: true,
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        isActive: true,
      }
    }
  },
  orderBy: { joinedAt: 'desc' }
});
```

### Check if Mobile Number is Already Receptionist
```javascript
const existingStaff = await prisma.clinicStaff.findFirst({
  where: {
    clinicId: 'clinic-uuid',
    user: {
      mobile: '+919876543210'
    }
  },
  include: {
    user: true
  }
});

if (existingStaff) {
  throw new Error('This person is already a staff member');
}
```

---

## Current Status in Your System

### Spine Clinic Receptionists:
1. **Arjun Upadhyay** (+919901958622) - INACTIVE
2. **Sanjana** (+918762697831) - ACTIVE ✅

### Pain Clinic Receptionists:
- None currently

---

## Best Practices

### 1. Password Management
- Use strong passwords (min 8 chars recommended)
- Inform receptionist of their initial password securely
- Implement "Change Password" feature for first login
- Enable password reset via OTP

### 2. Audit Trail
```javascript
// Log staff actions
await prisma.auditLog.create({
  data: {
    userId: req.user.id,
    action: 'RECEPTIONIST_ADDED',
    entityType: 'ClinicStaff',
    entityId: staffId,
    metadata: {
      clinicId,
      receptionistName,
      receptionistMobile,
    }
  }
});
```

### 3. Multi-Clinic Support
If a receptionist works at multiple clinics:
```javascript
// Create separate ClinicStaff entries for each clinic
await prisma.clinicStaff.createMany({
  data: [
    { clinicId: 'clinic-1', userId: user.id, role: 'RECEPTIONIST' },
    { clinicId: 'clinic-2', userId: user.id, role: 'RECEPTIONIST' },
  ]
});
```

---

## Troubleshooting

### Issue 1: "Mobile number already exists"
**Cause:** User account already exists with that mobile number  
**Solution:** Check if they're already a patient, then upgrade their role instead of creating new account

### Issue 2: Receptionist can't login
**Possible causes:**
- Account is inactive (`isActive: false`)
- Staff entry is inactive (`ClinicStaff.isActive: false`)
- Wrong password
- Mobile number format mismatch

**Debug:**
```sql
SELECT 
  u.mobile, u.isActive as user_active, 
  cs.isActive as staff_active, cs.role
FROM "User" u
JOIN "ClinicStaff" cs ON cs."userId" = u.id
WHERE u.mobile = '+919876543210';
```

### Issue 3: Receptionist doesn't see any patients/queue
**Cause:** Clinic context not set  
**Solution:** Ensure receptionist is linked to correct clinic via ClinicStaff table

---

## Future Enhancements

### 1. Shift Management
```prisma
model ReceptionistShift {
  id             String   @id @default(uuid())
  staffId        String
  clinicId       String
  shiftStart     DateTime
  shiftEnd       DateTime
  dayOfWeek      DayOfWeek
  isRecurring    Boolean  @default(false)
}
```

### 2. Performance Tracking
```prisma
model StaffPerformance {
  id                  String   @id @default(uuid())
  staffId             String
  date                DateTime
  patientsCheckedIn   Int      @default(0)
  appointmentsBooked  Int      @default(0)
  avgCheckInTime      Int      // seconds
}
```

### 3. Granular Permissions
```prisma
model StaffPermission {
  id        String  @id @default(uuid())
  staffId   String
  permission Permission
  
  enum Permission {
    VIEW_APPOINTMENTS
    CHECKIN_PATIENTS
    MANAGE_QUEUE
    VIEW_REPORTS
    BOOK_APPOINTMENTS
    CANCEL_APPOINTMENTS
  }
}
```

---

## Summary

The Receptionist model provides a simple but effective way for clinic owners to add front-desk staff who can manage day-to-day operations without accessing sensitive clinic data or settings. The current implementation supports:

✅ Easy addition of receptionists by clinic owner  
✅ Secure login with mobile + password  
✅ Queue management & patient check-in  
✅ Appointment viewing  
✅ Activate/deactivate staff members  
✅ Multi-clinic support (one receptionist, multiple clinics)  
✅ Role-based access control  

**Current Active Receptionist:** Sanjana (+918762697831) at Spine Clinic
