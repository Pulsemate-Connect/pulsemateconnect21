# Doctor Invitation Workflow - Quick Reference Card

## 📋 Database Tables Quick Reference

### 1. doctor_invitations
**Purpose:** Track invitation from clinic owner to doctor  
**Key Fields:** `doctorName`, `doctorMobile`, `doctorEmail`, `specialization`, `invitationToken`, `status`  
**Statuses:** INVITATION_SENT → INVITATION_ACCEPTED → VERIFICATION_PENDING → VERIFIED/REJECTED

---

### 2. doctor_profiles
**Purpose:** Complete doctor profile with credentials  
**Key Fields:**
- Personal: `fullLegalName`, `dateOfBirth`, `gender`, `profilePhotoUrl`
- Professional: `medicalSystem`, `qualification`, `specialization`, `medicalRegistrationNumber`, `registrationAuthority`, `registrationYear`
- Optional: `experienceYears`, `languagesKnown`, `bio`, `consultationFee`, `areasOfExpertise`
- Workflow: `invitationId`, `verificationStatus`, `profileSubmittedAt`

---

### 3. doctor_verification_documents
**Purpose:** Store uploaded documents  
**Key Fields:** `documentType`, `storageUrl`, `verificationStatus`  
**Types:** REGISTRATION_CERTIFICATE, QUALIFICATION_CERTIFICATE, ADDITIONAL_QUALIFICATION

---

### 4. doctor_verification_logs
**Purpose:** Audit trail  
**Key Fields:** `oldStatus`, `newStatus`, `action`, `reason`, `adminId`, `createdAt`

---

### 5. clinic_doctors (enhanced)
**Purpose:** Clinic-doctor relationship  
**New Fields:** `invitationAcceptedAt`, `verificationSubmittedAt`, `adminVerifiedAt`, `adminVerifiedById`, `changesRequestedAt`, `changesRequestedReason`

---

## 🔄 Status Flow

```
INVITATION_SENT (clinic owner sends)
    ↓
INVITATION_ACCEPTED (doctor accepts)
    ↓
PROFILE_IN_PROGRESS (doctor filling profile)
    ↓
VERIFICATION_PENDING (doctor submits)
    ↓
    ├─→ VERIFIED (admin approves) ✅
    ├─→ CHANGES_REQUIRED (admin requests changes) 🔄
    └─→ REJECTED (admin rejects) ❌
```

---

## 📝 Field Requirements by Step

### Step 1: Clinic Owner (Minimal Input)
- ✅ doctorName (required)
- ✅ doctorMobile (required)
- ❌ doctorEmail (optional)
- ❌ specialization (optional)

### Step 2: Doctor Personal Info
- ✅ fullLegalName (required)
- ✅ dateOfBirth (required)
- ✅ gender (required)
- ✅ mobile (prefilled, required)
- ✅ profilePhotoUrl (required)

### Step 3: Doctor Professional Info
- ✅ medicalSystem (required)
- ✅ qualification (required)
- ✅ specialization (required)
- ✅ medicalRegistrationNumber (required, unique)
- ✅ registrationAuthority (required)
- ✅ registrationYear (required)

### Step 4: Doctor Documents
- ✅ Registration certificate (required)
- ✅ Qualification certificate (required)
- ❌ Additional certificates (if applicable)

### Step 5: Doctor Professional Profile (Optional)
- ❌ experienceYears (can be 0)
- ❌ languagesKnown
- ❌ bio
- ❌ consultationFee
- ❌ areasOfExpertise

---

## 🗄️ Database Queries Cheat Sheet

### Get Pending Verifications
```javascript
const pending = await prisma.doctorInvitation.findMany({
  where: { status: 'VERIFICATION_PENDING' },
  include: {
    doctorProfile: true,
    clinic: true,
    invitedBy: true
  }
});
```

### Get Doctor's Invitation Details
```javascript
const invitation = await prisma.doctorInvitation.findUnique({
  where: { invitationToken: token },
  include: {
    clinic: { select: { name: true, address: true } },
    invitedBy: { select: { name: true } }
  }
});
```

### Get Doctor's Documents
```javascript
const documents = await prisma.doctorVerificationDocument.findMany({
  where: { doctorProfileId: id },
  orderBy: { uploadedAt: 'desc' }
});
```

### Get Verification Logs
```javascript
const logs = await prisma.doctorVerificationLog.findMany({
  where: { doctorProfileId: id },
  include: { admin: { select: { name: true } } },
  orderBy: { createdAt: 'desc' }
});
```

---

## 🎯 Admin Actions Quick Guide

### Approve
```javascript
// Update: invitation.status = 'VERIFIED'
// Update: doctorProfile.verificationStatus = 'VERIFIED'
// Update: user.approvalStatus = 'VERIFIED'
// Create/Update: clinicDoctor (isActive = true)
// Update all documents: verificationStatus = 'VERIFIED'
// Create log: action = 'APPROVED'
```

### Request Changes
```javascript
// Update: invitation.status = 'CHANGES_REQUIRED'
// Update: doctorProfile.verificationStatus = 'CHANGES_REQUIRED'
// Update: clinicDoctor.changesRequestedReason = reason
// Create log: action = 'REQUESTED_CHANGES'
```

### Reject
```javascript
// Update: invitation.status = 'REJECTED'
// Update: doctorProfile.verificationStatus = 'REJECTED'
// Update: user.approvalStatus = 'REJECTED'
// Create log: action = 'REJECTED'
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `WORKFLOW-CONFIRMATION.md` | Your requirements vs database schema |
| `WORKFLOW-TO-DATABASE-MAPPING.md` | Detailed field mapping |
| `DOCTOR-INVITATION-IMPLEMENTATION.md` | Complete implementation guide |
| `FINAL-DATABASE-SETUP-COMPLETE.md` | Technical summary |
| `backend/prisma/schema.prisma` | Complete schema definition |

---

## ✅ Status: READY

- ✅ Database schema created
- ✅ All tables operational
- ✅ Backend running (port 5000)
- ✅ Frontend running (port 3000)
- ✅ Documentation complete

**Next:** Implement backend API endpoints

---

*Quick Reference Card - August 15, 2026*
