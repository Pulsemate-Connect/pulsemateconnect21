# Design Document: Unified Multi-Role OTP Authentication

## Overview

This design document outlines the architectural migration of PulseMate Connect's authentication system from a **password-based, single-role-per-user model** to a **unified identity, multi-role, OTP-only authentication** system. The migration enables one mobile number to represent one user with multiple roles (Patient, Doctor, Receptionist, Clinic Owner, Admin), removes password-based authentication, and consolidates all authentication flows to use OTP (Message Central for production).

### Migration Principles

1. **DO NOT rebuild** — Modify existing Supabase/PostgreSQL schema and codebase
2. **Preserve existing data** — No data loss during migration
3. **Backward compatibility** — Existing role-specific flows continue working
4. **One identity per mobile** — Prevent duplicate user accounts
5. **Security first** — Server-side role enforcement, OTP credentials never exposed to frontend

### Current State Analysis

**Existing Database Schema (Prisma/PostgreSQL):**
```prisma
model User {
  id              String      @id @default(uuid())
  mobile          String      @unique
  email           String?     @unique
  role            UserRole    @default(PATIENT)  // ❌ Single role enum
  passwordHash    String?                         // ❌ To be deprecated
  
  // Profile Relations (1:1)
  patientProfile        PatientProfile?
  doctorProfile         DoctorProfile?
  receptionistProfile   ReceptionistProfile?
  clinicOwnerProfile    ClinicOwnerProfile?
  adminProfile          AdminProfile?
}

enum UserRole {
  PATIENT
  CLINIC_OWNER
  DOCTOR
  RECEPTIONIST
  SUPER_ADMIN
}
```

**Current Authentication Flows:**
- **Patients**: Firebase Phone Auth (mobile app) + Message Central OTP (web)
- **Clinic Owner**: Firebase Phone verification + Email OTP + Password
- **Doctor**: Firebase Phone verification + Password
- **Receptionist**: Created by clinic owner with password
- **Admin**: Email + Password (seeded accounts)

**Current Problems:**
1. ❌ User.role is a single enum — cannot represent multiple roles
2. ❌ Password-based auth exists for staff roles (Doctor, Receptionist, Clinic Owner, Admin)
3. ❌ One mobile number → one role (Doctor cannot be Patient without separate account)
4. ❌ Multiple auth flows (Firebase, Message Central, Email+Password) create complexity
5. ❌ passwordHash field exists but should be removed

---

## High-Level Design

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED USER IDENTITY                          │
│  One Mobile Number = One User = Multiple Roles + Profiles        │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────────┐
                        │    users     │
                        │              │
                        │  id (UUID)   │
                        │  mobile      │ ← UNIQUE (normalized +91XXXXXXXXXX)
                        │  email       │
                        │  name        │
                        │  role        │ ← DEPRECATED (kept for migration)
                        │  passwordHash│ ← TO BE REMOVED
                        └──────┬───────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  user_roles  │  │  user_roles  │  │  user_roles  │
        │              │  │              │  │              │
        │  userId      │  │  userId      │  │  userId      │
        │  PATIENT     │  │  DOCTOR      │  │  CLINIC_OWNER│
        └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
               │                 │                  │
               ▼                 ▼                  ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ patient_profiles│  │ doctor_profiles │  │clinic_owner_    │
    │                 │  │                 │  │    profiles     │
    │  userId (FK)    │  │  userId (FK)    │  │  userId (FK)    │
    │  age, dob       │  │  qualification  │  │  businessName   │
    │  gender, etc    │  │  specialization │  │  designation    │
    └─────────────────┘  └─────────────────┘  └─────────────────┘

                    AUTHENTICATION FLOW (OTP ONLY)
                    
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │ Message      │
│              │──────│              │──────│  Central     │
│ Enter Mobile │ POST │ /auth/send-  │ API  │  VerifyNow   │
│    +91XXX    │─────▶│     otp      │─────▶│  SMS OTP     │
│              │      │              │      │              │
│              │◀─────│ otpId saved  │◀─────│ delivery OK  │
│              │      │              │      │              │
│ Enter OTP    │ POST │ /auth/verify-│      │              │
│   123456     │─────▶│     otp      │      │              │
│              │      │ • Verify OTP │      │              │
│              │      │ • Find/Create│      │              │
│              │      │   User       │      │              │
│              │      │ • Load Roles │      │              │
│              │◀─────│ • Issue JWT  │      │              │
│              │      │ accessToken  │      │              │
│   Redirect   │      │ refreshToken │      │              │
│  to correct  │      │              │      │              │
│  workspace   │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Target Schema Design

**New Table: `user_roles`**
```prisma
model UserRole {
  id        String   @id @default(uuid())
  userId    String
  role      RoleEnum
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, role])  // One user cannot have duplicate roles
  @@index([userId])
  @@index([role])
  @@map("user_roles")
}

enum RoleEnum {
  PATIENT
  DOCTOR
  RECEPTIONIST
  CLINIC_OWNER
  ADMIN
}
```

**Modified `User` table:**
```prisma
model User {
  id              String      @id @default(uuid())
  mobile          String      @unique  // Normalized: "+91XXXXXXXXXX"
  email           String?     @unique
  name            String?
  
  // DEPRECATED FIELDS (kept for backward compatibility during migration)
  role            UserRole    @default(PATIENT)  // Primary role (migration)
  passwordHash    String?                         // TO BE REMOVED
  
  // Auth metadata
  approvalStatus  ApprovalStatus @default(VERIFIED)
  isActive        Boolean     @default(true)
  isPhoneVerified Boolean     @default(false)
  isEmailVerified Boolean     @default(false)
  authProvider    String?     // "OTP", "FIREBASE_PHONE" (legacy)
  lastLoginAt     DateTime?
  
  // Relations
  roles           UserRole[]  // NEW: Multiple roles
  patientProfile        PatientProfile?
  doctorProfile         DoctorProfile?
  receptionistProfile   ReceptionistProfile?
  clinicOwnerProfile    ClinicOwnerProfile?
  adminProfile          AdminProfile?
  
  // ... other existing relations
  
  @@map("users")
}
```

