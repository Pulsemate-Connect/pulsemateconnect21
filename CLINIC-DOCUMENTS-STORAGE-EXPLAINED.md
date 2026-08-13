# 📄 Clinic Documents Storage - Complete Explanation

**Last Updated:** August 13, 2026

---

## 🎯 Overview

Clinic documents are stored in the **User table** in a **JSON field** called `clinicOnboardingData`. Within this JSON, there's a `clinicDocuments` object that contains all document URLs and related information.

---

## 📊 Database Schema

### **User Table (Prisma Schema)**

```prisma
model User {
  id                    Int       @id @default(autoincrement())
  name                  String?
  email                 String    @unique
  mobile                String    @unique
  role                  Role
  approvalStatus        ApprovalStatus @default(PENDING)
  isPhoneVerified       Boolean   @default(false)
  isEmailVerified       Boolean   @default(false)
  
  // 👇 THIS IS WHERE ALL CLINIC DOCUMENTS ARE STORED
  clinicOnboardingData  Json?     // <-- JSON field containing all onboarding data
  
  // ... other fields
}
```

---

## 📦 Storage Structure

### **Complete JSON Structure in `clinicOnboardingData`**

```json
{
  "clinicInformation": { 
    /* Step 1 data - 20 fields */ 
  },
  "servicesOperations": { 
    /* Step 2 data - 7 fields */ 
  },
  "clinicDocuments": {
    // 👇 DOCUMENT URLs (uploaded files)
    "clinicRegistrationCertificate": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/abc123.pdf",
    "medicalLicense": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/def456.pdf",
    "ownerIdProof": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/ghi789.jpg",
    "gstCertificate": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/jkl012.pdf",
    
    // 👇 CLINIC PHOTOS (object with named keys)
    "clinicPhotos": {
      "logo": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/logo_mno345.jpg",
      "exterior": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/exterior_pqr678.jpg",
      "reception": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/reception_stu901.jpg",
      "consultation": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/consult_vwx234.jpg"
    },
    
    // 👇 ADDITIONAL TEXT INFORMATION (optional)
    "clinicRegistrationNumber": "REG/2026/ABC/123456",
    "gstNumber": "27AABCU9603R1ZM",
    
    // 👇 METADATA
    "completedAt": "2026-08-13T11:00:00.000Z"
  },
  "partnerAgreement": { 
    /* Step 4 data */ 
  },
  "lastUpdatedStep": "clinicDocuments",
  "lastUpdatedAt": "2026-08-13T11:00:00.000Z"
}
```

---

## 🔄 How It Works: Step-by-Step

### **1. User Uploads Files (Frontend)**

```javascript
// Step3ClinicDocuments.jsx
const handleSubmit = async (formData) => {
  // FormData contains:
  // - clinicRegistrationCertificate: File
  // - medicalLicense: File
  // - ownerIdProof: File
  // - gstCertificate: File (optional)
  // - clinicLogo: File (optional)
  // - clinicExterior: File (optional)
  // - clinicReception: File (optional)
  // - clinicConsultation: File (optional)
  // - clinicRegistrationNumber: String (optional)
  // - gstNumber: String (optional)
  
  const response = await fetch('/api/auth/clinic-owner/save-clinic-documents', {
    method: 'POST',
    body: formData, // Sent as multipart/form-data
  });
};
```

---

### **2. Backend Receives Files (Multer Middleware)**

```javascript
// auth.routes.js
router.post('/clinic-owner/save-clinic-documents', 
  clinicOwnerUpload.fields([
    { name: 'clinicRegistrationCertificate', maxCount: 1 },
    { name: 'medicalLicense', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'clinicLogo', maxCount: 1 },
    { name: 'clinicExterior', maxCount: 1 },
    { name: 'clinicReception', maxCount: 1 },
    { name: 'clinicConsultation', maxCount: 1 },
  ]),
  saveClinicDocumentsHandler
);
```

**Multer automatically handles:**
- ✅ File upload to Cloudinary (production) OR local disk (development)
- ✅ File validation (type, size)
- ✅ Secure filename generation
- ✅ Returns file object with URL/path

---

### **3. Files are Uploaded to Cloud Storage**

#### **Option A: Cloudinary (Production)**

```javascript
// Multer-storage-cloudinary config
const cloudinaryStorage = CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clinic-owner',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});
```

**Result:**
```
File uploaded to: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/unique-filename.pdf
```

#### **Option B: Local Disk (Development)**

```javascript
// Multer disk storage config
const diskStorage = multer.diskStorage({
  destination: 'uploads/clinic-owner/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
```

