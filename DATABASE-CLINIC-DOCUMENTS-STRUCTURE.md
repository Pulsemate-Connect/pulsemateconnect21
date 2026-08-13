# 📄 Clinic Documents Database Storage Structure

**Last Updated:** August 13, 2026

---

## 🗄️ Storage Overview

Clinic documents are stored in **TWO places**:

1. **Files** → Cloudinary (production) or Local Disk (development)
2. **URLs** → PostgreSQL database in JSON format

---

## 📊 Database Schema

### **User Model (Prisma)**

```prisma
model User {
  id                    Int      @id @default(autoincrement())
  name                  String?
  email                 String   @unique
  mobile                String   @unique
  role                  Role
  approvalStatus        ApprovalStatus
  isPhoneVerified       Boolean  @default(false)
  isEmailVerified       Boolean  @default(false)
  
  // ⭐ THIS FIELD STORES ALL ONBOARDING DATA INCLUDING DOCUMENTS
  clinicOnboardingData  Json?    
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## 📦 JSON Structure in `clinicOnboardingData`

### **Complete Structure**

```json
{
  "clinicInformation": { /* Step 1 data */ },
  "servicesOperations": { /* Step 2 data */ },
  
  "clinicDocuments": {
    // ════════════════════════════════════════════════
    // REQUIRED DOCUMENTS (3) - Full URLs
    // ════════════════════════════════════════════════
    "clinicRegistrationCertificate": "https://res.cloudinary.com/yourcloud/image/upload/v1691234567/clinic-owner/reg-cert-abc123.pdf",
    "medicalLicense": "https://res.cloudinary.com/yourcloud/image/upload/v1691234568/clinic-owner/med-license-xyz789.pdf",
    "ownerIdProof": "https://res.cloudinary.com/yourcloud/image/upload/v1691234569/clinic-owner/id-proof-def456.jpg",
    
    // ════════════════════════════════════════════════
    // OPTIONAL DOCUMENT (1) - Can be null
    // ════════════════════════════════════════════════
    "gstCertificate": "https://res.cloudinary.com/yourcloud/image/upload/v1691234570/clinic-owner/gst-cert-ghi012.pdf",
    // OR
    "gstCertificate": null,
    
    // ════════════════════════════════════════════════
    // CLINIC PHOTOS (4) - Object with named keys
    // ════════════════════════════════════════════════
    "clinicPhotos": {
      "logo": "https://res.cloudinary.com/yourcloud/image/upload/v1691234571/clinic-owner/logo-jkl345.jpg",
      "exterior": "https://res.cloudinary.com/yourcloud/image/upload/v1691234572/clinic-owner/exterior-mno678.jpg",
      "reception": "https://res.cloudinary.com/yourcloud/image/upload/v1691234573/clinic-owner/reception-pqr901.jpg",
      "consultation": "https://res.cloudinary.com/yourcloud/image/upload/v1691234574/clinic-owner/consultation-stu234.jpg"
    },
    // Each photo can also be null if not uploaded
    
    // ════════════════════════════════════════════════
    // ADDITIONAL TEXT FIELDS (2) - Optional
    // ════════════════════════════════════════════════
    "clinicRegistrationNumber": "REG/2024/12345",
    "gstNumber": "27AABCU9603R1ZM",
    
    // ════════════════════════════════════════════════
    // METADATA
    // ════════════════════════════════════════════════
    "completedAt": "2026-08-13T11:00:00.000Z"
  },
  
  "partnerAgreement": { /* Step 4 data */ },
  "lastUpdatedStep": "clinicDocuments",
  "lastUpdatedAt": "2026-08-13T11:00:00.000Z"
}
```

---

## 🖼️ Real Example from Database

### **Query to View Documents**

```sql
SELECT 
  id,
  name,
  email,
  mobile,
  approvalStatus,
  clinicOnboardingData->'clinicDocuments' as clinic_documents