**Authentication Tables (Existing - No Changes):**
- `otp_verifications` — Already exists, stores OTP hashes
- `otp_attempts` — Rate limiting and tracking
- `sessions` — JWT session management
- `refresh_tokens` — Refresh token rotation

---

## Component Design

### 1. Database Migration Strategy


**Phase 1: Schema Addition (Non-Breaking)**
```sql
-- Step 1: Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Step 2: Create RoleEnum type
CREATE TYPE "RoleEnum" AS ENUM (
  'PATIENT',
  'DOCTOR',
  'RECEPTIONIST',
  'CLINIC_OWNER',
  'ADMIN'
);

ALTER TABLE user_roles 
  ALTER COLUMN role TYPE "RoleEnum" 
  USING role::"RoleEnum";
```

**Phase 2: Data Migration**
```sql
-- Migrate existing users.role → user_roles table
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
  id as user_id,
  role::text::"RoleEnum" as role,
  created_at
FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify migration
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM user_roles) as migrated_roles
FROM users;
```

**Phase 3: Normalize Mobile Numbers**
```sql
-- Backup existing data first
CREATE TABLE users_backup_20260812 AS SELECT * FROM users;

-- Normalize mobile numbers to +91XXXXXXXXXX format
UPDATE users 
SET mobile = CASE
  WHEN mobile LIKE '+91%' THEN mobile
  WHEN mobile LIKE '91%' THEN CONCAT('+', mobile)
  WHEN LENGTH(mobile) = 10 THEN CONCAT('+91', mobile)
  ELSE mobile
END
WHERE mobile IS NOT NULL;

-- Check for duplicates before enforcing unique constraint
SELECT mobile, COUNT(*) as count
FROM users
WHERE mobile IS NOT NULL
GROUP BY mobile
HAVING COUNT(*) > 1;

-- If duplicates found, manual resolution required:
-- Option A: Merge accounts (complex, requires business logic)
-- Option B: Mark one as primary, deactivate others
-- Option C: Append identifier to duplicate mobile for migration
```

**Phase 4: Remove Password Dependencies (Gradual)**
```sql
-- DO NOT DROP passwordHash column immediately
-- Mark as nullable, deprecate in code first
-- After 100% OTP adoption (3-6 months), then:
ALTER TABLE users DROP COLUMN password_hash;


-- Also deprecate password reset tables
-- DROP TABLE password_reset_tokens; (after confirming no active tokens)
```

---

### 2. Backend Services Architecture

**New Service: `RoleService` (`backend/src/services/role.service.js`)**

```javascript
/**
 * Role Management Service
 * Handles multi-role operations for unified user identity
 */

const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Get all roles for a user
 * @param {string} userId
 * @returns {Promise<Array<string>>} Array of role names
 */
const getUserRoles = async (userId) => {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true }
  });
  return roles.map(r => r.role);
};

/**
 * Add role to user (idempotent)
 * @param {string} userId
 * @param {string} role - PATIENT, DOCTOR, etc.
 * @returns {Promise<UserRole>}
 */
const addUserRole = async (userId, role) => {
  return prisma.userRole.upsert({
    where: { 
      userId_role: { userId, role } 
    },
    update: {},  // No-op if exists
    create: { userId, role }
  });
};

/**
 * Check if user has specific role
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<boolean>}
 */
const userHasRole = async (userId, role) => {
  const exists = await prisma.userRole.findUnique({
    where: { userId_role: { userId, role } }
  });
  return !!exists;
};

/**
 * Ensure user has Patient role + profile (idempotent)
 * Called when Doctor/Clinic Owner/etc wants to use patient features
 * @param {string} userId
 * @returns {Promise<{role: UserRole, profile: PatientProfile}>}
 */
const ensurePatientProfile = async (userId) => {
  // Add PATIENT role if not exists
  await addUserRole(userId, 'PATIENT');
  
  // Create patient profile if not exists
  const profile = await prisma.patientProfile.upsert({
    where: { userId },
    update: {},  // No-op if exists
    create: {
      userId,
      profileCompleted: false
    }
  });
  
  logger.info(`ensurePatientProfile: userId=${userId} profile created/exists`);
  return { role: 'PATIENT', profile };
};

/**
 * Get primary/default role for user (for backward compatibility)
 * Priority: ADMIN > CLINIC_OWNER > DOCTOR > RECEPTIONIST > PATIENT
 */
const getPrimaryRole = async (userId) => {
  const roles = await getUserRoles(userId);
  const priority = ['ADMIN', 'CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'];
  for (const role of priority) {
    if (roles.includes(role)) return role;
  }
  return 'PATIENT';  // Default
};

module.exports = {
  getUserRoles,
  addUserRole,
  userHasRole,
  ensurePatientProfile,
  getPrimaryRole
};
```

**Modified: `auth.controller.js` — Unified OTP Login**

