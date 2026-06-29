# 🏥 Clinic Model - Complete Explanation

## 📋 Clinic Model Structure

The `Clinic` model is the central entity for managing healthcare facilities in PulseMate Connect.

### 🔑 Basic Information

```prisma
model Clinic {
  id                String   @id @default(uuid())
  name              String                          // Clinic name
  ownerId           String                          // User who owns this clinic
  phone             String?                         // Clinic phone number
  address           String?                         // Street address
  city              String?
  state             String?
  district          String?
  pincode           String?
  landmark          String?
  latitude          Float?                          // GPS coordinates
  longitude         Float?
  googleMapsLocation String?                        // Maps URL
```

### 📄 Verification & Status

```prisma
  isVerified        Boolean    @default(false)     // Admin verification
  approvalStatus    ApprovalStatus @default(PENDING) // PENDING | APPROVED | REJECTED | CHANGES_REQUESTED
  rejectionReason   String?                         // Why rejected
  isActive          Boolean    @default(true)       // Can be deactivated
  verifiedById      String?                         // Admin who verified
  submittedAt       DateTime?                       // When submitted for review
  verifiedAt        DateTime?                       // When approved
  rejectedById      String?
  rejectedAt        DateTime?
  suspendedReason   String?
  changesRequestedReason String?
  lastResubmittedAt DateTime?
  adminNotes        String?
```

### ⏰ Operating Hours

```prisma
  openingTime       String?                         // e.g., "09:00"
  closingTime       String?                         // e.g., "18:00"
  openingHours      String?                         // Human-readable
  weeklySchedule    Json?                           // Full week schedule
```

### 🩺 Medical Information

```prisma
  description       String?                         // About the clinic
  clinicType        String?                         // Hospital, Clinic, Lab, etc.
  clinicTypeOther   String?
  specialties       String[]                        // ["Cardiology", "Pediatrics"]
  specialtyOther    String?
  doctorCount       Int?                            // Number of doctors
  facilities        String[]                        // ["X-Ray", "ECG", "Lab"]
  languagesSpoken   String[]                        // ["English", "Hindi", "Telugu"]
```

### 💼 Appointment Settings

```prisma
  avgConsultationMinutes   Int?                    // How long per patient
  appointmentSlotMinutes   Int?                    // Slot duration
  dailyPatientCapacity     Int?                    // Max patients per day
  consultationModes        String[]                // ["OFFLINE", "ONLINE"]
```

### 💰 Payment & Legal

```prisma
  paymentMethods          String[]                 // ["Cash", "UPI", "Card"]
  insuranceSupported      String[]                 // Insurance providers
  clinicRegistrationNumber String?
  gstNumber               String?
  panNumber               String?
```

### 📎 Documents

```prisma
  clinicLicenseDocument              String?       // License file path
  licenseDocumentUrl                 String?       // License URL
  clinicLogoUrl                      String?
  clinicCoverImageUrl                String?
  medicalEstablishmentCertificateUrl String?
  gstCertificateUrl                  String?
  panCardUrl                         String?
  additionalDocuments                Json?
```

### 📧 Contact Verification

```prisma
  emergencyContactNumber  String?
  alternateEmail          String?
  ownerMobileVerified     Boolean   @default(false)
  ownerEmailVerified      Boolean   @default(false)
  mobileOtpVerifiedAt     DateTime?
  emailVerifiedAt         DateTime?
```

### 🔗 Relations (What Connects to Clinic)

```prisma
  // Relations to other tables
  appointments          Appointment[]            // All appointments at this clinic
  doctorAvailabilities  DoctorAvailability[]     // Doctor schedules
  doctorClinics         DoctorClinic[]           // Doctors working here
  staff                 ClinicStaff[]            // Receptionists, nurses
  verificationLogs      ClinicVerificationLog[]  // Approval history
  queues                Queue[]                  // Patient queues
  receptionistProfiles  ReceptionistProfile[]    // Receptionists
  sessions              ClinicSession[]          // Morning, Evening sessions
  
  // Belongs to
  owner        User  @relation("ClinicOwner")    // Clinic owner
  verifiedBy   User? @relation("ClinicVerifiedBy") // Admin who verified
```

---

## 🔄 How It Works

### 1️⃣ **Clinic Registration Flow**

