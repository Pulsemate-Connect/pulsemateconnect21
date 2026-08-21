# Test Clinic - Ready for Admin Verification

## Created: August 15, 2026, 10:41 PM IST

---

## 🏥 Clinic Information

**Clinic Name:** Test Medical Clinic  
**Status:** PENDING (Ready for admin verification)  
**Location:** Bangalore, Karnataka  
**Address:** 123 Test Street, Medical District, Near Test Hospital  
**Pincode:** 560001  

**Registration Number:** TEST-REG-2024-001  
**Phone:** +919876543211  

**Specialties:**
- General Medicine
- Pediatrics

**Facilities:**
- Consultation Room
- Pharmacy

**Languages:** English, Hindi, Kannada  
**Consultation Modes:** Offline, Online  
**Payment Methods:** Cash, UPI, Card  

**Operating Hours:** 09:00 AM - 06:00 PM

---

## 👤 Clinic Owner Credentials

**Name:** Test Clinic Owner  
**Email:** testclinic@gmail.com  
**Password:** `TestClinic@123`  
**Mobile:** +919876543210  

**Account Status:**
- ✅ Email Verified (via OTP)
- ✅ Mobile Verified (via OTP)
- ⏳ Awaiting Admin Approval

---

## 🔐 Admin Verification Steps

### Step 1: Login as Admin
- **URL:** http://localhost:3000/admin
- **Credentials:** 
  - Email: shubham27052002@gmail.com or sahilnaik1515@gmail.com
  - Password: `Shubham27*` or `Nkabu18$`

### Step 2: Navigate to Clinic Verifications
Look for:
- "Pending Clinics" or
- "Clinic Verifications" or
- "Approvals" menu

### Step 3: Find the Test Clinic
- **Search for:** "Test Medical Clinic"
- **Owner:** testclinic@gmail.com
- **Status:** PENDING

### Step 4: Review Clinic Details
Check:
- Clinic name and address
- Owner information
- Registration documents
- Verification status (email ✅ mobile ✅)

### Step 5: Approve or Reject
- **Approve:** Changes status to VERIFIED
- **Reject:** Provide reason for rejection
- **Request Changes:** Ask for specific updates

---

## 📊 Database Information

**User ID:** ba976af8-e47d-4e47-b761-bb6c94af4a96  
**Owner Profile ID:** 608d4331-81a3-4df1-8588-6284cabcddfd  
**Clinic ID:** b3a00ab4-b993-48a1-a87b-08b5ff305889  

**Created:** 2026-08-15T17:11:31.650Z  
**Submitted:** 2026-08-15T17:11:31.650Z  

---

## ✅ Verification Checklist

- [x] User account created
- [x] Email verified (isEmailVerified: true)
- [x] Mobile verified (isPhoneVerified: true)
- [x] Clinic owner profile created
- [x] Clinic created with all details
- [x] Clinic status set to PENDING
- [x] Submission timestamp recorded
- [ ] Admin verification (pending)
- [ ] Clinic status changed to VERIFIED (after admin approval)

---

## 🧪 Testing Scenarios

### Scenario 1: Approve Clinic
1. Login as admin
2. Navigate to pending clinics
3. Find "Test Medical Clinic"
4. Review details
5. Click "Approve"
6. Verify status changes to VERIFIED
7. Owner should be able to login and access dashboard

### Scenario 2: Reject Clinic
1. Login as admin
2. Find the clinic
3. Click "Reject"
4. Enter reason: "Missing documents" or "Invalid address"
5. Verify status changes to REJECTED
6. Owner should see rejection reason

### Scenario 3: Request Changes
1. Login as admin
2. Find the clinic
3. Click "Request Changes"
4. Specify what needs to be updated
5. Verify status changes to CHANGES_REQUIRED
6. Owner can edit and resubmit

---

## 🔄 Owner Actions After Verification

### If Approved:
- Login at: http://localhost:3000/owner
- Access dashboard
- Add doctors/receptionists
- Manage appointments
- View analytics

### If Rejected:
- Login shows rejection reason
- Cannot access full dashboard
- Must contact admin or create new clinic

### If Changes Required:
- Login shows change request
- Can edit clinic details
- Resubmit for verification

---

## 📱 Test OTP Information

For development/testing:

**Test Mobile Numbers:**
- 9999999999
- 8888888888  
- 7777777777

**Test OTP:** 123456

**Test Emails:**
- test@gmail.com
- testclinic@gmail.com

**Email OTP:** 123456 (in development mode)

---

## 🔧 Troubleshooting

### Can't Find Clinic in Admin Dashboard?
- Check if user is logged in as admin
- Verify clinic status is PENDING
- Check database: `SELECT * FROM clinics WHERE id = 'b3a00ab4-b993-48a1-a87b-08b5ff305889'`

### Approval Not Working?
- Check backend logs for errors
- Verify admin has SUPER_ADMIN role
- Check database foreign keys and constraints

### Owner Can't Login After Approval?
- Verify clinic approvalStatus is VERIFIED
- Check user approvalStatus is VERIFIED
- Clear browser cache and try again

---

## 📝 SQL Queries (For Debugging)

### Check Clinic Status
```sql
SELECT c.name, c.approvalStatus, c.isVerified, u.email, u.approvalStatus as userStatus
FROM clinics c
JOIN users u ON c.ownerId = u.id
WHERE c.id = 'b3a00ab4-b993-48a1-a87b-08b5ff305889';
```

### Manually Approve Clinic (Emergency)
```sql
UPDATE clinics SET approvalStatus = 'VERIFIED', isVerified = true, verifiedAt = NOW() WHERE id = 'b3a00ab4-b993-48a1-a87b-08b5ff305889';
UPDATE users SET approvalStatus = 'VERIFIED' WHERE id = 'ba976af8-e47d-4e47-b761-bb6c94af4a96';
```

### Check All Pending Clinics
```sql
SELECT c.id, c.name, c.city, u.email, c.approvalStatus, c.submittedAt
FROM clinics c
JOIN users u ON c.ownerId = u.id
WHERE c.approvalStatus = 'PENDING'
ORDER BY c.submittedAt DESC;
```

---

## ✅ Success Criteria

After admin approval, verify:
- [x] Clinic approvalStatus = VERIFIED
- [x] Clinic isVerified = true
- [x] User approvalStatus = VERIFIED
- [x] verifiedAt timestamp set
- [x] Owner can login successfully
- [x] Owner sees dashboard (not rejection message)

---

**Status:** ✅ Test clinic created and ready for admin verification  
**Next Action:** Login as admin and verify the clinic  
**Script:** `backend/create-test-clinic-complete.js`
