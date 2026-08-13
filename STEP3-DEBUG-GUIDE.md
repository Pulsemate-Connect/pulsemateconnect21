# 🐛 Step 3 "Failed to fetch" Debug Guide

**Issue:** Clicking "Next" on Step 3 shows "Failed to fetch" and doesn't move to Step 4

---

## 🔍 Quick Diagnosis Steps

### **1. Check if Servers are Running**

✅ **Backend:** Running on http://localhost:5000  
✅ **Frontend:** Running on http://localhost:3001  

### **2. Check Browser Console**

1. Open Step 3: `http://localhost:3001/clinic/onboarding/step-3`
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Click "Next" button
5. Look for errors (usually in red)

**Common errors:**
- `Failed to fetch` - Backend not running or CORS issue
- `Network error` - API endpoint not found
- `404 Not Found` - Route doesn't exist
- `500 Internal Server Error` - Backend handler error

### **3. Check Network Tab**

1. In DevTools, go to **Network** tab
2. Click "Next" button
3. Look for the request to `/api/auth/clinic-owner/save-clinic-documents`
4. Click on it to see details

**What to check:**
- **Status Code:** Should be 200 (success)
- **Request URL:** Should be `http://localhost:5000/api/auth/clinic-owner/save-clinic-documents`
- **Request Method:** Should be `POST`
- **Response:** Check the response body for error messages

---

## 🔧 Common Issues & Fixes

### **Issue 1: Backend Not Running**

**Error:** `Failed to fetch` or `ERR_CONNECTION_REFUSED`

**Fix:**
```bash
cd backend
npm run dev
```

### **Issue 2: Frontend on Wrong Port**

**Symptom:** Frontend URL is `http://localhost:3001` but backend expects `3000`

**Fix:** Update backend CORS config or use correct frontend port

**Check `backend/.env`:**
```env
FRONTEND_URL=http://localhost:3001
```

### **Issue 3: Steps 1 & 2 Not Completed**

**Error:** `No user found. Please complete previous steps first.`

**Fix:** You must complete Steps 1 and 2 first before Step 3

**To start fresh:**
1. Go to Step 1: `http://localhost:3001/clinic/onboarding/step-1`
2. Fill all required fields
3. Click "Next" → Goes to Step 2
4. Fill all required fields
5. Click "Next" → Goes to Step 3
6. Now try uploading documents

### **Issue 4: No Files Uploaded**

**Error:** Form validation fails or nothing happens

**Reason:** Step 3 requires at least 3 mandatory documents:
- Clinic Registration Certificate (required)
- Medical License (required)
- Owner ID Proof (required)

**Fix:** Upload all 3 required documents before clicking "Next"

### **Issue 5: File Size Too Large**

**Error:** `File too large` or upload fails silently

**Fix:** Each file must be **less than 8MB**

**Supported formats:**
- PDF
- JPG/JPEG
- PNG
- WEBP

### **Issue 6: Database User Not Found**

**Error in backend logs:** `No user found. Please complete previous steps first.`

**Reason:** The handler looks for the most recent user with onboarding data

**Fix:** Make sure you completed Step 1 which creates the user in database

**Verify in database:**
```sql
SELECT id, mobile, email, clinicOnboardingData 
FROM "User" 
WHERE role = 'CLINIC_OWNER'
ORDER BY updatedAt DESC
LIMIT 1;
```

### **Issue 7: Cloudinary Not Configured**

**Symptom:** Files uploaded but URLs are null

**Check backend logs:**
```
[upload] Storage: 💾 Local disk (ephemeral — dev only)
```

**This is OK for development!** Files will be stored locally in `backend/uploads/clinic-owner/`

**To use Cloudinary (optional):**
Add to `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🧪 Manual Test

### **Test 1: Check Backend API Directly**

Open PowerShell and test:

```powershell
# Create a test file
echo "test" > test.txt