FROM "User"
WHERE id = 123;
```

### **Sample Output**

```json
{
  "id": 123,
  "name": "Dr. John Doe",
  "email": "john@example.com",
  "mobile": "9999999999",
  "approvalStatus": "PENDING",
  "clinic_documents": {
    "clinicRegistrationCertificate": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567890/clinic-owner/clinic-reg-cert-1723567890123-abc.pdf",
    "medicalLicense": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567891/clinic-owner/medical-license-1723567891456-def.pdf",
    "ownerIdProof": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567892/clinic-owner/owner-id-1723567892789-ghi.jpg",
    "gstCertificate": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567893/clinic-owner/gst-cert-1723567893012-jkl.pdf",
    "clinicPhotos": {
      "logo": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567894/clinic-owner/logo-1723567894345-mno.jpg",
      "exterior": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567895/clinic-owner/exterior-1723567895678-pqr.jpg",
      "reception": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567896/clinic-owner/reception-1723567896901-stu.jpg",
      "consultation": "https://res.cloudinary.com/pulsemateconnect/image/upload/v1723567897/clinic-owner/consultation-1723567897234-vwx.jpg"
    },
    "clinicRegistrationNumber": "REG/MH/2024/12345",
    "gstNumber": "27AABCU9603R1ZM",
    "completedAt": "2026-08-13T11:00:00.000Z"
  }
}
```

---

## 📁 File Storage Locations

### **Production (Cloudinary)**

```
Cloudinary Structure:
└── clinic-owner/
    ├── clinic-reg-cert-1723567890123-abc.pdf
    ├── medical-license-1723567891456-def.pdf
    ├── owner-id-1723567892789-ghi.jpg
    ├── gst-cert-1723567893012-jkl.pdf
    ├── logo-1723567894345-mno.jpg
    ├── exterior-1723567895678-pqr.jpg
    ├── reception-1723567896901-stu.jpg
    └── consultation-1723567897234-vwx.jpg
```

**Naming Convention:**
```
{document-type}-{timestamp}-{random}.{extension}

Examples:
- clinic-reg-cert-1723567890123-abc.pdf
- medical-license-1723567891456-def.pdf
- logo-1723567894345-mno.jpg
```

### **Development (Local Disk)**

```
Project Structure:
pulsemateconnect21/
└── backend/
    └── uploads/
        └── clinic-owner/
            ├── clinic-reg-cert-1723567890123-abc.pdf
            ├── medical-license-1723567891456-def.pdf
            ├── owner-id-1723567892789-ghi.jpg
            ├── gst-cert-1723567893012-jkl.pdf
            ├── logo-1723567894345-mno.jpg
            ├── exterior-1723567895678-pqr.jpg
            ├── reception-1723567896901-stu.jpg
            └── consultation-1723567897234-vwx.jpg
```

**Access URL (Development):**
```
http://localhost:5000/uploads/clinic-owner/logo-1723567894345-mno.jpg
```

---

## 🔄 Upload Process Flow

### **Step-by-Step Process**

```
1. User selects file in frontend
   │
   ▼
2. Frontend sends FormData with file
   │
   │  POST /api/auth/clinic-owner/save-clinic-documents
   │  Content-Type: multipart/form-data
   │
   ▼
3. Backend receives file via Multer middleware
   │
   ▼
4. Multer saves file:
   │  • Development → Local disk (backend/uploads/clinic-owner/)
   │  • Production  → Cloudinary (cloud storage)
   │
   ▼
5. Backend gets file URL:
   │  • Development → http://localhost:5000/uploads/clinic-owner/filename.ext
   │  • Production  → https://res.cloudinary.com/.../filename.ext
   │
   ▼
6. Backend saves URL to database:
   │  • Stores in User.clinicOnboardingData.clinicDocuments
   │  • JSON structure with all document URLs
   │
   ▼
7. Frontend receives response with URLs
   │
   ▼
8. User can view uploaded documents via URLs
```

---

## 💾 Database Queries

### **Insert/Update Documents (Backend Code)**

```javascript
// This happens in saveClinicDocumentsHandler

const clinicDocumentsData = {
  clinicRegistrationCertificate: getFileUrl(files.clinicRegistrationCertificate?.[0]),
  medicalLicense: getFileUrl(files.medicalLicense?.[0]),
  ownerIdProof: getFileUrl(files.ownerIdProof?.[0]),
  gstCertificate: getFileUrl(files.gstCertificate?.[0]),
  clinicPhotos: {
    logo: getFileUrl(files.clinicLogo?.[0]),
    exterior: getFileUrl(files.clinicExterior?.[0]),
    reception: getFileUrl(files.clinicReception?.[0]),
    consultation: getFileUrl(files.clinicConsultation?.[0]),
  },
  clinicRegistrationNumber: clinicRegistrationNumber || null,
  gstNumber: gstNumber || null,
  completedAt: new Date(),
};

const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    clinicOnboardingData: {
      ...(user.clinicOnboardingData || {}),
      clinicDocuments: clinicDocumentsData,
      lastUpdatedStep: 'clinicDocuments',
      lastUpdatedAt: new Date(),
    },
  },
});
```

### **Retrieve Documents (SQL)**

```sql
-- Get all clinic documents for a user
SELECT 
  id,
  name,
  email,
  clinicOnboardingData -> 'clinicDocuments' AS documents
