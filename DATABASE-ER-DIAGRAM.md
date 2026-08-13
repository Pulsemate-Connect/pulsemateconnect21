# PulseMate Connect - Database ER Diagram

## 🗄️ Complete Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PULSEMATE CONNECT DATABASE                            │
│                         Entity Relationship Diagram                          │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                              CORE ENTITIES
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│              USER                    │  (Central entity - all users)
├─────────────────────────────────────┤
│ PK  id: String (cuid)               │
│ UQ  email: String?                  │
│ UQ  mobile: String?                 │
│     name: String?                   │
│     passwordHash: String?           │
│     role: UserRole                  │  ◄─── ENUM: PATIENT, DOCTOR, 
│     approvalStatus: ApprovalStatus  │              CLINIC_OWNER, RECEPTIONIST,
│     isEmailVerified: Boolean        │              SUPER_ADMIN
│     isPhoneVerified: Boolean        │
│     authProvider: String?           │
│     firebaseUid: String?            │
│     clinicOnboardingData: Json?     │  ◄─── Stores onboarding data (JSON)
│     rejectionReason: String?        │
│     suspendedReason: String?        │
│     isActive: Boolean               │
│     lastLoginAt: DateTime?          │
│     createdAt: DateTime             │
│     updatedAt: DateTime             │
└─────────────────────────────────────┘
         │ 1
         │
         ├──────────────────────────────────┐
         │                                  │
         │ 1:1                              │ 1:1
         ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐
│   PatientProfile     │         │   DoctorProfile      │
├──────────────────────┤         ├──────────────────────┤
│ PK  id: String       │         │ PK  id: String       │
│ FK  userId: String   │         │ FK  userId: String   │
│     dateOfBirth: Date│         │     specialization   │
│     gender: Gender   │         │     qualification    │
│     bloodGroup       │         │     experience       │
│     medicalHistory   │         │     registrationNum  │
│     allergies        │         │     consultationFee  │
│     emergencyContact │         │     bio              │
└──────────────────────┘         └──────────────────────┘

         │ 1:1                              │ 1:1
         ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐
│ ClinicOwnerProfile   │         │ ReceptionistProfile  │
├──────────────────────┤         ├──────────────────────┤
│ PK  id: String       │         │ PK  id: String       │
│ FK  userId: String   │         │ FK  userId: String   │
│     businessName     │         │ FK  assignedClinicId │
│     businessAddress  │         │     shift            │
│     gstNumber        │         │     permissions      │
└──────────────────────┘         └──────────────────────┘

         │ 1:1
         ▼
┌──────────────────────┐
│    AdminProfile      │
├──────────────────────┤
│ PK  id: String       │
│ FK  userId: String   │
│     level: AdminLevel│  ◄─── ENUM: ROOT, SENIOR, JUNIOR
│     department       │
│     permissions      │
└──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          CLINIC & APPOINTMENTS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│             CLINIC                   │
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  ownerId: String                 │  ◄─── Links to User (CLINIC_OWNER)
│     name: String                    │
│     displayName: String             │
│     type: ClinicType                │
│     phone: String                   │
│     email: String                   │
│     address: String                 │
│     city: String                    │
│     state: String                   │
│     pincode: String                 │
│     latitude: Float                 │
│     longitude: Float                │
│     specialties: String[]           │
│     consultationTypes: String[]     │
│     openingTime: String             │
│     closingTime: String             │
│     weeklyOffDays: String[]         │
│     clinicRegistrationNumber        │
│     medicalLicense                  │
│     gstNumber                       │
│     logoUrl: String                 │
│     photos: String[]                │
│     averageRating: Float            │
│     totalReviews: Int               │
│     isActive: Boolean               │
│     approvalStatus: ApprovalStatus  │
│     createdAt: DateTime             │
│     updatedAt: DateTime             │
└─────────────────────────────────────┘
         │ 1
         │
         ├────────────┬────────────┬────────────┐
         │            │            │            │
         │ 1:N        │ 1:N        │ 1:N        │ 1:N
         ▼            ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ ClinicStaff  │ │AppSession│ │ Queue    │ │ Review   │