**Result:**
```
File saved to: uploads/clinic-owner/1723567890-certificate.pdf
URL: http://localhost:5000/uploads/clinic-owner/1723567890-certificate.pdf
```

---

### **4. Controller Processes Files and Saves to Database**

```javascript
// auth.controller.js - saveClinicDocumentsHandler

const getFileUrl = (file) => {
  if (!file) return null;
  // Cloudinary provides secure_url or url
  if (file.path && file.path.startsWith('http')) {
    return file.path; // Cloudinary URL
  }
  // Local storage path
  return file.path || null;
};

// Extract URLs from uploaded files
const clinicPhotos = {
  logo: getFileUrl(files.clinicLogo?.[0]),
  exterior: getFileUrl(files.clinicExterior?.[0]),
  reception: getFileUrl(files.clinicReception?.[0]),
  consultation: getFileUrl(files.clinicConsultation?.[0]),
};

const clinicDocumentsData = {
  // Document URLs (required - except GST)
  clinicRegistrationCertificate: getFileUrl(files.clinicRegistrationCertificate?.[0]),
  medicalLicense: getFileUrl(files.medicalLicense?.[0]),
  ownerIdProof: getFileUrl(files.ownerIdProof?.[0]),
  gstCertificate: getFileUrl(files.gstCertificate?.[0]), // optional
  
  // Clinic photos object (all optional)
  clinicPhotos: clinicPhotos,
  
  // Text fields (optional)
  clinicRegistrationNumber: req.body.clinicRegistrationNumber || null,
  gstNumber: req.body.gstNumber || null,
  
  // Metadata
  completedAt: new Date(),
};

// Save to database
await prisma.user.update({
  where: { id: user.id },
  data: {
    clinicOnboardingData: {
      ...user.clinicOnboardingData,
      clinicDocuments: clinicDocumentsData, // 👈 Saved as JSON
      lastUpdatedStep: 'clinicDocuments',
      lastUpdatedAt: new Date(),
    },
  },
});
```

---

## 💾 Actual Database Storage

### **PostgreSQL Table View**

```sql
-- User table after Step 3 completion

SELECT 
  id,
  name,
  email,
  mobile,
  role,
  approvalStatus,
  clinicOnboardingData
FROM "User"
WHERE mobile = '9999999999';
```

**Result:**

| id  | name | email | mobile | role | approvalStatus | clinicOnboardingData |
|-----|------|-------|--------|------|----------------|----------------------|
| 123 | John Doe | john@ex... | 9999999999 | CLINIC_OWNER | PENDING | `{...JSON...}` ⬇️ |

**Expanded `clinicOnboardingData` JSON:**

```json
{
  "clinicInformation": {
    "clinicName": "ABC Clinic",
    "clinicType": "Multi-Specialty Hospital",
    "displayName": "ABC Multi-Specialty",
    "ownerName": "John Doe",
    "ownerEmail": "john@example.com",
    "ownerMobile": "9999999999",
    "primaryContactPhone": "9999999999",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "addressLine1": "123 Main Street",
    "addressLine2": "Near Central Park",
    "locality": "Downtown",
    "landmark": "Opposite City Mall",
    "city": "New Delhi",
    "state": "Delhi",
    "pincode": "110001",
    "country": "India",
    "completedAt": "2026-08-13T10:30:00.000Z"
  },
  "servicesOperations": {
    "specialties": ["General Medicine", "Pediatrics", "Cardiology"],
    "specialtyOther": null,
    "consultationTypes": ["IN_PERSON", "VIDEO_CALL"],
    "openingTime": "9:00 AM",
    "closingTime": "6:00 PM",
    "weeklyOffDays": ["Sunday"],
    "appointmentMode": "BOTH",
    "completedAt": "2026-08-13T10:45:00.000Z"
  },
  "clinicDocuments": {
    "clinicRegistrationCertificate": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567890/clinic-owner/reg-cert-1723567890.pdf",
    "medicalLicense": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567895/clinic-owner/med-license-1723567895.pdf",
    "ownerIdProof": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567900/clinic-owner/owner-id-1723567900.jpg",
    "gstCertificate": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567905/clinic-owner/gst-cert-1723567905.pdf",
    "clinicPhotos": {
      "logo": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567910/clinic-owner/logo-1723567910.jpg",
      "exterior": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567915/clinic-owner/exterior-1723567915.jpg",
      "reception": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567920/clinic-owner/reception-1723567920.jpg",
      "consultation": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567925/clinic-owner/consultation-1723567925.jpg"
    },
    "clinicRegistrationNumber": "REG/2026/DL/ABC/123456",
    "gstNumber": "07AABCU9603R1ZM",
    "completedAt": "2026-08-13T11:00:00.000Z"
  },
  "partnerAgreement": {
    "termsAccepted": true,
    "termsAcceptedAt": "2026-08-13T11:15:00.000Z",
    "submittedAt": "2026-08-13T11:15:00.000Z",
    "completedAt": "2026-08-13T11:15:00.000Z"
  },
  "lastUpdatedStep": "partnerAgreement",
  "lastUpdatedAt": "2026-08-13T11:15:00.000Z",
  "onboardingComplete": true,
  "submittedAt": "2026-08-13T11:15:00.000Z"
}
```