```javascript
/**
 * POST /api/auth/send-otp
 * Send OTP via Message Central (all roles)
 */
const sendOtpHandler = async (req, res) => {
  try {
    const { mobile, purpose = 'LOGIN' } = req.body;
    const normalizedMobile = normalizeMobileNumber(mobile);
    
    // Check if test mode
    const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
    const testNumbers = ['9999999999', '8888888888', '7777777777'];
    const isTestNumber = testNumbers.includes(normalizedMobile.slice(-10));
    
    let verificationId;
    
    if (isTestMode && isTestNumber) {
      // Test mode: Use fixed OTP 123456
      const otpHash = await hashOtp('123456');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      
      const otpRecord = await prisma.otpVerification.create({
        data: {
          mobile: normalizedMobile,
          purpose,
          otpHash,
          expiresAt,
          attempts: 0,
          maxAttempts: 5
        }
      });
      
      verificationId = otpRecord.id;
      logger.info(`TEST OTP sent to ${normalizedMobile}: 123456`);
    } else {
      // Production: Message Central
      const result = await messageCentralService.sendOtp(normalizedMobile);
      
      if (!result.success) {
        return sendError(res, result.error || 'Failed to send OTP', 500);
      }
      
      const otpHash = await hashOtp(result.otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      const otpRecord = await prisma.otpVerification.create({
        data: {
          mobile: normalizedMobile,
          purpose,
          otpHash,
          expiresAt,
          attempts: 0,
          maxAttempts: 5
        }
      });
      
      verificationId = otpRecord.id;
    }
    
    return sendSuccess(res, { 
      verificationId,
      expiresIn: 600,
      message: 'OTP sent successfully'
    });
    
  } catch (error) {
    logger.error('sendOtpHandler error:', error);
    return sendError(res, 'Failed to send OTP', 500);
  }
};

/**
 * POST /api/auth/verify-otp
 * Unified OTP verification for all roles
 * 
 * Request body:
 *   - mobile: string
 *   - otp: string (6 digits)
 *   - name?: string (for new user signup)
 *   - requestedRole?: 'PATIENT' | 'DOCTOR' | etc (optional, defaults to PATIENT for new users)
 */
const verifyOtpHandler = async (req, res) => {
  try {
    const { mobile, otp, name, requestedRole } = req.body;
    const normalizedMobile = normalizeMobileNumber(mobile);
    
    // 1. Find latest non-expired OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        mobile: normalizedMobile,
        isUsed: false,
        expiresAt: { gt: new Date() },
        attempts: { lt: prisma.otpVerification.fields.maxAttempts }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!otpRecord) {
      return sendError(res, 'OTP expired or invalid', 400);
    }
    
    // 2. Verify OTP
    const isValid = await verifyOtpHash(otp, otpRecord.otpHash);
    
    if (!isValid) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      });
      return sendError(res, 'Invalid OTP', 400);
    }
    
    // 3. Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { 
        isUsed: true,
        verifiedAt: new Date()
      }
    });
    
    // 4. Find or create user
    let user = await prisma.user.findUnique({
      where: { mobile: normalizedMobile },
      include: {
        roles: true,
        patientProfile: true,
        doctorProfile: true,
        clinicOwnerProfile: true,
        receptionistProfile: true,
        adminProfile: true
      }
    });
    
    const isNewUser = !user;
    
    if (isNewUser) {
      // NEW USER: Create with PATIENT role by default
      user = await prisma.user.create({
        data: {
          mobile: normalizedMobile,
          name: name || null,
          role: 'PATIENT',  // Legacy field
          authProvider: 'OTP',
          isPhoneVerified: true,
          approvalStatus: 'VERIFIED',
          roles: {
            create: { role: 'PATIENT' }
          },
          patientProfile: {
            create: { profileCompleted: false }
          }
        },
        include: {
          roles: true,
          patientProfile: true,
          doctorProfile: true,
          clinicOwnerProfile: true,
          receptionistProfile: true,
          adminProfile: true
        }
      });
      
      logger.info(`New user created via OTP: ${user.id}`);
    } else {
      // EXISTING USER: Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          isPhoneVerified: true
        },
        include: {
          roles: true,
          patientProfile: true,
          doctorProfile: true,
          clinicOwnerProfile: true,
          receptionistProfile: true,
          adminProfile: true
        }
      });
    }
    
    // 5. Get user roles
    const userRoles = user.roles.map(r => r.role);
    
    // 6. Issue JWT tokens (primary role = highest privilege)
    const primaryRole = await RoleService.getPrimaryRole(user.id);
    const tokens = await issueAuthTokens(res, user, req);
    
    // 7. Audit log
    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'USER_SIGNUP_OTP' : 'USER_LOGIN_OTP',
      entityType: 'USER',
      entityId: user.id,
      metadata: { mobile: normalizedMobile, roles: userRoles },
      ipAddress: req.ip
    });
    
    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        roles: userRoles,  // Array of roles
        primaryRole,
        profiles: {
          patient: user.patientProfile,
          doctor: user.doctorProfile,
          clinicOwner: user.clinicOwnerProfile,
          receptionist: user.receptionistProfile,
          admin: user.adminProfile
        },
        isNew: isNewUser
      }
    });
    
  } catch (error) {
    logger.error('verifyOtpHandler error:', error);
    return sendError(res, 'OTP verification failed', 500);
  }
};
```

**New Service: `PatientEnrollmentService` (`backend/src/services/patient-enrollment.service.js`)**

```javascript
/**
 * Patient Enrollment Service
 * Allows staff (Doctor/Clinic Owner/etc) to activate Patient role
 */

const prisma = require('../config/database');
const RoleService = require('./role.service');
const logger = require('../config/logger');

/**
 * Enroll user as Patient (idempotent)
 * Used when Doctor/Clinic Owner/etc wants to book appointment
 * 
 * @param {string} userId - User ID
 * @returns {Promise<{patient: PatientProfile, role: UserRole}>}
 */
const enrollAsPatient = async (userId) => {
  const result = await RoleService.ensurePatientProfile(userId);
  
  logger.info(`User ${userId} enrolled as Patient`);
  
  return {
    patient: result.profile,
    role: result.role
  };
};

/**
 * Check if user can book appointments (has Patient role + profile)
 */
const canBookAppointments = async (userId) => {
  const hasRole = await RoleService.userHasRole(userId, 'PATIENT');
  if (!hasRole) return false;
  
  const profile = await prisma.patientProfile.findUnique({
    where: { userId }
  });
  
  return !!profile;
};

module.exports = {
  enrollAsPatient,
  canBookAppointments
};
```

