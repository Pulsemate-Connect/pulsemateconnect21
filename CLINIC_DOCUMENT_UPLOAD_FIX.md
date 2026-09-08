# Clinic Document Upload Validation Fix

## 🎯 Problem
- User uploads a file (e.g., WhatsApp image for Clinic Registration Certificate)
- File appears to be uploaded (shows filename)
- Error message still shows: "Clinic Registration Certificate is required"
- Cannot proceed to next step

## 🔍 Root Cause
The validation schema wasn't properly handling File objects:
1. **Type checking issue**: Validation tested `value.size` and `value.type` without checking if `value` is actually a File object
2. **No validation trigger**: After uploading a file, validation wasn't re-triggered to clear the error
3. **Form state not updated**: File upload onChange wasn't triggering form validation

## ✅ Solution

### 1. Fixed File Validation Schema (`step3Schema.js`)
**Before:**
```javascript
const schema = yup.mixed().test('fileSize', 'File size must be less than 5MB', (value) => {
  if (!value) return !required;
  if (typeof value === 'string') return true;
  return value.size <= 5 * 1024 * 1024; // ❌ Fails if value is not a File
});
```

**After:**
```javascript
const schema = yup.mixed().test('fileSize', 'File size must be less than 5MB', (value) => {
  if (!value) return !required;
  if (typeof value === 'string') return true; // Already uploaded URL
  if (value instanceof File) {
    return value.size <= 5 * 1024 * 1024; // ✅ Only check if it's a File
  }
  return true; // If it's some other valid object, let it pass
});
```

### 2. Added Validation Trigger (`MandatoryDocumentsCard.jsx`)
**Before:**
```javascript
onChange={(file) => setValue('clinicRegistrationCertificate', file)}
```

**After:**
```javascript
onChange={(file) => {
  setValue('clinicRegistrationCertificate', file);
  // Trigger validation after setting value to clear error
  if (trigger) trigger('clinicRegistrationCertificate');
}}
```

### 3. Exposed Trigger Function (`Step3ClinicDocuments.jsx`)
```javascript
const {
  register,
  handleSubmit,
  watch,
  setValue,
  trigger, // ✅ Added trigger for manual validation
  formState: { errors, isSubmitting },
} = useForm({
  resolver: yupResolver(step3Schema),
  mode: 'onChange',
});
```

## 📝 Changes Made

### Files Modified
1. ✅ `frontend/src/utils/validation/step3Schema.js`
   - Added `instanceof File` check before accessing file properties
   - Added fallback to allow other valid objects

2. ✅ `frontend/src/pages/clinic/onboarding/components/sections/MandatoryDocumentsCard.jsx`
   - Added trigger function to props
   - Calls `trigger(fieldName)` after setValue to re-validate
   - Clears error message immediately after successful upload

3. ✅ `frontend/src/pages/clinic/onboarding/steps/Step3ClinicDocuments.jsx`
   - Extracted `trigger` from useForm
   - Passed trigger function to MandatoryDocumentsCard component

## 🧪 Testing

### Before Fix
1. Upload file → Shows filename ✅
2. Error message persists ❌
3. Cannot click Next button ❌

### After Fix
1. Upload file → Shows filename ✅
2. Error message clears immediately ✅
3. Can click Next button ✅

## 🚀 How to Test

1. Go to clinic onboarding step 3: `/clinic/onboarding/step-3`
2. Click "Clinic Registration Certificate" upload area
3. Select any valid image/PDF file
4. **Expected result**: 
   - File name appears
   - Green checkmark shows
   - Error message disappears
   - "Next" button becomes enabled

## 📌 Technical Details

### Why the Issue Happened
React Hook Form with Yup validation runs synchronously. When a file is uploaded:
1. File object is set in form state
2. Validation runs but might see an intermediate state
3. Error persists because validation wasn't re-triggered

### How the Fix Works
1. **File type safety**: Check `instanceof File` before accessing properties
2. **Manual validation trigger**: Call `trigger()` after setValue to force re-validation
3. **Immediate feedback**: Error clears as soon as file is valid

## 🎯 Impact
- ✅ File upload validation now works correctly
- ✅ Error messages clear immediately after successful upload  
- ✅ User can proceed to next step after uploading all required documents
- ✅ Better UX with instant feedback

## 🔧 Future Improvements
- Add loading indicator during file upload
- Show file preview for images
- Add progress bar for large file uploads
- Validate file content (not just extension)