```
User registers → Creates Clinic
                  ↓
           approvalStatus: PENDING
           isVerified: false
                  ↓
           Submits documents
                  ↓
           Admin reviews
                  ↓
    ┌─────────────┴─────────────┐
    ↓                           ↓
APPROVED                    REJECTED
isVerified: true            rejectionReason set
verifiedAt: now()           User can resubmit
```

### 2️⃣ **Clinic Sessions Setup**

The **ClinicSession** model defines appointment time blocks:

```prisma
model ClinicSession {
  id          String      @id @default(uuid())
  clinicId    String                              // Which clinic
  sessionType SessionType                         // MORNING | AFTERNOON | EVENING
  name        String                              // "Morning Session"
  startTime   String                              // "08:00"
  endTime     String                              // "12:00"
  maxPatients Int         @default(30)
  enabled     Boolean     @default(true)
  sortOrder   Int         @default(0)
  
  clinic      Clinic      @relation(fields: [clinicId])
}
```

**Example:**
```javascript
// City Clinic has 3 sessions:
{
  clinicId: "abc-123",
  sessionType: "MORNING",
  name: "Morning Session",
  startTime: "08:00",
  endTime: "12:00",
  maxPatients: 30,
  enabled: true
}
{
  clinicId: "abc-123",
  sessionType: "AFTERNOON",
  name: "Afternoon Session",
  startTime: "12:00",
  endTime: "17:00",
  maxPatients: 40,
  enabled: true
}
{
  clinicId: "abc-123",
  sessionType: "EVENING",
  name: "Evening Session",
  startTime: "17:00",
  endTime: "21:00",
  maxPatients: 30,
  enabled: true
}
```

### 3️⃣ **Doctor Availability at Clinic**

**DoctorClinic** model links doctors to clinics:

```prisma
model DoctorClinic {
  id                  String   @id @default(uuid())
  doctorId            String                        // Which doctor
  clinicId            String                        // Which clinic
  startTime           String?                       // e.g., "09:00"
  endTime             String?                       // e.g., "18:00"
  availableDays       String[]                      // ["Monday", "Tuesday", ...]
  avgConsultationMins Int?                          // 15 minutes per patient
  isActive            Boolean  @default(true)
  
  doctor              DoctorProfile @relation(...)
  clinic              Clinic        @relation(...)
}
```

**DoctorAvailability** model sets specific day schedules:

```prisma
model DoctorAvailability {
  id              String   @id @default(uuid())
  doctorId        String                            // Which doctor
  clinicId        String                            // Which clinic
  dayOfWeek       Int                               // 0=Sun, 1=Mon, ..., 6=Sat
  startTime       String                            // "09:00"
  endTime         String                            // "18:00"
  slotDurationMin Int                               // 15 minutes
  maxPatients     Int                               // 30 per day
  isActive        Boolean  @default(true)
  
  doctor          DoctorProfile       @relation(...)
  clinic          Clinic              @relation(...)
  
  @@unique([doctorId, clinicId, dayOfWeek])         // One schedule per day
}
```

### 4️⃣ **Appointment Booking Flow**

```
User selects:
  ├─ Clinic (from Clinic table)
  ├─ Doctor (from DoctorClinic - doctors at this clinic)
  ├─ Date (e.g., 2026-06-28)
  └─ Session (from ClinicSession - Morning/Afternoon/Evening)

Backend generates slots:
  1. Check DoctorAvailability for this doctor+clinic+day
  2. If found: Use startTime, endTime, slotDurationMin
  3. If not found: Fall back to DoctorClinic startTime/endTime
  
  Generate slots:
    09:00, 09:15, 09:30, 09:45, ...
  
  Filter out:
    - Past slots (if today)
    - Already booked slots (from Appointment table)
  
  Return available slots to frontend
  
User selects slot → Creates Appointment
```

---

## 🐛 The "Fully Booked" Bug Explained

### What Happened

1. **Clinic has sessions configured** (ClinicSession table)
   - But timing was wrong: Morning at 4:51 PM instead of 8:00 AM

2. **Doctor has NO DoctorAvailability configured**
   - So slots API can't generate time slots

3. **DoctorClinic fallback also incomplete**
   - Missing startTime/endTime