---

### 3. Frontend Architecture


**Unified Auth Store (`frontend/src/store/authStore.js`)**

```javascript
import create from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // User data
      user: null,
      accessToken: null,
      roles: [],           // NEW: Array of user roles
      primaryRole: null,   // NEW: Primary/active role
      activeWorkspace: null, // NEW: Current workspace context
      
      // Actions
      setAuth: (user, accessToken) => {
        const roles = user.roles || [];
        const primaryRole = user.primaryRole || (roles[0] || 'PATIENT');
        
        set({
          user,
          accessToken,
          roles,
          primaryRole,
          activeWorkspace: determineWorkspace(primaryRole)
        });
      },
      
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          roles: [],
          primaryRole: null,
          activeWorkspace: null
        });
      },
      
      // NEW: Switch workspace (for multi-role users)
      switchWorkspace: (role) => {
        const { roles } = get();
        if (!roles.includes(role)) {
          throw new Error(`User does not have ${role} role`);
        }
        
        set({
          primaryRole: role,
          activeWorkspace: determineWorkspace(role)
        });
      },
      
      // NEW: Check if user has specific role
      hasRole: (role) => {
        const { roles } = get();
        return roles.includes(role);
      },
      
      // NEW: Get available workspaces
      getAvailableWorkspaces: () => {
        const { roles } = get();
        return roles.map(role => ({
          role,
          workspace: determineWorkspace(role),
          label: getRoleLabel(role),
          icon: getRoleIcon(role)
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        roles: state.roles,
        primaryRole: state.primaryRole,
        activeWorkspace: state.activeWorkspace
      })
    }
  )
);

// Helper functions
const determineWorkspace = (role) => {
  const workspaceMap = {
    'PATIENT': '/patient/dashboard',
    'DOCTOR': '/doctor/dashboard',
    'CLINIC_OWNER': '/clinic/dashboard',
    'RECEPTIONIST': '/reception/dashboard',
    'ADMIN': '/admin/dashboard'
  };
  return workspaceMap[role] || '/';
};

const getRoleLabel = (role) => {
  const labels = {
    'PATIENT': 'Patient Portal',
    'DOCTOR': 'Doctor Workspace',
    'CLINIC_OWNER': 'Clinic Management',
    'RECEPTIONIST': 'Reception Desk',
    'ADMIN': 'Admin Panel'
  };
  return labels[role] || role;
};

const getRoleIcon = (role) => {
  const icons = {
    'PATIENT': 'user',
    'DOCTOR': 'stethoscope',
    'CLINIC_OWNER': 'building',
    'RECEPTIONIST': 'desk',
    'ADMIN': 'shield'
  };
  return icons[role] || 'user';
};

export default useAuthStore;
```

**Workspace Switcher Component (`frontend/src/components/WorkspaceSwitcher.jsx`)**

```jsx
import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';


const WorkspaceSwitcher = () => {
  const { primaryRole, getAvailableWorkspaces, switchWorkspace } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const workspaces = getAvailableWorkspaces();
  
  // Don't show if user only has one role
  if (workspaces.length <= 1) return null;
  
  const handleSwitch = (role) => {
    switchWorkspace(role);
    const workspace = workspaces.find(w => w.role === role);
    navigate(workspace.workspace);
    setIsOpen(false);
  };
  
  return (
    <div className="workspace-switcher">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="workspace-button"
      >
        <span className="current-workspace">
          {workspaces.find(w => w.role === primaryRole)?.label}
        </span>
        <ChevronDownIcon />
      </button>
      
      {isOpen && (
        <div className="workspace-menu">
          <div className="workspace-menu-header">Switch Workspace</div>
          {workspaces.map(workspace => (
            <button
              key={workspace.role}
              onClick={() => handleSwitch(workspace.role)}
              className={`workspace-item ${
                workspace.role === primaryRole ? 'active' : ''
              }`}
            >
              <WorkspaceIcon type={workspace.icon} />
              <span>{workspace.label}</span>
              {workspace.role === primaryRole && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
```

**Updated Login Flow (`frontend/src/pages/auth/OTPLogin.jsx`)**

```jsx
import React, { useState } from 'react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';


const OTPLogin = () => {
  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/send-otp', {
        mobile,
        purpose: 'LOGIN'
      });
      
      setVerificationId(response.data.data.verificationId);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/verify-otp', {
        mobile,
        otp
      });
      
      const { accessToken, user } = response.data.data;
      setAuth(user, accessToken);
      
      // Navigate to appropriate workspace
      const primaryRole = user.primaryRole || user.roles[0];
      const workspaceMap = {
        'PATIENT': '/patient/dashboard',
        'DOCTOR': '/doctor/dashboard',
        'CLINIC_OWNER': '/clinic/dashboard',
        'RECEPTIONIST': '/reception/dashboard',
        'ADMIN': '/admin/dashboard'
      };
      
      navigate(workspaceMap[primaryRole] || '/');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="otp-login-container">
      {step === 'mobile' && (
        <form onSubmit={handleSendOTP}>
          <h2>Login with OTP</h2>
          <input
            type="tel"
            placeholder="Enter mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
      
      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <h2>Enter OTP</h2>
          <p>OTP sent to {mobile}</p>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          {error && <div className="error">{error}</div>}
          <button 
            type="button" 
            onClick={() => setStep('mobile')}
          >
            Change Number
          </button>
        </form>
      )}
    </div>
  );
};

export default OTPLogin;
```

