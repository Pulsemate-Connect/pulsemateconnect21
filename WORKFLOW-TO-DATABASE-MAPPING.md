# Workflow to Database Schema Mapping

## Complete mapping of the doctor invitation workflow to database fields

---

## 1. Clinic Owner — Invite Doctor

### Form Fields → Database Mapping

| UI Field | Required | Database Table | Database Field | Notes |
|----------|----------|----------------|----------------|-------|
| Full Name | ✅ Yes | `doctor_invitations` | `doctorName` | STRING |
| Mobile Number | ✅ Yes | `doctor_invitations` | `doctorMobile` | STRING |
| Email | ❌ Optional | `doctor_invitations` | `doctorEmail` | STRING? |
| Specialization | ❌ Optional | `doctor_invitations` | `specialization` | STRING? |

### Auto-Generated Fields

| Field | Database Table | Database Field | Value |
|-------|----------------|----------------|-------|
| Clinic ID | `doctor_invitations` | `clinicId` | From logged-in user's clinic |
| Invited By | `doctor_invitations` | `invitedById` | From logged-in user ID |
| Invitation Token | `doctor_invitations` | `invitationToken` | Secure random token (UUID or crypto) |
| Token Expiry | `doctor_invitations` | `tokenExpiresAt` | Current time + 48 hours |
| Status | `doctor_invitations` | `status` | `INVITATION_SENT` |
| Created At | `doctor_invitations` | `createdAt` | Current timestamp |
| Updated At | `doctor_invitations` | `updatedAt` | Current timestamp |

### After Sending
- Status displayed: "Invitation Sent"
- SMS/Email sent to doctor with invitation link containing `invitationToken`

---

## 2. Doctor — Accept Invitation

### View Invitation Page

Doctor accesses: `/doctor/invitation/{invitationToken}`

**Data Retrieved from Database:**

| UI Display | Database Query | Tables/Fields |
|------------|----------------|---------------|
| Clinic Name | `invitation.clinic.name` | `clinics.name` |
| Clinic Address | `invitation.clinic.address` | `clinics.address` |
| Invited Role | Static | "Doctor" |
| Invited By | `invitation.invitedBy.name` | `users.name` |

### Accept Action

When doctor clicks "Accept":

| Action | Database Table | Database Field | Value |
|--------|----------------|----------------|-------|
| Update Invitation | `doctor_invitations` | `status` | `INVITATION_ACCEPTED` |
| Update Invitation | `doctor_invitations` | `acceptedAt` | Current timestamp |
| Create User | `users` | `mobile` | From `doctor_invitations.doctorMobile` |
| Create User | `users` | `email` | From `doctor_invitations.doctorEmail` |
| Create User | `users` | `name` | From `doctor_invitations.doctorName` |
| Create User | `users` | `role` | `DOCTOR` |
| Create User | `users` | `approvalStatus` | `PENDING` |
| Link User to Invitation | `doctor_invitations` | `doctorUserId` | New user ID |
| Send OTP | - | - | OTP verification flow |

### Decline Action

When doctor clicks "Decline":

| Action | Database Table | Database Field | Value |
|--------|----------------|----------------|-------|
| Update Invitation | `doctor_invitations` | `status` | `INVITATION_DECLINED` |
| Update Invitation | `doctor_invitations` | `declinedAt` | Current timestamp |
| Update Invitation | `doctor_invitations` | `declinedReason` | User input (optional) |

---

## 3. Doctor — Required Profile

### A. Personal Information

| UI Field | Required | Database Table | Database Field | Pre-fillable? | Notes |
|----------|----------|----------------|----------------|---------------|-------|
| Full Legal Name | ✅ Yes | `doctor_profiles` | `fullLegalName` | Yes, from invitation | STRING |
| Date of Birth | ✅ Yes | `doctor_profiles` | `dateOfBirth` | No | DATETIME |
| Gender | ✅ Yes | `doctor_profiles` | `gender` | No | STRING (Male/Female/Other) |
| Mobile Number | ✅ Yes | `users` | `mobile` | Yes, from invitation | STRING (already in User) |
| Profile Photo | ✅ Yes | `doctor_profiles` | `profilePhotoUrl` | No | STRING (uploaded file URL) |

**Auto-Updated Fields:**
- `doctor_profiles.profileCompletionPercentage` - Calculate based on filled fields
- `doctor_profiles.lastEditedAt` - Current timestamp
- `doctor_invitations.status` - Update to `PROFILE_IN_PROGRESS` (if not already)

---

### B. Professional Information