FROM "User"
WHERE id = 123;

-- Get specific document URL
SELECT 
  clinicOnboardingData -> 'clinicDocuments' ->> 'medicalLicense' AS medical_license_url
FROM "User"
WHERE id = 123;

-- Get clinic logo URL
SELECT 
  clinicOnboardingData -> 'clinicDocuments' -> 'clinicPhotos' ->> 'logo' AS logo_url
FROM "User"
WHERE id = 123;

-- Get all pending applications with documents
SELECT 
  id,
  name,
  email,
  mobile,
  clinicOnboardingData -> 'clinicDocuments' AS documents
FROM "User"
WHERE approvalStatus = 'PENDING'
  AND role = 'CLINIC_OWNER'
ORDER BY updatedAt DESC;
```

### **Check if all required documents uploaded**

```sql
SELECT 
  id,
  name,
  email,
  CASE 
    WHEN clinicOnboardingData -> 'clinicDocuments' ->> 'clinicRegistrationCertificate' IS NOT NULL 
     AND clinicOnboardingData -> 'clinicDocuments' ->> 'medicalLicense' IS NOT NULL
     AND clinicOnboardingData -> 'clinicDocuments' ->> 'ownerIdProof' IS NOT NULL
    THEN 'Complete'
    ELSE 'Incomplete'
  END AS documents_status
FROM "User"
WHERE role = 'CLINIC_OWNER';
```

---

## 🔍 Accessing Documents

### **From Backend (Node.js)**

```javascript
// Get user with documents
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

console.log('Clinic Registration Certificate:', documents?.clinicRegistrationCertificate);
console.log('Medical License:', documents?.medicalLicense);
console.log('Clinic Logo:', documents?.clinicPhotos?.logo);
console.log('GST Number:', documents?.gstNumber);
```

### **From Frontend (React)**

```javascript
// Fetch user data with documents
const response = await fetch('/api/users/123');
const userData = await response.json();

const documents = userData.clinicOnboardingData?.clinicDocuments;

// Display images
<img 
  src={documents?.clinicPhotos?.logo} 
  alt="Clinic Logo"
  className="w-32 h-32 object-cover"
/>

// Display document links
<a 
  href={documents?.medicalLicense} 
  target="_blank"
  rel="noopener noreferrer"
>
  View Medical License
</a>
```

---

## 🎯 Why This Structure?

### **Advantages**

✅ **Flexible Schema**
- Easy to add new document types without migrations
- Can store optional documents without null columns

✅ **All Data Together**
- Complete onboarding data in one JSON field
- Easy to export/backup entire application

✅ **Efficient Storage**
- URLs are small (only ~100-200 characters each)
- Actual files stored in optimized cloud storage

✅ **Easy Querying**
- PostgreSQL's JSON operators make it simple
- Can filter/search within JSON structure

✅ **Cloud Integration**
- Cloudinary handles image optimization
- CDN for fast global access
- Automatic transformations (resize, crop, etc.)

### **File URLs Benefits**

✅ **Direct Access**
- URLs can be used immediately in `<img>` tags
- No additional API calls needed

✅ **Secure**
- Cloudinary URLs can be signed
- Can set expiration times if needed

✅ **Scalable**
- No database size issues (files stored separately)
- Cloudinary handles bandwidth and caching

---

## 📋 Document Types Breakdown

### **Required Documents (3)**

| Field | Type | Max Size | Formats | Purpose |
|-------|------|----------|---------|---------|
| `clinicRegistrationCertificate` | PDF/Image | 5MB | PDF, JPG, PNG | Proof of clinic registration |
| `medicalLicense` | PDF/Image | 5MB | PDF, JPG, PNG | Medical practice license |
| `ownerIdProof` | PDF/Image | 5MB | PDF, JPG, PNG | Owner identity verification |

### **Optional Document (1)**

| Field | Type | Max Size | Formats | Purpose |
|-------|------|----------|---------|---------|
| `gstCertificate` | PDF/Image | 5MB | PDF, JPG, PNG | GST registration (if applicable) |

### **Clinic Photos (4)**

| Field | Type | Max Size | Formats | Purpose |
|-------|------|----------|---------|---------|
| `clinicPhotos.logo` | Image | 5MB | JPG, PNG | Clinic logo (square for mobile app) |
| `clinicPhotos.exterior` | Image | 5MB | JPG, PNG | Building exterior photo |
| `clinicPhotos.reception` | Image | 5MB | JPG, PNG | Reception/waiting area |
| `clinicPhotos.consultation` | Image | 5MB | JPG, PNG | Consultation room |

### **Additional Text Fields (2)**

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `clinicRegistrationNumber` | String | Optional | Registration certificate number |
| `gstNumber` | String | Optional | GST registration number |

---

## 🔐 Security Considerations

### **File Upload Security**

✅ **File Type Validation**
```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}
```

✅ **File Size Validation**
```javascript
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  throw new Error('File too large');
}
```

✅ **Unique Filenames**
```javascript
// Timestamp + random string prevents overwriting
const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
```

✅ **Access Control**
- Only authenticated clinic owners can upload
- Files are linked to specific user accounts
- Admin can view for verification

---

## 📊 Database Size Estimation

### **Per Application**

```
Single User's Document URLs:
- 3 required docs:  ~150 chars each = 450 chars
- 1 optional doc:   ~150 chars       = 150 chars
- 4 photos:         ~150 chars each = 600 chars
- 2 text fields:    ~50 chars each  = 100 chars
- JSON structure:   ~200 chars      = 200 chars
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL per user:                     ~1,500 chars
                                    ~1.5 KB