---

### 4. Security & Authorization

**Updated Middleware (`backend/src/middleware/auth.middleware.js`)**

```javascript
const prisma = require('../config/database');
const { verifyAccessToken } = require('../services/token.service');
const { sendError } = require('../utils/response');
const RoleService = require('../services/role.service');

/**
 * Authenticate user from JWT
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: true,
        patientProfile: true,
        doctorProfile: true,
        clinicOwnerProfile: true,
        receptionistProfile: true,
        adminProfile: true
      }
    });
    
    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }
    
    // Attach user and roles to request
    req.user = user;
    req.userId = user.id;
    req.userRoles = user.roles.map(r => r.role);
    req.primaryRole = decoded.role || user.role; // From JWT or legacy
    
    next();
  } catch (error) {
    return sendError(res, 'Invalid token', 401);
  }
};

/**
 * Require user to have specific role
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user || !req.userRoles) {
      return sendError(res, 'Unauthorized', 401);
    }
    
    const hasRole = req.userRoles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return sendError(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`, 403);
    }
    
    next();
  };
};

/**
 * Require Patient role (for booking appointments, etc)
 */
const requirePatient = requireRole(['PATIENT']);


/**
 * Require Doctor role
 */
const requireDoctor = requireRole(['DOCTOR', 'ADMIN']);

/**
 * Require Clinic Owner role
 */
const requireClinicOwner = requireRole(['CLINIC_OWNER', 'ADMIN']);

/**
 * Require Receptionist role
 */
const requireReceptionist = requireRole(['RECEPTIONIST', 'CLINIC_OWNER', 'ADMIN']);

/**
 * Require Admin role
 */
const requireAdmin = requireRole(['ADMIN']);

module.exports = {
  authenticateUser,
  requireRole,
  requirePatient,
  requireDoctor,
  requireClinicOwner,
  requireReceptionist,
  requireAdmin
};
```

**Row-Level Security (PostgreSQL RLS Policies)**

Since the project uses Prisma with PostgreSQL (not Supabase Auth), RLS policies are optional but recommended for additional security:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_owner_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY users_select_own 
  ON users FOR SELECT 
  USING (id = current_setting('app.user_id')::uuid);

-- Users can update their own record
CREATE POLICY users_update_own 
  ON users FOR UPDATE 
  USING (id = current_setting('app.user_id')::uuid);

-- Patient can read their own profile
CREATE POLICY patient_profiles_select_own 
  ON patient_profiles FOR SELECT 
  USING (user_id = current_setting('app.user_id')::uuid);

-- Doctor can read their own profile
CREATE POLICY doctor_profiles_select_own 
  ON doctor_profiles FOR SELECT 
  USING (user_id = current_setting('app.user_id')::uuid);

-- Clinic owner can read their own profile
CREATE POLICY clinic_owner_profiles_select_own 
  ON clinic_owner_profiles FOR SELECT 
  USING (user_id = current_setting('app.user_id')::uuid);

-- Admin can read all users
CREATE POLICY users_admin_all 
  ON users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = current_setting('app.user_id')::uuid 
      AND role = 'ADMIN'
    )
  );
```

---

### 5. Mobile Number Normalization


**Utility Function (`backend/src/utils/mobile.js`)**

```javascript
/**
 * Normalize mobile number to +91XXXXXXXXXX format
 * Handles various input formats:
 * - 9876543210 → +919876543210
 * - 919876543210 → +919876543210
 * - +919876543210 → +919876543210 (no change)
 * 
 * @param {string} mobile - Mobile number in any format
 * @returns {string} Normalized mobile number
 */
const normalizeMobileNumber = (mobile) => {
  if (!mobile) return '';
  
  // Remove all non-digit characters except leading +
  let cleaned = mobile.replace(/[^\d+]/g, '');
  
  // If already starts with +91, return as-is
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  // If starts with 91 (but not +91), add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If 10 digits, add +91 prefix
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // Default: return cleaned (validation will catch invalid formats)
  return cleaned;
};

/**
 * Validate Indian mobile number format
 * @param {string} mobile - Normalized mobile (+91XXXXXXXXXX)
 * @returns {boolean}
 */
const isValidIndianMobile = (mobile) => {
  const pattern = /^\+91[6-9]\d{9}$/;
  return pattern.test(mobile);
};

module.exports = {
  normalizeMobileNumber,
  isValidIndianMobile
};
```

---

### 6. Password Deprecation Strategy

**Phase 1: Add OTP login alongside password (CURRENT)**
- ✅ OTP login available for all roles
- ⚠️ Password login still works for backward compatibility
- Encourage users to switch to OTP

**Phase 2: Password login warning (Week 1-2)**
```javascript
// In loginHandler (password-based)
if (user.passwordHash) {
  logger.warn(`User ${user.id} still using password login - schedule for migration`);
  
  // Add deprecation notice in response
  return sendSuccess(res, {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    warning: 'Password login is deprecated. Please switch to OTP login for enhanced security.'
  });
}
```

**Phase 3: Disable password login (Week 3-4)**
```javascript
// Disable password login routes
// router.post('/auth/login-password', loginHandler); // DISABLED

const loginHandler = async (req, res) => {
  return sendError(res, 
    'Password login has been disabled. Please use OTP login.', 
    410 // Gone
  );
};
```

**Phase 4: Remove password fields (Month 2-3)**
```sql
-- Migration to remove passwordHash
ALTER TABLE users DROP COLUMN password_hash;
DROP TABLE password_reset_tokens;

-- Update seed scripts to remove password generation
```