| UI Field | Required | Database Table | Database Field | Notes |
|----------|----------|----------------|----------------|-------|
| Medical System | ✅ Yes | `doctor_profiles` | `medicalSystem` | STRING (Modern Medicine, Ayurveda, Homeopathy, etc.) |
| Qualification | ✅ Yes | `doctor_profiles` | `qualification` | STRING (MBBS, BDS, BAMS, BHMS, etc.) |
| Specialization | ✅ Yes | `doctor_profiles` | `specialization` | STRING (General Physician, Cardiologist, etc.) |
| Registration Authority | ✅ Yes | `doctor_profiles` | `registrationAuthority` | STRING (Karnataka Medical Council, etc.) |
| Registration Number | ✅ Yes | `doctor_profiles` | `medicalRegistrationNumber` | STRING (UNIQUE) |
| Registration Year | ✅ Yes | `doctor_profiles` | `registrationYear` | INTEGER |

**Auto-Updated Fields:**
- `doctor_profiles.profileCompletionPercentage` - Update calculation
- `doctor_profiles.lastEditedAt` - Current timestamp

---

### C. Professional Documents

**Documents Upload Flow:**

Each document upload creates a record in `doctor_verification_documents`:

| UI Field | Database Table | Database Field | Value |
|----------|----------------|----------------|-------|
| Doctor ID | `doctor_verification_documents` | `doctorProfileId` | Current doctor profile ID |
| Document Type | `doctor_verification_documents` | `documentType` | "REGISTRATION_CERTIFICATE" / "QUALIFICATION_CERTIFICATE" / "ADDITIONAL_QUALIFICATION" |
| Document Category | `doctor_verification_documents` | `documentCategory` | Based on medical system |
| File Name | `doctor_verification_documents` | `fileName` | Original filename |
| File Size | `doctor_verification_documents` | `fileSize` | File size in bytes (BIGINT) |
| MIME Type | `doctor_verification_documents` | `mimeType` | "application/pdf", "image/jpeg", etc. |
| Storage URL | `doctor_verification_documents` | `storageUrl` | Public URL to access file |
| Storage Key | `doctor_verification_documents` | `storageKey` | S3/Supabase storage key |
| Verification Status | `doctor_verification_documents` | `verificationStatus` | `PENDING` (initial) |
| Uploaded At | `doctor_verification_documents` | `uploadedAt` | Current timestamp |

**Required Documents (Dynamic based on Medical System):**

**Modern Medicine:**
1. Medical Registration Certificate (required)
2. MBBS/MD/MS Degree Certificate (required)
3. Additional Qualification Certificate (if applicable)

**Ayurveda:**
1. Medical Registration Certificate (required)
2. BAMS Degree Certificate (required)

**Homeopathy:**
1. Medical Registration Certificate (required)
2. BHMS Degree Certificate (required)

---

### D. Professional Profile (Optional - After Verification)

| UI Field | Required | Database Table | Database Field | Notes |
|----------|----------|----------------|----------------|-------|
| Years of Experience | ❌ No | `doctor_profiles` | `experienceYears` | INTEGER (can be 0 for new doctors) |
| Languages Spoken | ❌ No | `doctor_profiles` | `languagesKnown` | STRING[] (array) |
| About/Bio | ❌ No | `doctor_profiles` | `bio` | TEXT |
| Consultation Fee | ❌ No | `doctor_profiles` | `consultationFee` | FLOAT |
| Areas of Expertise | ❌ No | `doctor_profiles` | `areasOfExpertise` | STRING[] (array) |

**Note:** These fields can be completed after core verification. They don't block the verification process.

---

## 4. Doctor Submits for Verification

### Submit Action

When doctor clicks "Submit for Verification":

| Action | Database Table | Database Field | Value |
|--------|----------------|----------------|-------|
| Update Profile | `doctor_profiles` | `profileSubmittedAt` | Current timestamp |
| Update Profile | `doctor_profiles` | `verificationStatus` | `PENDING` |
| Update Profile | `doctor_profiles` | `profileStatus` | `COMPLETE` |
| Update Invitation | `doctor_invitations` | `status` | `VERIFICATION_PENDING` |
| Update Invitation | `doctor_invitations` | `submittedAt` | Current timestamp |
| Create Log Entry | `doctor_verification_logs` | `doctorProfileId` | Current doctor profile ID |
| Create Log Entry | `doctor_verification_logs` | `oldStatus` | Previous status |
| Create Log Entry | `doctor_verification_logs` | `newStatus` | `VERIFICATION_PENDING` |
| Create Log Entry | `doctor_verification_logs` | `action` | "SUBMITTED_FOR_VERIFICATION" |
| Create Log Entry | `doctor_verification_logs` | `createdAt` | Current timestamp |

### UI Display After Submit
- Status badge: "🟡 Verification Pending"
- Message: "Your profile has been submitted for verification. You'll be notified once reviewed."

---

## 5. PulseMate Admin Verification

### View Pending Verifications

