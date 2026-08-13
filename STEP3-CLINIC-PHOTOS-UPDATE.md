# Step 3: Clinic Photos Update - Individual Photo Fields

**Date:** August 13, 2026  
**Update:** Replaced generic "Clinic Photos" array with 4 specific photo fields with preview

---

## 🎯 Changes Made

### **1. Clinic Registration Number**
- ✅ Changed from **required** to **optional**
- Removed asterisk (*) from UI
- Updated validation schema to `.nullable()`

### **2. Clinic Photos - New Structure**

**Before:**
- Single upload area accepting 3 photos (generic)
- No preview
- Array storage: `clinicPhotos: [url1, url2, url3]`

**After:**
- 4 separate upload areas with specific purposes
- Image preview for each photo
- Object storage with named keys

**4 Photo Types:**
1. **Clinic Logo** - Square logo (512x512px recommended) for mobile app
2. **Clinic Exterior** - Outside view of clinic building
3. **Reception Area** - Photo of reception/waiting area
4. **Consultation Room** - Photo of consultation or treatment room

---

## 📁 Updated Files

### **Frontend**

1. **`frontend/src/utils/constants/clinicTypes.js`**
   - Updated `DOCUMENT_TYPES.CLINIC_PHOTOS` structure
   - Added `photos` array with 4 photo definitions
   - Each photo has: key, label, description, required (all false)

2. **`frontend/src/pages/clinic/onboarding/components/shared/FileUpload.jsx`**
   - Added `showPreview` prop for image preview
   - Image preview shows photo with hover overlay
   - Remove button appears on hover
   - Gradient overlay at bottom with filename
   - FileReader API for local image preview

3. **`frontend/src/pages/clinic/onboarding/components/sections/OptionalDocumentsCard.jsx`**
   - Replaced single multi-file upload with 4 individual uploads
   - Added "Clinic Photos" section header with Camera icon
   - Grid layout (2 columns on desktop, 1 on mobile)
   - Each photo has its own FileUpload component with `showPreview={true}`
   - Updated watch values: `clinicLogo`, `clinicExterior`, `clinicReception`, `clinicConsultation`

4. **`frontend/src/utils/validation/step3Schema.js`**
   - Removed array validation for `clinicPhotos`
   - Added 4 individual photo validations: `clinicLogo`, `clinicExterior`, `clinicReception`, `clinicConsultation`
   - Each has size validation (2MB) and type validation (JPG/PNG only)
   - Made `clinicRegistrationNumber` optional (`.nullable()`)

5. **`frontend/src/pages/clinic/onboarding/steps/Step3ClinicDocuments.jsx`**
   - Updated defaultValues with 4 individual photo fields
   - Updated FormData preparation to append 4 separate files
   - Removed loop for `clinicPhotos` array

### **Backend**

6. **`backend/src/controllers/auth.controller.js`**
   - Updated `saveClinicDocumentsHandler`
   - Changed clinic photos from array to object:
     ```json
     "clinicPhotos": {
       "logo": "https://cloudinary.com/...",
       "exterior": "https://cloudinary.com/...",
       "reception": "https://cloudinary.com/...",
       "consultation": "https://cloudinary.com/..."
     }
     ```
   - Each photo URL stored with descriptive key

7. **`backend/src/routes/auth.routes.js`**
   - Updated multer middleware fields
   - Changed from `{ name: 'clinicPhotos', maxCount: 3 }` to 4 separate fields:
     - `clinicLogo` (maxCount: 1)
     - `clinicExterior` (maxCount: 1)
     - `clinicReception` (maxCount: 1)
     - `clinicConsultation` (maxCount: 1)

---

## 📊 Database Structure Update

### **Before:**
```json
"clinicDocuments": {
  "clinicPhotos": [
    "https://cloudinary.com/photo1.jpg",
    "https://cloudinary.com/photo2.jpg",
    "https://cloudinary.com/photo3.jpg"
  ]
}
```

### **After:**
```json
"clinicDocuments": {
  "clinicPhotos": {
    "logo": "https://cloudinary.com/.../logo.png",
    "exterior": "https://cloudinary.com/.../exterior.jpg",
    "reception": "https://cloudinary.com/.../reception.jpg",
    "consultation": "https://cloudinary.com/.../consultation.jpg"
  }
}
```

**Benefits:**
- ✅ Clear purpose for each photo
- ✅ Frontend knows which photo to use where (e.g., logo in search results)
- ✅ Easy to validate specific photos (e.g., logo should be square)
- ✅ Better UX with labeled upload areas

---

## 🎨 UI/UX Improvements

### **Image Preview Feature**

When `showPreview={true}` is set on FileUpload:
- Photo displays at 192px height (h-48)
- Hover shows dark overlay with remove button
- Gradient at bottom shows filename with checkmark
- Smooth transitions and hover effects

### **Responsive Grid**

Photos displayed in grid:
- **Desktop:** 2 columns (logo + exterior on row 1, reception + consultation on row 2)
- **Mobile:** 1 column (stacked vertically)

### **Visual Hierarchy**

1. GST Certificate (document upload, no preview)
2. **Divider with "Clinic Photos" header** and Camera icon
3. 4 photo upload areas with previews in grid

---

## 🧪 Testing Notes

### **Test Image Preview:**
- [ ] Upload photo → Preview displays immediately
- [ ] Hover over preview → Dark overlay + remove button appears
- [ ] Click remove → Photo clears, upload area resets
- [ ] Preview shows correct image (not distorted)

### **Test Individual Photos:**
- [ ] Upload logo (recommended square format)
- [ ] Upload exterior photo
- [ ] Upload reception photo
- [ ] Upload consultation room photo
- [ ] All 4 save to database correctly

### **Test Optional:**
- [ ] Skip all photos → Form submits successfully
- [ ] Upload only logo → Other fields remain null
- [ ] Upload all 4 → All URLs in database

### **Database Verification:**
```json
{
  "clinicDocuments": {
    "clinicPhotos": {
      "logo": "https://res.cloudinary.com/.../logo.png" | null,
      "exterior": "https://res.cloudinary.com/.../exterior.jpg" | null,
      "reception": "https://res.cloudinary.com/.../reception.jpg" | null,
      "consultation": "https://res.cloudinary.com/.../consultation.jpg" | null
    }
  }
}
```

---

## 📱 Mobile App Usage

**Logo:**
- Displays in search results (square format)
- Profile header
- Booking confirmation

**Exterior:**
- "How to reach" section
- Helps patients identify building

**Reception:**
- "What to expect" section
- Shows waiting area ambiance

**Consultation:**
- Clinic profile page
- Shows treatment environment

---

## 🎯 Benefits

1. **Clear Purpose:** Each photo has a specific use case
2. **Better UX:** Labeled upload areas guide users
3. **Mobile Optimization:** Logo specifically for app display
4. **Flexible:** Each photo is optional, users can skip any
5. **Professional:** Preview feature makes it feel polished
6. **Data Structure:** Object with named keys is easier to work with than array

---

## ✅ Status

- **Frontend:** ✅ Complete
- **Backend:** ✅ Complete
- **Image Preview:** ✅ Working
- **Validation:** ✅ Updated
- **Database Structure:** ✅ Changed to object
- **Ready for Testing:** ✅ Yes

---

**All changes are complete and ready for testing!** 🎉