---

### 7. Testing Strategy

**Unit Tests (`backend/tests/auth/otp.test.js`)**

```javascript
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');

describe('OTP Authentication', () => {
  
  describe('POST /auth/send-otp', () => {
    it('should send OTP to valid mobile number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '9999999999', purpose: 'LOGIN' });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('verificationId');
      expect(res.body.data.expiresIn).toBe(600);
    });
    
    it('should reject invalid mobile number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '12345', purpose: 'LOGIN' });
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('POST /auth/verify-otp', () => {
    let verificationId;
    
    beforeEach(async () => {
      // Send OTP first
      const sendRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '9999999999' });
      
      verificationId = sendRes.body.data.verificationId;
    });
    
    it('should create new user on first OTP login', async () => {
      const mobile = '+919876543210';
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile, otp: '123456', name: 'Test User' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.roles).toEqual(['PATIENT']);
      expect(res.body.data.user.isNew).toBe(true);
      
      // Verify user created in DB
      const user = await prisma.user.findUnique({
        where: { mobile },
        include: { roles: true, patientProfile: true }
      });
      
      expect(user).toBeTruthy();
      expect(user.roles).toHaveLength(1);
      expect(user.roles[0].role).toBe('PATIENT');
      expect(user.patientProfile).toBeTruthy();
    });
    
    it('should login existing user without creating duplicate', async () => {
      const mobile = '+919999999999';
      
      // First login
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile, otp: '123456', name: 'User One' });
      
      // Second login (should not create duplicate)
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile, otp: '123456' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.user.isNew).toBe(false);
      
      // Verify only one user exists
      const users = await prisma.user.findMany({ where: { mobile } });
      expect(users).toHaveLength(1);
    });
  });
});
```

**Integration Tests (`backend/tests/auth/multi-role.test.js`)**

```javascript
describe('Multi-Role User Management', () => {
  
  it('should allow Doctor to activate Patient profile', async () => {
    // Create doctor user
    const doctor = await prisma.user.create({
      data: {
        mobile: '+919123456789',
        name: 'Dr. Smith',
        role: 'DOCTOR',
        roles: { create: { role: 'DOCTOR' } },
        doctorProfile: { create: { qualification: 'MBBS' } }
      }
    });
    
    // Enroll as patient
    const RoleService = require('../../src/services/role.service');
    await RoleService.ensurePatientProfile(doctor.id);
    
    // Verify user has both roles
    const updated = await prisma.user.findUnique({
      where: { id: doctor.id },
      include: { roles: true, patientProfile: true }
    });
    
    const roleNames = updated.roles.map(r => r.role);
    expect(roleNames).toContain('DOCTOR');
    expect(roleNames).toContain('PATIENT');
    expect(updated.patientProfile).toBeTruthy();
  });
  
  it('should prevent duplicate role assignment', async () => {
    const user = await prisma.user.create({
      data: {
        mobile: '+919888888888',
        name: 'Test User',
        role: 'PATIENT',
        roles: { create: { role: 'PATIENT' } }
      }
    });
    
    const RoleService = require('../../src/services/role.service');
    
    // Try to add PATIENT role again (should be idempotent)
    await RoleService.addUserRole(user.id, 'PATIENT');
    await RoleService.addUserRole(user.id, 'PATIENT');
    
    // Verify still only one PATIENT role
    const roles = await prisma.userRole.findMany({
      where: { userId: user.id, role: 'PATIENT' }
    });
    
    expect(roles).toHaveLength(1);
  });
});
```

---

### 8. Migration Checklist

**Pre-Migration (Week 0)**
- [ ] Backup production database
- [ ] Analyze existing mobile number formats
- [ ] Identify duplicate mobile numbers
- [ ] Create rollback plan
- [ ] Set up monitoring alerts

**Database Migration (Week 1)**
- [ ] Create `user_roles` table (non-breaking)
- [ ] Create `RoleEnum` type
- [ ] Migrate existing `users.role` → `user_roles` table
- [ ] Verify data integrity (user count = role count)
- [ ] Normalize all mobile numbers to +91 format
- [ ] Resolve duplicate mobile numbers (if any)
- [ ] Add indexes on `user_roles(user_id)` and `user_roles(role)`

**Backend Implementation (Week 2)**
- [ ] Create `RoleService` with multi-role methods
- [ ] Create `PatientEnrollmentService`
- [ ] Update `auth.controller.js` with unified OTP handlers
- [ ] Update JWT payload to include roles array
- [ ] Update authentication middleware for multi-role checks
- [ ] Remove or deprecate password login routes
- [ ] Add workspace determination logic
- [ ] Update all role checks in controllers

**Frontend Implementation (Week 3)**
- [ ] Update `authStore` to support multiple roles
- [ ] Create `WorkspaceSwitcher` component
- [ ] Update login flow to use OTP only
- [ ] Add role-based navigation
- [ ] Add workspace context provider
- [ ] Update protected routes for multi-role
- [ ] Remove password input fields
- [ ] Add "Switch Workspace" UI in navigation

**Testing (Week 4)**
- [ ] Test new user OTP signup → Patient role
- [ ] Test existing user OTP login → Load multiple roles
- [ ] Test Doctor enrolling as Patient
- [ ] Test Clinic Owner enrolling as Patient
- [ ] Test workspace switching (multi-role users)
- [ ] Test role-based permissions (API endpoints)
- [ ] Test mobile number uniqueness constraint
- [ ] Test OTP rate limiting
- [ ] Load test OTP service (Message Central)
- [ ] Test backward compatibility (existing users)