```

### **For 10,000 Applications**

```
10,000 users × 1.5 KB = 15 MB (just URLs in database)

Actual files stored in Cloudinary:
10,000 users × 8 files × 1 MB avg = 80 GB
(Cloudinary handles this efficiently)
```

---

## 🎨 Admin View (Future Feature)

### **How Admin Will View Documents**

```javascript
// Admin Dashboard - Pending Applications
function AdminReviewPage() {
  const applications = await fetchPendingApplications();
  
  return applications.map(app => (
    <ApplicationCard>
      <h3>{app.name}</h3>
      <p>Email: {app.email}</p>
      
      {/* View Documents */}
      <DocumentGallery>
        <DocumentLink 
          href={app.clinicOnboardingData.clinicDocuments.clinicRegistrationCertificate}
          label="Registration Certificate"
        />
        <DocumentLink 
          href={app.clinicOnboardingData.clinicDocuments.medicalLicense}
          label="Medical License"
        />
        <DocumentLink 
          href={app.clinicOnboardingData.clinicDocuments.ownerIdProof}
          label="ID Proof"
        />
      </DocumentGallery>
      
      {/* View Photos */}
      <PhotoGallery>
        <Photo src={app.clinicOnboardingData.clinicDocuments.clinicPhotos.logo} />
        <Photo src={app.clinicOnboardingData.clinicDocuments.clinicPhotos.exterior} />
        <Photo src={app.clinicOnboardingData.clinicDocuments.clinicPhotos.reception} />
        <Photo src={app.clinicOnboardingData.clinicDocuments.clinicPhotos.consultation} />
      </PhotoGallery>
      
      <Actions>
        <Button onClick={() => approve(app.id)}>Approve</Button>
        <Button onClick={() => reject(app.id)}>Reject</Button>
      </Actions>
    </ApplicationCard>
  ));
}
```

---

## 🔄 Update/Replace Documents

### **Future Enhancement: Allow Re-upload**

```javascript
// Backend endpoint to update specific document
async function updateDocumentHandler(req, res) {
  const { userId, documentType } = req.params;
  const file = req.file;
  
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
  });
  
  const documents = user.clinicOnboardingData.clinicDocuments;
  
  // Update specific document
  documents[documentType] = getFileUrl(file);
  documents.lastModifiedAt = new Date();
  
  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      clinicOnboardingData: {
        ...user.clinicOnboardingData,
        clinicDocuments: documents,
      },
    },
  });
  
  return res.json({ success: true, newUrl: documents[documentType] });
}
```

---

## ✅ Summary

### **Storage Strategy**

📁 **Files:** Cloudinary (prod) or Local Disk (dev)  
🗄️ **URLs:** PostgreSQL JSON field  
🔗 **Structure:** Nested JSON with named keys  
🖼️ **Photos:** Object with 4 specific photo types  
📄 **Documents:** Direct URL strings  
📝 **Text:** Optional registration numbers

### **Key Points**

✅ All document URLs in one JSON field  
✅ Easy to query and update  
✅ Efficient storage (only URLs in DB)  
✅ Scalable with cloud storage  
✅ Flexible schema for future changes  
✅ Secure file upload with validation  
✅ Ready for admin review dashboard

---

**Document Version:** 1.0  
**Last Updated:** August 13, 2026  
**System Status:** ✅ Fully Implemented