---

## 🔍 How to Query Documents

### **1. Get All Documents for a User**

```javascript
// Get user with all onboarding data
const user = await prisma.user.findUnique({
  where: { id: 123 },
  select: {
    id: true,
    name: true,
    email: true,
    clinicOnboardingData: true,
  },
});

// Access documents
const documents = user.clinicOnboardingData?.clinicDocuments;

console.log('Registration Certificate:', documents.clinicRegistrationCertificate);
console.log('Medical License:', documents.medicalLicense);
console.log('Owner ID:', documents.ownerIdProof);
console.log('GST Certificate:', documents.gstCertificate);
console.log('Clinic Logo:', documents.clinicPhotos.logo);
console.log('Registration Number:', documents.clinicRegistrationNumber);
```

### **2. Get Only Document URLs**

```javascript
const user = await prisma.user.findUnique({
  where: { id: 123 },
  select: {
    clinicOnboardingData: true,
  },
});

const docs = user.clinicOnboardingData?.clinicDocuments || {};

const documentUrls = {
  registration: docs.clinicRegistrationCertificate,
  license: docs.medicalLicense,
  idProof: docs.ownerIdProof,
  gst: docs.gstCertificate,
  photos: {
    logo: docs.clinicPhotos?.logo,
    exterior: docs.clinicPhotos?.exterior,
    reception: docs.clinicPhotos?.reception,
    consultation: docs.clinicPhotos?.consultation,
  },
};
```

### **3. SQL Query (Raw)**

```sql
-- PostgreSQL: Extract specific document URL from JSON
SELECT 
  id,
  name,
  email,
  clinicOnboardingData->>'clinicDocuments'->>'medicalLicense' as medical_license_url,
  clinicOnboardingData->'clinicDocuments'->'clinicPhotos'->>'logo' as logo_url
FROM "User"
WHERE role = 'CLINIC_OWNER'
AND approvalStatus = 'PENDING';
```

---

## 📝 Field Mapping

### **Document Fields**

| Field Name | Type | Required | Storage |
|------------|------|----------|---------|
| `clinicRegistrationCertificate` | URL (String) | ✅ Yes | Cloudinary/Local |
| `medicalLicense` | URL (String) | ✅ Yes | Cloudinary/Local |
| `ownerIdProof` | URL (String) | ✅ Yes | Cloudinary/Local |
| `gstCertificate` | URL (String) | ❌ No | Cloudinary/Local |

### **Photo Fields (in `clinicPhotos` object)**

| Field Name | Type | Required | Purpose | Storage |
|------------|------|----------|---------|---------|
| `logo` | URL (String) | ❌ No | Square logo for mobile app | Cloudinary/Local |
| `exterior` | URL (String) | ❌ No | Clinic building exterior | Cloudinary/Local |
| `reception` | URL (String) | ❌ No | Reception/waiting area | Cloudinary/Local |
| `consultation` | URL (String) | ❌ No | Consultation room | Cloudinary/Local |

### **Text Fields**

| Field Name | Type | Required | Example |
|------------|------|----------|---------|
| `clinicRegistrationNumber` | String | ❌ No | "REG/2026/DL/ABC/123456" |
| `gstNumber` | String | ❌ No | "07AABCU9603R1ZM" |

---

## 🎨 Why This Structure?

### **Advantages of JSON Storage:**

1. **Flexibility** 🔄
   - Easy to add/remove fields without migrations
   - Can handle optional fields naturally
   - No need for complex joins

2. **Simplicity** 🎯
   - All onboarding data in one place
   - Easy to export/import complete records
   - Single query to get everything

3. **Version Control** 📦
   - Can add versioning fields
   - Easy to track changes over time
   - Backwards compatible