**Deployment (Week 5)**
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Migrate staging database
- [ ] UAT with internal team
- [ ] Deploy to production (off-peak hours)
- [ ] Monitor error rates
- [ ] Monitor OTP delivery rates
- [ ] Announce OTP-only auth to users

**Post-Deployment (Week 6+)**
- [ ] Monitor password login usage (should decrease)
- [ ] Send email notifications about OTP migration
- [ ] Disable password login after 2 weeks
- [ ] Schedule passwordHash column removal (3 months)
- [ ] Update documentation
- [ ] Create user guide for workspace switching

---

### 9. Risk Mitigation

**Risk 1: Duplicate Mobile Numbers**
- **Impact**: High - Unique constraint failure
- **Mitigation**:
  - Pre-migration audit to find duplicates
  - Manual resolution: merge accounts or mark primary
  - Keep backup before enforcing constraint

**Risk 2: Message Central OTP Delivery Failure**
- **Impact**: High - Users cannot login
- **Mitigation**:
  - Implement fallback to test OTP for whitelisted numbers
  - Keep Firebase Phone Auth as backup (if needed)
  - Monitor delivery rates with alerts
  - Have support hotline ready

**Risk 3: Users Lose Access (No Password Fallback)**
- **Impact**: Medium - Support tickets increase
- **Mitigation**:
  - Gradual rollout with 2-week password deprecation notice
  - Admin "force OTP send" feature for stuck users
  - Clear communication about change

**Risk 4: JWT Contains Wrong Role**
- **Impact**: Medium - Authorization issues
- **Mitigation**:
  - Always load roles from DB on sensitive operations
  - JWT contains primary role + timestamp
  - Short token expiry (15 min)

**Risk 5: Migration Rollback Needed**
- **Impact**: High - Data inconsistency
- **Mitigation**:
  - Database backup before migration
  - Rollback script ready
  - Keep `users.role` column during transition
  - Feature flag for OTP-only mode

---

### 10. Performance Considerations

**Database Indexes**
```sql
-- Essential indexes for multi-role queries
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_otp_verifications_mobile ON otp_verifications(mobile, created_at DESC);
```

**Query Optimization**
```javascript
// BAD: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const roles = await prisma.userRole.findMany({ where: { userId: user.id } });
}

// GOOD: Use include to fetch in one query
const users = await prisma.user.findMany({
  include: { roles: true }
});
```

**Caching Strategy**
- Cache user roles in Redis (TTL: 5 minutes)
- Invalidate cache on role add/remove
- Cache workspace routes mapping

---

## Low-Level Design

### API Endpoints

**Authentication Endpoints**

```
POST /api/auth/send-otp
Request:
{
  "mobile": "9999999999",
  "purpose": "LOGIN" | "SIGNUP" | "VERIFY_MOBILE"
}

Response:
{
  "success": true,
  "data": {
    "verificationId": "uuid",
    "expiresIn": 600,
    "message": "OTP sent successfully"
  }
}

---

POST /api/auth/verify-otp
Request:
{
  "mobile": "9999999999",
  "otp": "123456",
  "name": "John Doe" (optional, for new users)
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "mobile": "+919999999999",
      "email": null,
      "roles": ["PATIENT"],
      "primaryRole": "PATIENT",
      "profiles": {
        "patient": { ... },
        "doctor": null,
        "clinicOwner": null,
        "receptionist": null,
        "admin": null
      },
      "isNew": true
    }
  }
}

---

GET /api/auth/me
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "roles": ["DOCTOR", "PATIENT"],
      "primaryRole": "DOCTOR",
      "profiles": { ... },
      "availableWorkspaces": [
        {
          "role": "DOCTOR",
          "label": "Doctor Workspace",
          "path": "/doctor/dashboard"
        },
        {
          "role": "PATIENT",
          "label": "Patient Portal",
          "path": "/patient/dashboard"
        }
      ]
    }
  }
}

---

POST /api/auth/switch-workspace
Headers: Authorization: Bearer <token>
Request:
{
  "role": "PATIENT"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-with-updated-role",
    "activeRole": "PATIENT",
    "workspace": "/patient/dashboard"
  }
}
```

**Role Management Endpoints**

```
POST /api/users/enroll-patient
Headers: Authorization: Bearer <token>
Description: Allow Doctor/Clinic Owner/etc to activate Patient profile

Response:
{
  "success": true,
  "data": {
    "role": "PATIENT",
    "profile": {
      "id": "uuid",
      "userId": "uuid",
      "profileCompleted": false
    }
  }
}

---

GET /api/users/:userId/roles
Headers: Authorization: Bearer <token>
Description: Get all roles for a user (Admin only)

Response:
{
  "success": true,
  "data": {
    "roles": ["DOCTOR", "PATIENT"],
    "profiles": {
      "doctor": { ... },
      "patient": { ... }
    }
  }
}
```

### Database Schema (Final)