**Query to get pending verifications:**
```sql
SELECT 
  di.*,
  dp.*,
  u.name as doctor_name,
  u.mobile as doctor_mobile,
  c.name as clinic_name
FROM doctor_invitations di
JOIN doctor_profiles dp ON di.id = dp.invitationId
JOIN users u ON di.doctorUserId = u.id
JOIN clinics c ON di.clinicId = c.id
WHERE di.status = 'VERIFICATION_PENDING'
ORDER BY di.submittedAt ASC
```

### View Doctor Details

**Data to display:**
1. Personal Information (from `doctor_profiles`)
2. Professional Information (from `doctor_profiles`)
3. Documents (from `doctor_verification_documents`)
4. Verification Logs (from `doctor_verification_logs`)

---

### Outcome 1: ✅ APPROVE

When admin clicks "Approve":

| Action | Database Table | Database Field | Value |
|--------|----------------|----------------|-------|
| Update Profile | `doctor_profiles` | `verificationStatus` | `VERIFIED` |
| Update User | `users` | `approvalStatus` | `VERIFIED` |
| Update Invitation | `doctor_invitations` | `status` | `VERIFIED` |
| Update Invitation | `doctor_invitations` | `verifiedAt` | Current timestamp |
| Update Invitation | `doctor_invitations` | `verifiedById` | Admin user ID |
| Create/Update Clinic Relationship | `clinic_doctors` | `doctorId` | Doctor profile ID |
| Create/Update Clinic Relationship | `clinic_doctors` | `clinicId` | From invitation |
| Create/Update Clinic Relationship | `clinic_doctors` | `inviteStatus` | `ACCEPTED` |
| Create/Update Clinic Relationship | `clinic_doctors` | `isActive` | `true` |
| Create/Update Clinic Relationship | `clinic_doctors` | `invitationAcceptedAt` | Invitation acceptedAt |
| Create/Update Clinic Relationship | `clinic_doctors` | `verificationSubmittedAt` | Invitation submittedAt |
| Create/Update Clinic Relationship | `clinic_doctors` | `adminVerifiedAt` | Current timestamp |
| Create/Update Clinic Relationship | `clinic_doctors` | `adminVerifiedById` | Admin user ID |
| Update Documents | `doctor_verification_documents` | `verificationStatus` | `VERIFIED` (all) |
| Update Documents | `doctor_verification_documents` | `verifiedById` | Admin user ID |
| Update Documents | `doctor_verification_documents` | `verifiedAt` | Current timestamp |
| Create Log Entry | `doctor_verification_logs` | `doctorProfileId` | Doctor profile ID |
| Create Log Entry | `doctor_verification_logs` | `adminId` | Admin user ID |
| Create Log Entry | `doctor_verification_logs` | `oldStatus` | `VERIFICATION_PENDING` |
| Create Log Entry | `doctor_verification_logs` | `newStatus` | `VERIFIED` |
| Create Log Entry | `doctor_verification_logs` | `action` | "APPROVED" |
| Create Log Entry | `doctor_verification_logs` | `adminNotes` | Admin input (optional) |
| Create Log Entry | `doctor_verification_logs` | `createdAt` | Current timestamp |

**Notification Triggers:**
- SMS to doctor: "Your profile has been verified! You can now start consultations."
- In-app notification to clinic owner: "Dr. {name} has been verified and added to your clinic."

---

### Outcome 2: ❌ CHANGES REQUIRED

When admin clicks "Request Changes":

| Action | Database Table | Database Field | Value |
|--------|----------------|----------------|-------|
| Update Invitation | `doctor_invitations` | `status` | `CHANGES_REQUIRED` |
| Update Profile | `doctor_profiles` | `verificationStatus` | `CHANGES_REQUIRED` |
| Update Clinic Relationship | `clinic_doctors` | `changesRequestedAt` | Current timestamp |
| Update Clinic Relationship | `clinic_doctors` | `changesRequestedReason` | Admin input (required) |
| Create Log Entry | `doctor_verification_logs` | `doctorProfileId` | Doctor profile ID |
| Create Log Entry | `doctor_verification_logs` | `adminId` | Admin user ID |
| Create Log Entry | `doctor_verification_logs` | `oldStatus` | `VERIFICATION_PENDING` |
| Create Log Entry | `doctor_verification_logs` | `newStatus` | `CHANGES_REQUIRED` |
| Create Log Entry | `doctor_verification_logs` | `action` | "REQUESTED_CHANGES" |
| Create Log Entry | `doctor_verification_logs` | `reason` | Admin input (required) |
| Create Log Entry | `doctor_verification_logs` | `adminNotes` | Admin input (optional) |
| Create Log Entry | `doctor_verification_logs` | `createdAt` | Current timestamp |

