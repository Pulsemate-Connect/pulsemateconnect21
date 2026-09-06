# PulseMate Connect - Admin System Documentation

## Overview
PulseMate Connect has a hierarchical admin system with different permission levels to manage the platform.

## Current Admin Count
**Total Admins: 1**

### Current Admin Account:
- **Name**: Sahil Naik
- **Email**: sahilnaik1515@gmail.com
- **Mobile**: 9999999999
- **Level**: ROOT
- **Status**: Active
- **Created**: September 6, 2026

---

## Admin Levels

### 1. ROOT (Highest Level)
- **Full system access**
- Can create/delete other admins
- Can delete users permanently
- Can access database reset (dev only)
- Cannot be deleted
- **Permissions:**
  - Create/delete SUPER_ADMIN, SUPPORT, FINANCE admins
  - Hard delete users/doctors
  - All SUPER_ADMIN permissions
  - Database management

### 2. SUPER_ADMIN
- **Full operational access**
- Can approve/reject clinics and doctors
- Can manage users and suspensions
- **Permissions:**
  - Approve/reject clinics
  - Approve/reject doctors
  - Suspend/enable doctors
  - Request changes from clinics
  - View all users and statistics
  - Manage user statuses
  - Cancel deletion requests
  - View deletion queue

### 3. SUPPORT
- **Read-only + approval access**
- Can view and approve entities
- Cannot delete or modify critical settings
- **Permissions:**
  - View dashboard and statistics
  - View pending clinics/doctors
  - Approve/reject clinics/doctors
  - Request changes from clinics
  - View all clinics and doctors
  - View deletion requests

### 4. FINANCE
- **Financial reporting access**
- Can view revenue and payment data
- Read-only access to transactions
- **Permissions:**
  - View dashboard
  - View financial statistics
  - View users (read-only)
  - View clinic revenue
  - View booking metrics

---

## How to Add New Admins

### Method 1: Via API (Recommended for Production)

**Endpoint:** `POST /api/admin/admins`

**Authentication:** Must be logged in as **ROOT** admin

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "level": "SUPER_ADMIN"
}
```

**Valid Levels:**
- `SUPER_ADMIN`
- `SUPPORT`
- `FINANCE`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "role": "SUPER_ADMIN",
      "isActive": true,
      "approvalStatus": "VERIFIED",
      "adminProfile": {
        "level": "SUPER_ADMIN"
      }
    }
  },
  "message": "Admin account created successfully"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ROOT_ADMIN_TOKEN" \
  -d '{
    "fullName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "level": "SUPER_ADMIN"
  }'
```

### Method 2: Via Bootstrap Script (For Initial Setup Only)

**Use Case:** Creating the first admin or recovery scenarios

**Steps:**
1. Update `backend/.env`:
   ```env
   ADMIN_BOOTSTRAP_EMAIL=admin@example.com
   ADMIN_BOOTSTRAP_MOBILE=9999999999
   ADMIN_BOOTSTRAP_NAME=Admin Name
   ADMIN_BOOTSTRAP_LEVEL=ROOT
   ```

2. Run the script:
   ```bash
   cd backend
   node bootstrap-admin.js
   ```

3. Admin must set password via forgot-password flow

---

## How to Delete Admins

**Endpoint:** `DELETE /api/admin/admins/:id`

**Authentication:** Must be logged in as **ROOT** admin

**Restrictions:**
- Cannot delete your own account
- Cannot delete ROOT level admins
- Only ROOT admins can delete other admins

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/admin/admins/{admin-id} \
  -H "Authorization: Bearer YOUR_ROOT_ADMIN_TOKEN"
```

---

## Admin Dashboard Access

### Login
1. **Via Email/Password:**
   - Go to: `/admin` or `/login`
   - Enter email and password
   - Click "Login"

2. **Via Mobile OTP:**
   - Go to: `/login`
   - Enter mobile number
   - Enter OTP received
   - Auto-login

### Dashboard URL
- **Local:** http://localhost:3000/admin
- **Production:** https://your-domain.com/admin

---

## Admin API Endpoints

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:userId` - Permanently delete user (ROOT only)