# Test the endpoint (requires curl or Invoke-WebRequest)
$uri = "http://localhost:5000/api/auth/clinic-owner/save-clinic-documents"
$form = @{
    clinicRegistrationCertificate = Get-Item -Path test.txt
    medicalLicense = Get-Item -Path test.txt
    ownerIdProof = Get-Item -Path test.txt
}
Invoke-WebRequest -Uri $uri -Method Post -Form $form
```

### **Test 2: Check if User Exists**

Open Prisma Studio:
```bash
cd backend
npx prisma studio
```

1. Open `User` table
2. Look for user with `role = "CLINIC_OWNER"`
3. Check if `clinicOnboardingData` has `clinicInformation` and `servicesOperations`
4. If not, you need to complete Steps 1 & 2 first

---

## 📝 Step-by-Step Complete Test

### **Fresh Start Test:**

1. **Clear localStorage:**
   - Open DevTools → Application tab → Local Storage
   - Clear all `clinic_onboarding_*` keys

2. **Start from Step 1:**
   ```
   http://localhost:3001/clinic/onboarding/step-1
   ```

3. **Fill Step 1:**
   - Clinic Name: "Test Clinic"
   - Clinic Type: Select any
   - Display Name: "Test Display"
   - Owner Name: "John Doe"
   - Owner Email: [your-email]
   - Owner Mobile: 9999999999
   - Primary Contact: 9999999999
   - Click on map
   - Fill address fields
   - Click "Next"

4. **Fill Step 2:**
   - Check at least one Specialty
   - Check at least one Consultation Type
   - Select Opening Time: 9:00 AM
   - Select Closing Time: 6:00 PM
   - Check at least one Weekly Off Day
   - Select Appointment Mode
   - Click "Next"

5. **Fill Step 3:**
   - Upload Clinic Registration Certificate (PDF/Image, < 8MB)
   - Upload Medical License (PDF/Image, < 8MB)
   - Upload Owner ID Proof (PDF/Image, < 8MB)
   - (Optional) Upload other documents
   - Click "Next"

6. **Expected Result:**
   - Loading overlay appears
   - Backend processes files
   - Success toast appears
   - Navigate to Step 4

---

## 🔍 Backend Logs to Check

When you click "Next", check backend terminal for:

**Success looks like:**
```
2026-08-13 10:53:45 [info]: [Onboarding] Clinic Documents saved for user 123
```

**Error looks like:**
```
2026-08-13 10:53:45 [error]: [Onboarding] Save Step 3 error: Error message here
```

---

## 🆘 Still Not Working?

### **Get Detailed Error:**

1. **Check exact error in browser console:**
   - Open DevTools → Console
   - Look for error message in red

2. **Check backend terminal:**
   - Look for error logs
   - Copy the full error message

3. **Check Network tab:**
   - Status code
   - Response body
   - Request payload

### **Provide This Info:**

1. Browser console error (screenshot or text)
2. Backend terminal error (if any)
3. Network tab status code
4. Which step you're on
5. Have you completed Steps 1 & 2?

---

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 3001
- [ ] Browser console shows no errors
- [ ] You completed Step 1 (saved to database)
- [ ] You completed Step 2 (saved to database)
- [ ] You uploaded all 3 required documents
- [ ] Each file is less than 8MB
- [ ] Files are PDF, JPG, PNG, or WEBP format
- [ ] Backend terminal shows no errors

---

## 🎯 Expected Flow

```
User clicks "Next" on Step 3
    ↓
Frontend creates FormData with files
    ↓
POST /api/auth/clinic-owner/save-clinic-documents
    ↓
Backend receives files via Multer
    ↓
Files upload to local disk (dev) or Cloudinary (prod)
    ↓
Backend gets URLs for each file
    ↓
Backend finds user (most recent with onboarding data)
    ↓
Backend saves URLs to database (User.clinicOnboardingData)
    ↓
Backend returns success response
    ↓
Frontend clears localStorage
    ↓
Frontend shows success toast
    ↓
Frontend navigates to Step 4
```

---

## 📞 Need More Help?

1. Open browser DevTools (F12)
2. Go to Console tab
3. Take a screenshot of any errors
4. Go to Network tab
5. Click "Next" button
6. Find the `/save-clinic-documents` request
7. Take screenshot of the response

Send these screenshots for faster debugging!

---

**Last Updated:** August 13, 2026