├──────────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│ PK  id       │ │ PK  id   │ │ PK  id   │ │ PK  id   │
│ FK  clinicId │ │ FK clinic│ │ FK clinic│ │ FK clinic│
│ FK  userId   │ │ FK doctor│ │     date │ │ FK patient│
│     role     │ │     date │ │     status│ │     rating│
│     isActive │ │     start│ │     count│ │     comment│
└──────────────┘ │     end  │ └──────────┘ └──────────┘
                 │     status│
                 └──────────┘
                      │ 1
                      │ 1:N
                      ▼
              ┌──────────────────┐
              │   APPOINTMENT    │
              ├──────────────────┤
              │ PK  id: String   │
              │ FK  clinicId     │
              │ FK  doctorId     │
              │ FK  patientId    │
              │ FK  sessionId    │
              │     date: Date   │
              │     timeSlot     │
              │     type: Type   │  ◄─── ENUM: IN_PERSON, VIDEO, PHONE
              │     status       │  ◄─── ENUM: PENDING, CONFIRMED, 
              │     symptoms     │              COMPLETED, CANCELLED
              │     diagnosis    │
              │     prescription │
              │     notes        │
              │     fee: Float   │
              │     paymentStatus│
              │     queueNumber  │
              │     tokenNumber  │
              │     checkInTime  │
              │     checkOutTime │
              │     createdAt    │
              │     updatedAt    │
              └──────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                        AUTHENTICATION & SECURITY
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│        RefreshToken                  │  (JWT refresh tokens)
├─────────────────────────────────────┤
│ PK  id: String                      │
│ UQ  token: String                   │
│ FK  userId: String                  │  ◄─── Links to User
│     sessionId: String               │
│     expiresAt: DateTime             │
│     revokedAt: DateTime?            │
│     ipAddress: String?              │
│     deviceInfo: String?             │
│     createdAt: DateTime             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     EmailVerification                │  (Email OTP storage)
├─────────────────────────────────────┤
│ PK  id: String                      │
│     email: String                   │
│     otp: String                     │
│     expiresAt: DateTime             │
│     verified: Boolean               │
│     createdAt: DateTime             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  FirebasePhoneVerification           │  (Firebase phone verification)
├─────────────────────────────────────┤
│ PK  id: String                      │
│     mobile: String                  │
│     firebaseUid: String             │
│     purpose: String                 │  ◄─── e.g., "CLINIC_OWNER_REGISTER"
│     expiresAt: DateTime             │
│     verified: Boolean               │
│     createdAt: DateTime             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     PasswordResetToken               │  (Password reset tokens)
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  userId: String                  │
│     token: String                   │
│     expiresAt: DateTime             │
│     used: Boolean                   │
│     usedAt: DateTime?               │
│     createdAt: DateTime             │
└─────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          PAYMENTS & TRANSACTIONS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│          Payment                     │
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  appointmentId: String           │
│ FK  patientId: String               │
│ FK  clinicId: String                │
│     amount: Float                   │
│     currency: String                │
│     method: PaymentMethod           │  ◄─── ENUM: CASH, CARD, UPI, 
│     status: PaymentStatus           │              RAZORPAY, WALLET
│     razorpayOrderId: String?        │
│     razorpayPaymentId: String?      │
│     razorpaySignature: String?      │
│     transactionId: String?          │
│     failureReason: String?          │
│     paidAt: DateTime?               │
│     refundedAt: DateTime?           │
│     createdAt: DateTime             │
│     updatedAt: DateTime             │
└─────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                        NOTIFICATIONS & MESSAGING
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│        Notification                  │
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  userId: String                  │  ◄─── Recipient
│     type: NotificationType          │
│     title: String                   │
│     message: String                 │
│     data: Json?                     │
│     isRead: Boolean                 │
│     readAt: DateTime?               │
│     createdAt: DateTime             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    NotificationSettings              │
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  userId: String                  │
│     emailNotifications: Boolean     │
│     smsNotifications: Boolean       │
│     pushNotifications: Boolean      │
│     appointmentReminders: Boolean   │
│     marketingEmails: Boolean        │
│     updatedAt: DateTime             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        DeviceToken                   │  (For push notifications)
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  userId: String                  │
│     token: String                   │
│     platform: String                │  ◄─── "android", "ios", "web"
│     isActive: Boolean               │
│     lastUsedAt: DateTime            │
│     createdAt: DateTime             │
└─────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          AUDIT & LOGGING
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│         AuditLog                     │  (Track all important actions)
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  userId: String?                 │
│     action: String                  │  ◄─── e.g., "USER_LOGIN", 
│     entityType: String              │              "APPOINTMENT_CREATED"
│     entityId: String?               │
│     changes: Json?                  │
│     ipAddress: String?              │
│     userAgent: String?              │
│     createdAt: DateTime             │
└─────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          MEDICAL RECORDS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│      MedicalRecord                   │
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  patientId: String               │
│ FK  appointmentId: String?          │
│ FK  doctorId: String                │
│ FK  clinicId: String                │
│     recordType: String              │
│     diagnosis: String               │
│     prescription: Json              │
│     labReports: String[]            │
│     notes: String                   │
│     attachments: String[]           │
│     createdAt: DateTime             │
│     updatedAt: DateTime             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       Prescription                   │
├─────────────────────────────────────┤
│ PK  id: String                      │
│ FK  appointmentId: String           │
│ FK  patientId: String               │
│ FK  doctorId: String                │
│     medicines: Json[]               │  ◄─── Array of medicine objects
│     instructions: String            │
│     validUntil: DateTime            │
│     createdAt: DateTime             │
└─────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                             RELATIONSHIPS SUMMARY
═══════════════════════════════════════════════════════════════════════════════