4. **Performance** ⚡
   - Single database read for all documents
   - Reduced number of tables
   - Faster queries

### **Why Photos Are in an Object (Not Array)?**

```javascript
// ✅ GOOD: Object with named keys
"clinicPhotos": {
  "logo": "url1",
  "exterior": "url2",
  "reception": "url3",
  "consultation": "url4"
}

// ❌ BAD: Array without context
"clinicPhotos": [
  "url1", // Which photo is this?
  "url2", // Logo? Exterior?
  "url3", // No way to tell!
  "url4"
]
```

**Benefits:**
- Each photo has a **specific purpose**
- Easy to access: `photos.logo` instead of `photos[0]`
- Self-documenting structure
- Mobile app knows exactly which photo to display where

---

## 🔐 Security Considerations

### **File Storage Security:**

1. **Cloudinary URLs are secure:**
   ```
   https://res.cloudinary.com/your-cloud/image/upload/v1234567890/clinic-owner/file.pdf
   ```
   - HTTPS encrypted
   - CDN distributed
   - Unique filenames
   - Folder-based isolation

2. **Access Control:**
   - URLs are public but hard to guess
   - Can add authentication layer later
   - Cloudinary supports signed URLs for private access

3. **File Validation:**
   - Type checking (PDF, JPG, PNG only)
   - Size limits (5MB max)
   - Virus scanning (optional with Cloudinary)

---

## 📊 Storage Size Analysis

### **Typical Storage Requirements:**

**JSON Field Size:**
- Step 1 data: ~1 KB
- Step 2 data: ~500 bytes
- Step 3 data: ~1.5 KB (URLs only, not files)
- Step 4 data: ~300 bytes
- **Total per user:** ~3.3 KB

**Actual Files (stored in Cloudinary):**
- Documents (4): ~2 MB each = 8 MB
- Photos (4): ~500 KB each = 2 MB
- **Total per user:** ~10 MB

**For 1,000 clinics:**
- Database JSON: 3.3 MB
- File storage: 10 GB
- Very efficient! ✅

---

## 🛠️ How to Download Documents

### **Frontend Example:**

```javascript
// Download a document
const downloadDocument = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Usage
const docs = userData.clinicOnboardingData.clinicDocuments;
downloadDocument(docs.medicalLicense, 'medical-license.pdf');
```

### **Admin Dashboard Example:**

```javascript
// View all documents for a clinic
const ClinicDocumentsView = ({ userId }) => {
  const [documents, setDocuments] = useState(null);
  
  useEffect(() => {
    fetch(`/api/admin/clinic/${userId}/documents`)
      .then(res => res.json())
      .then(data => setDocuments(data.clinicDocuments));
  }, [userId]);
  
  return (
    <div>
      <h3>Required Documents</h3>
      <a href={documents?.clinicRegistrationCertificate} target="_blank">
        View Registration Certificate
      </a>
      <a href={documents?.medicalLicense} target="_blank">
        View Medical License
      </a>
      <a href={documents?.ownerIdProof} target="_blank">
        View Owner ID Proof
      </a>
      
      <h3>Clinic Photos</h3>
      <img src={documents?.clinicPhotos?.logo} alt="Logo" />
      <img src={documents?.clinicPhotos?.exterior} alt="Exterior" />
      <img src={documents?.clinicPhotos?.reception} alt="Reception" />
      <img src={documents?.clinicPhotos?.consultation} alt="Consultation" />
    </div>
  );
};
```

---

## 🎯 Summary

**Storage Location:**
```
PostgreSQL Database
  └── User Table
      └── clinicOnboardingData (JSON field)
          └── clinicDocuments (object)
              ├── Document URLs (4)
              ├── Photo URLs (4 in object)
              └── Text fields (2)
```

**Actual Files:**
```
Cloudinary Cloud Storage
  └── clinic-owner folder
      ├── document-files.pdf (uploaded docs)
      └── photo-files.jpg (uploaded photos)
```

**Key Points:**
- ✅ Document **URLs** stored in database (JSON)
- ✅ Actual **files** stored in Cloudinary (cloud)
- ✅ Photos stored as **object with named keys**
- ✅ Easy to query and access
- ✅ Secure and scalable
- ✅ Production-ready!

---

**Questions? Check the implementation in:**
- `backend/src/controllers/auth.controller.js` (saveClinicDocumentsHandler)
- `backend/src/routes/auth.routes.js` (multer configuration)
- `backend/prisma/schema.prisma` (User model)

---

**Document Version:** 1.0  
**Last Updated:** August 13, 2026