**Doctor Can Edit:**
- Doctor logs in and sees "Changes Required" status
- Doctor can edit any profile section
- Doctor can re-upload documents
- When done, doctor clicks "Resubmit" → Status changes back to `VERIFICATION_PENDING`

---

### Outcome 3: ❌ REJECT

When admin clicks "Reject":

| Action | Database Table | Database Field | Value |
|--------|----------------|----------------|-------|
| Update Invitation | `doctor_invitations` | `status` | `REJECTED` |
| Update Invitation | `doctor_invitations` | `rejectedAt` | Current timestamp |
| Update Invitation | `doctor_invitations` | `rejectedById` | Admin user ID |
| Update Invitation | `doctor_invitations` | `rejectionReason` | Admin input (required) |
| Update Profile | `doctor_profiles` | `verificationStatus` | `REJECTED` |
| Update User | `users` | `approvalStatus` | `REJECTED` |
| Update User | `users` | `rejectionReason` | Admin input |
| Create Log Entry | `doctor_verification_logs` | `doctorProfileId` | Doctor profile ID |
| Create Log Entry | `doctor_verification_logs` | `adminId` | Admin user ID |
| Create Log Entry | `doctor_verification_logs` | `oldStatus` | `VERIFICATION_PENDING` |
| Create Log Entry | `doctor_verification_logs` | `newStatus` | `REJECTED` |
| Create Log Entry | `doctor_verification_logs` | `action` | "REJECTED" |
| Create Log Entry | `doctor_verification_logs` | `reason` | Admin input (required) |
| Create Log Entry | `doctor_verification_logs` | `adminNotes` | Admin input (optional) |
| Create Log Entry | `doctor_verification_logs` | `createdAt` | Current timestamp |

**Notification Triggers:**
- SMS to doctor: "Your verification was not approved. Reason: {reason}"
- Doctor cannot resubmit (final rejection)

---

## Complete State Machine

```
CLINIC OWNER ACTION:
├─ Send Invitation
│  └─> doctor_invitations.status = INVITATION_SENT
│
DOCTOR ACTIONS:
├─ Accept Invitation
│  └─> doctor_invitations.status = INVITATION_ACCEPTED
│     └─> Create User (role=DOCTOR, approvalStatus=PENDING)
│     └─> Create DoctorProfile
│
├─ Start Completing Profile
│  └─> doctor_invitations.status = PROFILE_IN_PROGRESS
│
├─ Submit for Verification
│  └─> doctor_invitations.status = VERIFICATION_PENDING
│  └─> doctor_profiles.verificationStatus = PENDING
│
ADMIN ACTIONS:
├─ Approve
│  └─> doctor_invitations.status = VERIFIED
│  └─> doctor_profiles.verificationStatus = VERIFIED
│  └─> users.approvalStatus = VERIFIED
│  └─> clinic_doctors.inviteStatus = ACCEPTED
│  └─> clinic_doctors.isActive = true
│
├─ Request Changes
│  └─> doctor_invitations.status = CHANGES_REQUIRED
│  └─> doctor_profiles.verificationStatus = CHANGES_REQUIRED
│  └─> Doctor can edit and resubmit
│     └─> Returns to VERIFICATION_PENDING
│
├─ Reject
│  └─> doctor_invitations.status = REJECTED
│  └─> doctor_profiles.verificationStatus = REJECTED
│  └─> users.approvalStatus = REJECTED
```

---

## Database Indexes for Performance

All necessary indexes are already created:

1. **doctor_invitations**: clinicId, doctorMobile, invitationToken, status, createdAt
2. **doctor_profiles**: invitationId, verificationStatus, profileSubmittedAt, medicalRegistrationNumber
3. **doctor_verification_documents**: doctorProfileId, documentType, verificationStatus
4. **doctor_verification_logs**: doctorProfileId, adminId, createdAt
5. **clinic_doctors**: doctorId, clinicId, inviteStatus, isActive

---

## Summary: Key Principle

**Separation of Concerns:**

1. **Clinic Owner** → Only provides identification info (name, mobile)
2. **Doctor** → Provides all professional credentials and documents
3. **Admin** → Verifies the credentials submitted by doctor

This ensures:
- ✅ Clinic owner has minimal burden
- ✅ Doctor owns their credentials
- ✅ Admin verifies authenticity
- ✅ No one can certify someone else's credentials

---

## Database Schema is Complete! ✅

All fields required for this workflow are now in the database:
- ✅ doctor_invitations table (invitation lifecycle)
- ✅ doctor_profiles table (all profile fields including new areasOfExpertise)
- ✅ doctor_verification_documents table (document storage and verification)
- ✅ doctor_verification_logs table (audit trail)
- ✅ clinic_doctors table (clinic-doctor relationship with verification tracking)
- ✅ users table (user management with approval status)

**Status:** Ready for backend API and frontend UI implementation!