USER (1) ──────────── (1) PatientProfile
USER (1) ──────────── (1) DoctorProfile
USER (1) ──────────── (1) ClinicOwnerProfile
USER (1) ──────────── (1) ReceptionistProfile
USER (1) ──────────── (1) AdminProfile
USER (1) ──────────── (N) RefreshToken
USER (1) ──────────── (N) Notification
USER (1) ──────────── (N) AuditLog
USER (1) ──────────── (N) DeviceToken

USER (CLINIC_OWNER) (1) ──── (N) Clinic (ownedClinics)
Clinic (1) ──────────────── (N) ClinicStaff
Clinic (1) ──────────────── (N) Appointment
Clinic (1) ──────────────── (N) AppointmentSession
Clinic (1) ──────────────── (N) Queue
Clinic (1) ──────────────── (N) Review

Appointment (N) ────────── (1) Clinic
Appointment (N) ────────── (1) Doctor (User)
Appointment (N) ────────── (1) Patient (User)
Appointment (1) ────────── (1) Payment
Appointment (1) ────────── (N) MedicalRecord
Appointment (1) ────────── (N) Prescription

AppointmentSession (1) ──── (N) Appointment
AppointmentSession (N) ──── (1) Clinic
AppointmentSession (N) ──── (1) Doctor (User)