4. **Result:**
   ```javascript
   GET /api/doctor/123/slots?clinicId=abc&date=2026-06-28
   
   Response:
   {
     slots: [],           // ← Empty!
     source: "none",      // ← No config found
     message: "No availability configured"
   }
   ```

5. **Frontend logic:**
   ```javascript
   const sessionSlots = getSessionSlots(sessionId);
   const hasSlots = sessionSlots.length > 0;  // ← 0 slots
   
   {!hasSlots && <Text>Fully Booked</Text>}   // ← Shows wrong message
   ```

### The Fix

1. **Fix ClinicSession timing**
   ```sql
   UPDATE clinic_sessions 
   SET startTime = '08:00', endTime = '12:00'
   WHERE sessionType = 'MORNING';
   ```

2. **Create DoctorAvailability records**
   ```sql
   INSERT INTO "DoctorAvailability" 
   (doctorId, clinicId, dayOfWeek, startTime, endTime, slotDurationMin, ...)
   VALUES 
   ('doc-123', 'clinic-abc', 1, '09:00', '18:00', 15, ...),  -- Monday
   ('doc-123', 'clinic-abc', 2, '09:00', '18:00', 15, ...),  -- Tuesday
   ...
   ```

3. **Ensure DoctorClinic fallback**
   ```sql
   UPDATE "DoctorClinic"
   SET 
     startTime = '09:00',
     endTime = '18:00',
     avgConsultationMins = 15
   WHERE doctorId = 'doc-123' AND clinicId = 'clinic-abc';
   ```

4. **Update frontend error message**
   ```javascript
   // Show context-aware message
   {!hasSlots && (
     <Text>
       {slotsSource === 'none' ? 'Not Configured' : 'Fully Booked'}
     </Text>
   )}
   ```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLINIC                              │
│  - Basic info (name, address, phone)                        │
│  - Operating hours (openingTime, closingTime)               │
│  - Settings (avgConsultationMinutes)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┬──────────────┐
          ↓             ↓             ↓              ↓
    ┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌─────────┐
    │Clinic   │  │DoctorClinic │  │Doctor    │  │Appoint- │
    │Session  │  │             │  │Availabil.│  │ment     │
    ├─────────┤  ├─────────────┤  ├──────────┤  ├─────────┤
    │Morning  │  │Which doctors│  │Mon 9-6   │  │Slot:    │
    │8-12 AM  │  │work here    │  │Tue 9-6   │  │9:15 AM  │
    │         │  │             │  │15min slot│  │         │
    │Afternoon│  │startTime    │  │          │  │Doctor   │
    │12-5 PM  │  │endTime      │  │Max 30/day│  │Patient  │
    │         │  │availableDays│  │          │  │Status   │
    └─────────┘  └─────────────┘  └──────────┘  └─────────┘
```

---

## 🎯 Key Takeaways

1. **Clinic** = Healthcare facility (owner, address, hours)
2. **ClinicSession** = Time blocks (Morning 8-12, Afternoon 12-5, Evening 5-9)
3. **DoctorClinic** = Which doctors work at which clinics
4. **DoctorAvailability** = Specific schedule per day (Mon 9-6, Tue 9-6, etc.)
5. **Appointment** = Booked slot for a patient

### ⚠️ Common Issues

- **No ClinicSessions** → Can't divide day into Morning/Afternoon/Evening
- **No DoctorAvailability** → Can't generate time slots
- **Wrong session timing** → Slots generated at wrong hours
- **Missing DoctorClinic fallback** → No backup schedule

### ✅ Proper Setup

```
1. Create Clinic ✓
2. Create ClinicSessions (Morning 8-12, Afternoon 12-5, Evening 5-9) ✓
3. Link Doctor to Clinic (DoctorClinic) ✓
4. Set Doctor schedule (DoctorAvailability for each day) ✓
5. Now users can book appointments! ✓
```

---

## 📁 Related Files

- **Schema:** `backend/prisma/schema.prisma` (lines 79-155)
- **Controller:** `backend/src/controllers/availability.controller.js`
- **Routes:** `backend/src/routes/clinicSession.routes.js`
- **Frontend:** `src/screens/BookingScreen.jsx`

---

**Last Updated:** June 28, 2026  
**Related Issue:** "Fully Booked" bug (now fixed ✅)