```prisma
// Prisma Schema v2.0 (Multi-Role)

model User {
  id              String      @id @default(uuid())
  mobile          String      @unique
  email           String?     @unique
  name            String?
  
  // DEPRECATED (backward compatibility)
  role            UserRole    @default(PATIENT)
  passwordHash    String?     // TO BE REMOVED in Phase 4
  
  // Status & metadata
  approvalStatus  ApprovalStatus @default(VERIFIED)
  isActive        Boolean     @default(true)
  isPhoneVerified Boolean     @default(false)
  isEmailVerified Boolean     @default(false)
  authProvider    String?     @default("OTP")
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Multi-role relations
  roles           UserRole[]
  
  // Profile relations (1:1)
  patientProfile        PatientProfile?
  doctorProfile         DoctorProfile?
  receptionistProfile   ReceptionistProfile?
  clinicOwnerProfile    ClinicOwnerProfile?
  adminProfile          AdminProfile?
  
  // Other relations
  appointments          Appointment[]
  payments              Payment[]
  sessions              Session[]
  refreshTokens         RefreshToken[]
  
  @@map("users")
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  role      RoleEnum
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, role])
  @@index([userId])
  @@index([role])
  @@map("user_roles")
}

enum RoleEnum {
  PATIENT
  DOCTOR
  RECEPTIONIST
  CLINIC_OWNER
  ADMIN
}

// Existing UserRole enum kept for backward compatibility
enum UserRole {
  PATIENT
  CLINIC_OWNER
  DOCTOR
  RECEPTIONIST
  SUPER_ADMIN
}

model OtpVerification {
  id          String     @id @default(uuid())
  mobile      String
  purpose     OtpPurpose @default(LOGIN)
  otpHash     String
  expiresAt   DateTime
  attempts    Int        @default(0)
  maxAttempts Int        @default(5)
  isUsed      Boolean    @default(false)
  verifiedAt  DateTime?
  createdAt   DateTime   @default(now())
  
  @@index([mobile, purpose, createdAt])
  @@map("otp_verifications")
}
```

### JWT Payload Structure

```javascript
{
  userId: "uuid",
  role: "DOCTOR",  // Primary/active role
  roles: ["DOCTOR", "PATIENT"],  // All roles
  iat: 1691234567,
  exp: 1691235467
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Deliverables:**
- Database schema changes (`user_roles` table)
- Mobile number normalization utility
- `RoleService` implementation
- Unit tests for role management

### Phase 2: Backend OTP (Week 3-4)
**Deliverables:**
- Unified OTP send/verify handlers
- Updated authentication middleware
- Patient enrollment service
- API endpoint updates
- Integration tests

### Phase 3: Frontend Migration (Week 5-6)
**Deliverables:**
- Multi-role auth store
- OTP login UI (replace password forms)
- Workspace switcher component
- Role-based navigation
- E2E tests

### Phase 4: Password Deprecation (Week 7-8)
**Deliverables:**
- Password login disabled
- User migration notifications
- Documentation updates
- Support training

### Phase 5: Cleanup (Month 3+)
**Deliverables:**
- Remove `passwordHash` column
- Remove password-related tables
- Remove Firebase dependencies (if unused)
- Performance optimization

---

## Success Metrics

**Technical Metrics:**
- ✅ 100% of users can login via OTP
- ✅ Zero duplicate user accounts created
- ✅ <2s OTP delivery time (95th percentile)
- ✅ >99.5% OTP delivery success rate
- ✅ Multi-role users can switch workspaces seamlessly
- ✅ Zero unauthorized cross-role access

**Business Metrics:**
- ✅ Reduced support tickets for "forgot password"
- ✅ Increased user satisfaction (NPS survey)
- ✅ Faster login time (OTP vs password)
- ✅ Higher conversion rate (simpler signup)

---

## Rollback Plan

**If critical issues arise:**

1. **Immediate** (< 1 hour):
   - Revert frontend to show password login
   - Re-enable password login routes
   - Announce temporary password restoration

2. **Database Rollback** (if needed):
```sql
-- Restore from backup
pg_restore -d pulsemateconnect backup_20260812.dump

-- Or revert migrations
DROP TABLE user_roles;
-- users.role column still exists (backward compatible)
```

3. **Communication:**
   - Email all users about temporary rollback
   - Provide OTP alternative timeline
   - Collect feedback on issues encountered

---

## Appendix

### A. Message Central Integration

```javascript
// backend/src/services/messagecentral.service.js
const axios = require('axios');
const logger = require('../config/logger');

const MESSAGECENTRAL_API = 'https://cpaas.messagecentral.com/verification/v3/send';
const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const COUNTRY_CODE = '91';

const sendOtp = async (mobileNumber) => {
  try {
    const response = await axios.post(
      MESSAGECENTRAL_API,
      {
        countryCode: COUNTRY_CODE,
        mobileNumber: mobileNumber.replace('+91', ''),
        type: 'SMS',
      },
      {
        headers: {
          authToken: AUTH_TOKEN,
        },
      }
    );
    
    if (response.data.responseCode === 200) {
      return {
        success: true,
        verificationId: response.data.data.verificationId,
        // OTP is sent via SMS, not returned in API
      };
    }
    
    return {
      success: false,
      error: response.data.message || 'Failed to send OTP',
    };
  } catch (error) {
    logger.error('Message Central OTP error:', error);
    return {
      success: false,
      error: 'OTP service unavailable',
    };
  }
};

module.exports = { sendOtp };
```

### B. Environment Variables

```bash
# .env (Backend)

# OTP Configuration
ENABLE_TEST_OTP=true  # Set to false in production
MESSAGECENTRAL_AUTH_TOKEN=your_token_here

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Database
DATABASE_URL=postgresql://user:pass@host:5432/pulsemateconnect
DIRECT_URL=postgresql://user:pass@host:5432/pulsemateconnect

# App Configuration
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

---

## Conclusion

This design provides a comprehensive migration path from password-based single-role authentication to OTP-based multi-role unified identity system. The phased approach ensures minimal disruption while maintaining backward compatibility during transition.

**Key Benefits:**
- ✅ One mobile = one user (no duplicates)
- ✅ Multi-role support (Doctor can be Patient)
- ✅ Enhanced security (OTP-only, no password leaks)
- ✅ Better UX (faster login, workspace switching)
- ✅ Simplified auth flow (one OTP path for all roles)

**Next Steps:**
1. Review and approve this design
2. Create detailed task breakdown
3. Set up staging environment
4. Begin Phase 1 implementation