```

---

## 📊 Detailed Table Schemas

### User Table (Complete)
```prisma
model User {
  id                   String           @id @default(cuid())
  
  // Unique Identifiers
  email                String?          @unique
  mobile               String?          @unique
  
  // Basic Info
  name                 String?
  passwordHash         String?
  
  // Role & Status
  role                 UserRole         @default(PATIENT)
  approvalStatus       ApprovalStatus   @default(PENDING)
  isActive             Boolean          @default(true)
  
  // Verification
  isEmailVerified      Boolean          @default(false)
  isPhoneVerified      Boolean          @default(false)
  
  // Auth Provider
  authProvider         String?          // "EMAIL_OTP", "MOBILE_OTP", "FIREBASE_PHONE"
  firebaseUid          String?
  
  // Clinic Onboarding (JSON field)
  clinicOnboardingData Json?
  
  // Rejection/Suspension
  rejectionReason      String?
  suspendedReason      String?
  
  // Timestamps
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
  lastLoginAt          DateTime?
  
  // Relations - Profiles
  patientProfile       PatientProfile?
  doctorProfile        DoctorProfile?
  clinicOwnerProfile   ClinicOwnerProfile?
  receptionistProfile  ReceptionistProfile?
  adminProfile         AdminProfile?
  
  // Relations - Clinic Management
  ownedClinics         Clinic[]         @relation("ClinicOwner")
  clinicStaff          ClinicStaff[]
  
  // Relations - Appointments
  patientAppointments  Appointment[]    @relation("PatientAppointments")
  doctorAppointments   Appointment[]    @relation("DoctorAppointments")
  appointmentSessions  AppointmentSession[]
  
  // Relations - Auth & Security
  refreshTokens        RefreshToken[]
  passwordResetTokens  PasswordResetToken[]
  deviceTokens         DeviceToken[]
  
  // Relations - Activity
  notifications        Notification[]
  auditLogs            AuditLog[]
  reviews              Review[]
  
  // Relations - Medical
  medicalRecords       MedicalRecord[]
  prescriptions        Prescription[]
  
  @@index([email])
  @@index([mobile])
  @@index([role])
  @@index([approvalStatus])
}

// Enums
enum UserRole {
  PATIENT
  DOCTOR
  CLINIC_OWNER
  RECEPTIONIST
  SUPER_ADMIN
}

enum ApprovalStatus {
  PENDING
  VERIFIED
  APPROVED
  REJECTED
  SUSPENDED
}
```

### Clinic Table (Complete)
```prisma
model Clinic {
  id                          String           @id @default(cuid())
  
  // Owner
  ownerId                     String
  owner                       User             @relation("ClinicOwner", fields: [ownerId], references: [id])
  
  // Basic Info
  name                        String
  displayName                 String?
  type                        ClinicType       @default(GENERAL)
  phone                       String
  email                       String?
  website                     String?
  
  // Address
  address                     String
  locality                    String?
  landmark                    String?
  city                        String
  state                       String
  pincode                     String
  country                     String           @default("India")
  latitude                    Float?
  longitude                   Float?
  
  // Services
  specialties                 String[]
  consultationTypes           String[]
  facilities                  String[]
  languagesSpoken             String[]
  
  // Operating Hours
  openingTime                 String?
  closingTime                 String?
  weeklyOffDays               String[]
  isOpen24x7                  Boolean          @default(false)
  
  // Registration & Compliance
  clinicRegistrationNumber    String?
  clinicRegistrationCertUrl   String?
  medicalLicense              String?
  medicalLicenseUrl           String?
  gstNumber                   String?
  gstCertificateUrl           String?
  panNumber                   String?
  
  // Media
  logoUrl                     String?
  coverImageUrl               String?
  photos                      String[]
  
  // Ratings
  averageRating               Float            @default(0)
  totalReviews                Int              @default(0)
  
  // Capacity
  dailyPatientCapacity        Int?
  averageConsultationTime     Int?
  appointmentSlotMinutes      Int?
  
  // Status
  isActive                    Boolean          @default(true)
  approvalStatus              ApprovalStatus   @default(PENDING)
  rejectionReason             String?
  
  // Timestamps
  createdAt                   DateTime         @default(now())
  updatedAt                   DateTime         @updatedAt
  
  // Relations
  staff                       ClinicStaff[]
  appointments                Appointment[]
  appointmentSessions         AppointmentSession[]
  queues                      Queue[]
  reviews                     Review[]
  medicalRecords              MedicalRecord[]
  payments                    Payment[]
  
  @@index([ownerId])
  @@index([city])
  @@index([approvalStatus])
  @@index([isActive])
}