### Clinic Management
- `GET /api/admin/pending-clinics` - List pending clinics
- `GET /api/admin/all-clinics` - List all clinics
- `GET /api/admin/all-clinics/:clinicId` - Get clinic details
- `PATCH /api/admin/clinics/:clinicId/approve` - Approve clinic
- `PATCH /api/admin/clinics/:clinicId/reject` - Reject clinic
- `PATCH /api/admin/clinics/:clinicId/request-changes` - Request changes
- `PATCH /api/admin/clinics/:clinicId/suspend` - Suspend clinic

### Doctor Management
- `GET /api/admin/pending-doctors` - List pending doctors
- `GET /api/admin/all-doctors` - List all doctors
- `GET /api/admin/doctors/:doctorId/verification` - Get verification details
- `PATCH /api/admin/doctors/:doctorId/approve` - Approve doctor
- `PATCH /api/admin/doctors/:doctorId/reject` - Reject doctor
- `PATCH /api/admin/doctors/:doctorId/disable` - Soft delete doctor
- `PATCH /api/admin/doctors/:doctorId/enable` - Re-enable doctor
- `DELETE /api/admin/doctors/:doctorId` - Permanently delete doctor (ROOT only)

### Admin Management
- `POST /api/admin/admins` - Create new admin (ROOT only)
- `DELETE /api/admin/admins/:id` - Delete admin (ROOT only)

### Dashboard & Stats
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/all-clinics/stats` - Clinic statistics

### Account Deletion Queue
- `GET /api/admin/deletion-requests` - View deletion queue
- `PATCH /api/admin/deletion-requests/:id/cancel` - Cancel deletion

---

## Security Features

### Access Control
- All admin routes require authentication via JWT
- Role-based access control (RBAC)
- Admin level validation on sensitive operations
- Audit logging for all admin actions

### Password Security
- Passwords hashed with bcrypt (12 rounds)
- Bootstrap script creates admins without storing passwords
- Password reset via secure email flow
- No plaintext password logging

### Audit Trail
- All admin actions are logged
- Logs include: userId, action, entityType, entityId, timestamp, IP address
- Stored in `audit_logs` table

---

## Database Schema

### User Table (admins have role: SUPER_ADMIN)
```sql
role: SUPER_ADMIN
roles: ['SUPER_ADMIN']
primaryRole: SUPER_ADMIN
approvalStatus: VERIFIED
isActive: true
```

### AdminProfile Table
```sql
id: uuid
userId: uuid (FK to users)
level: AdminLevel (ROOT | SUPER_ADMIN | SUPPORT | FINANCE)
createdById: uuid (who created this admin)
createdAt: timestamp
updatedAt: timestamp
```

---

## Best Practices

### 1. Admin Creation
- Always use strong passwords
- Use work email addresses
- Set appropriate admin level based on responsibilities
- Document who created which admin

### 2. Admin Deletion
- Review admin activity before deletion
- Ensure replacement admin exists for critical roles
- Cannot delete ROOT admins for safety

### 3. Security
- Never share admin credentials
- Use password reset if password compromised
- Review audit logs regularly
- Limit ROOT access to trusted personnel

### 4. Operations
- Test admin permissions in staging first
- Document admin role assignments
- Regular security audits
- Keep admin count minimal

---

## Troubleshooting

### Can't Login as Admin
1. Verify email/password is correct
2. Check user has `role: SUPER_ADMIN`
3. Check `isActive: true`
4. Check `approvalStatus: VERIFIED`
5. Check adminProfile exists

### Can't Create Admin
- Only ROOT admins can create admins
- Check JWT token is valid
- Verify email/phone not already exists
- Ensure admin level is valid

### Permission Denied
- Check your admin level
- ROOT: full access
- SUPER_ADMIN: operational access
- SUPPORT: read + approval access
- FINANCE: read-only + financial data

---

## Contact & Support

For admin account issues:
1. Contact ROOT admin: sahilnaik1515@gmail.com
2. Database access required for recovery
3. Check audit logs for activity tracking

---

**Last Updated:** September 6, 2026
**System Version:** v1.0
**Database:** Supabase PostgreSQL