enum ClinicType {
  GENERAL
  MULTI_SPECIALTY
  DENTAL
  EYE_CARE
  SKIN_CARE
  DIAGNOSTIC
  VETERINARY
  OTHER
}
```

### Appointment Table (Complete)
```prisma
model Appointment {
  id                String              @id @default(cuid())
  
  // Relations
  clinicId          String
  clinic            Clinic              @relation(fields: [clinicId], references: [id])
  
  doctorId          String
  doctor            User                @relation("DoctorAppointments", fields: [doctorId], references: [id])
  
  patientId         String
  patient           User                @relation("PatientAppointments", fields: [patientId], references: [id])
  
  sessionId         String?
  session           AppointmentSession? @relation(fields: [sessionId], references: [id])
  
  // Appointment Details
  date              DateTime
  timeSlot          String
  type              AppointmentType     @default(IN_PERSON)
  status            AppointmentStatus   @default(PENDING)
  
  // Queue Management
  queueNumber       Int?
  tokenNumber       String?
  checkInTime       DateTime?
  checkOutTime      DateTime?
  
  // Medical Info
  symptoms          String?
  chiefComplaint    String?
  diagnosis         String?
  notes             String?
  
  // Payment
  consultationFee   Float               @default(0)
  paymentStatus     PaymentStatus       @default(PENDING)
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  cancelledAt       DateTime?
  completedAt       DateTime?
  
  // Relations
  payment           Payment?
  medicalRecords    MedicalRecord[]
  prescriptions     Prescription[]
  
  @@index([clinicId])
  @@index([doctorId])
  @@index([patientId])
  @@index([date])
  @@index([status])
}

enum AppointmentType {
  IN_PERSON
  VIDEO_CALL
  PHONE_CALL
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  IN_CONSULTATION
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

---

## 🔗 Key Relationships

### 1. User → Profiles (One-to-One)
```
User ────1:1───► PatientProfile
User ────1:1───► DoctorProfile
User ────1:1───► ClinicOwnerProfile
User ────1:1───► ReceptionistProfile
User ────1:1───► AdminProfile
```

### 2. User → Clinic (One-to-Many via Owner)
```
User (CLINIC_OWNER) ────1:N───► Clinic
```

### 3. Clinic → Appointments (One-to-Many)
```
Clinic ────1:N───► Appointment
Doctor ────1:N───► Appointment
Patient ────1:N───► Appointment
```

### 4. User → Auth Tokens (One-to-Many)
```
User ────1:N───► RefreshToken
User ────1:N───► DeviceToken
User ────1:N───► PasswordResetToken
```

### 5. Appointment → Payment (One-to-One)
```
Appointment ────1:1───► Payment
```

---

## 📋 Index Strategy

### Primary Indexes (for performance)
```sql
-- User table
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_mobile ON "User"(mobile);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_approval ON "User"("approvalStatus");

-- Clinic table
CREATE INDEX idx_clinic_owner ON "Clinic"("ownerId");
CREATE INDEX idx_clinic_city ON "Clinic"(city);
CREATE INDEX idx_clinic_status ON "Clinic"("approvalStatus");

-- Appointment table
CREATE INDEX idx_appt_clinic ON "Appointment"("clinicId");
CREATE INDEX idx_appt_doctor ON "Appointment"("doctorId");
CREATE INDEX idx_appt_patient ON "Appointment"("patientId");
CREATE INDEX idx_appt_date ON "Appointment"(date);
CREATE INDEX idx_appt_status ON "Appointment"(status);

-- RefreshToken table
CREATE INDEX idx_token_user ON "RefreshToken"("userId");
CREATE INDEX idx_token_value ON "RefreshToken"(token);
```

---

## 🎯 Special Data Structures

### clinicOnboardingData JSON Structure
```json
{
  "clinicInformation": { /* Step 1 data */ },
  "servicesOperations": { /* Step 2 data */ },
  "clinicDocuments": { /* Step 3 data */ },
  "partnerAgreement": { /* Step 4 data */ },
  "onboardingComplete": true,
  "submittedAt": "2024-01-15T11:15:00.000Z"
}
```

---

This is the complete database architecture for PulseMate Connect! 🎉
