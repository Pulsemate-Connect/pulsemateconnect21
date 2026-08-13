# 📸 Visual Guide: How Documents Are Stored

**Quick Reference for Understanding Document Storage**

---

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  USER UPLOADS FILE → CLOUDINARY/LOCAL → DATABASE STORES URL         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📤 Upload Flow (Step 3)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                               │
│                                                                       │
│  Step 3: Clinic Documents Page                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📄 Clinic Registration Certificate                          │    │
│  │  [Choose File] → my-clinic-registration.pdf (2.3 MB)        │    │
│  │  ✅ Uploaded                                                 │    │
│  │                                                              │    │
│  │  📄 Medical License                                          │    │
│  │  [Choose File] → medical-license-2024.pdf (1.8 MB)          │    │
│  │  ✅ Uploaded                                                 │    │
│  │                                                              │    │
│  │  📸 Clinic Logo                                              │    │
│  │  [Choose File] → clinic-logo.jpg (500 KB)                   │    │
│  │  ✅ Uploaded - [Preview]                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                  │                                   │
│                      User clicks "Next"                              │
│                                  │                                   │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVER (Express)                          │
│                                                                       │
│  POST /api/auth/clinic-owner/save-clinic-documents                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  1. Multer receives files                                   │     │
│  │     - Validates file types (PDF, JPG, PNG)                  │     │
│  │     - Validates file sizes (max 5MB each)                   │     │
│  │                                                             │     │
│  │  2. Upload files to storage                                 │     │
│  │     DEV:  → backend/uploads/clinic-owner/                   │     │
│  │     PROD: → Cloudinary cloud storage                        │     │
│  │                                                             │     │
│  │  3. Get URLs for each file                                  │     │
│  │     ✓ clinic-reg-cert → https://...cloudinary.../cert.pdf  │     │
│  │     ✓ medical-license → https://...cloudinary.../lic.pdf   │     │
│  │     ✓ clinic-logo     → https://...cloudinary.../logo.jpg  │     │
│  │                                                             │     │
│  │  4. Build JSON object                                       │     │
│  │     {                                                       │     │
│  │       "clinicRegistrationCertificate": "https://...",      │     │
│  │       "medicalLicense": "https://...",                      │     │
│  │       "clinicPhotos": {                                     │     │
│  │         "logo": "https://..."                               │     │
│  │       }                                                     │     │
│  │     }                                                       │     │
│  │                                                             │     │
│  │  5. Save to database (Prisma)                               │     │
│  │     UPDATE "User"                                           │     │
│  │     SET clinicOnboardingData = {                            │     │
│  │       ...existing data...,                                  │     │
│  │       "clinicDocuments": { ...URLs... }                     │     │
│  │     }                                                       │     │
│  │     WHERE id = 123                                          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                  │                                   │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FILE STORAGE (Cloudinary)                         │
│                                                                       │
│  https://res.cloudinary.com/pulsemateconnect/image/upload/           │
│  └── clinic-owner/                                                   │
│      ├── clinic-reg-cert-1723567890123-abc.pdf                       │
│      ├── medical-license-1723567891456-def.pdf                       │
│      ├── owner-id-1723567892789-ghi.jpg                              │
│      ├── gst-cert-1723567893012-jkl.pdf                              │
│      ├── logo-1723567894345-mno.jpg                                  │
│      ├── exterior-1723567895678-pqr.jpg                              │
│      ├── reception-1723567896901-stu.jpg                             │
│      └── consultation-1723567897234-vwx.jpg                          │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL/Supabase)                           │
│                                                                       │
│  "User" Table - Row ID: 123                                          │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ id: 123                                                     │     │
│  │ name: "Dr. John Doe"                                        │     │
│  │ email: "john@example.com"                                   │     │
│  │ mobile: "9999999999"                                        │     │
│  │ role: "CLINIC_OWNER"                                        │     │
│  │ approvalStatus: "PENDING"                                   │     │
│  │ clinicOnboardingData: {                                     │     │
│  │   "clinicInformation": { ... },                             │     │
│  │   "servicesOperations": { ... },                            │     │
│  │   "clinicDocuments": {                                      │     │
│  │     "clinicRegistrationCertificate": "https://res.cloud...",│     │
│  │     "medicalLicense": "https://res.cloudinary.com/...",    │     │
│  │     "ownerIdProof": "https://res.cloudinary.com/...",      │     │
│  │     "gstCertificate": "https://res.cloudinary.com/...",    │     │
│  │     "clinicPhotos": {                                       │     │
│  │       "logo": "https://res.cloudinary.com/...",            │     │
│  │       "exterior": "https://res.cloudinary.com/...",        │     │
│  │       "reception": "https://res.cloudinary.com/...",       │     │
│  │       "consultation": "https://res.cloudinary.com/..."     │     │
│  │     },                                                      │     │
│  │     "clinicRegistrationNumber": "REG/2024/12345",          │     │
│  │     "gstNumber": "27AABCU9603R1ZM",                        │     │
│  │     "completedAt": "2026-08-13T11:00:00.000Z"              │     │
│  │   },                                                        │     │
│  │   "partnerAgreement": { ... }                               │     │
│  │ }                                                           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ⚠️ NOTE: Only URLs stored in database, NOT the actual files!       │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📦 What Gets Stored Where?

### **Files (Actual PDF/Images) 📁**

```
STORAGE: Cloudinary (Production) or Local Disk (Dev)
SIZE: Can be large (up to 5MB per file)
ACCESS: Via HTTPS URL

Example:
┌──────────────────────────────────────────────────────────────┐
│  https://res.cloudinary.com/pulsemateconnect/               │
│         image/upload/v1723567890/                            │
│         clinic-owner/medical-license-1723567891456-def.pdf   │
│                                                              │
│  📄 Actual PDF file: 1.8 MB                                  │
└──────────────────────────────────────────────────────────────┘
```

### **URLs (Links to Files) 🔗**

```
STORAGE: PostgreSQL Database (JSON field)
SIZE: Small (~150 characters per URL)
ACCESS: Via database query

Example:
┌──────────────────────────────────────────────────────────────┐
│  {                                                           │
│    "medicalLicense":                                         │
│      "https://res.cloudinary.com/.../license.pdf"           │
│  }                                                           │
│                                                              │
│  📝 Just text: ~150 bytes                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Real Database Example

### **PostgreSQL Table View**

```sql
SELECT * FROM "User" WHERE id = 123;
```

```
┌─────┬──────────────┬─────────────────┬────────────┬──────────────┬─────────────────────────────┐
│ id  │ name         │ email           │ mobile     │ role         │ clinicOnboardingData        │
├─────┼──────────────┼─────────────────┼────────────┼──────────────┼─────────────────────────────┤
│ 123 │ Dr. John Doe │ john@email.com  │ 9999999999 │ CLINIC_OWNER │ {                           │
│     │              │                 │            │              │   "clinicInformation": {...}│
│     │              │                 │            │              │   "servicesOperations": {...}│
│     │              │                 │            │              │   "clinicDocuments": {      │
│     │              │                 │            │              │     "clinicRegistration...":│
│     │              │                 │            │              │       "https://res.cloud.../│
│     │              │                 │            │              │        cert.pdf",           │
│     │              │                 │            │              │     "medicalLicense":       │
│     │              │                 │            │              │       "https://res.cloud.../│
│     │              │                 │            │              │        license.pdf",        │
│     │              │                 │            │              │     "clinicPhotos": {       │
│     │              │                 │            │              │       "logo": "https://..." │
│     │              │                 │            │              │     }                       │
│     │              │                 │            │              │   }                         │
│     │              │                 │            │              │ }                           │
└─────┴──────────────┴─────────────────┴────────────┴──────────────┴─────────────────────────────┘
```

### **Expanded JSON View**

```json
{
  "id": 123,
  "clinicOnboardingData": {
    "clinicDocuments": {
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
}
```

---

## 🎨 How Admin Will View Documents

### **Admin Dashboard (Future)**

```
┌────────────────────────────────────────────────────────────────┐
│  🏥 Pending Clinic Applications                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📋 Application #123 - Dr. John Doe                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                │
│  📧 Email: john@example.com                                    │
│  📱 Phone: +91 9999999999                                      │
│  🏥 Clinic: ABC Multi-Specialty Hospital                       │
│  📍 Location: Mumbai, Maharashtra                              │
│                                                                │
│  📄 DOCUMENTS:                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ✅ Clinic Registration Certificate                        │ │
│  │    [View PDF] [Download]                                  │ │
│  │    REG/MH/2024/12345                                      │ │
│  │                                                           │ │
│  │ ✅ Medical License                                        │ │
│  │    [View PDF] [Download]                                  │ │
│  │                                                           │ │
│  │ ✅ Owner ID Proof (Aadhaar)                               │ │
│  │    [View Image] [Download]                                │ │
│  │                                                           │ │
│  │ ✅ GST Certificate                                        │ │
│  │    [View PDF] [Download]                                  │ │
│  │    27AABCU9603R1ZM                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  📸 CLINIC PHOTOS:                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  Logo   │ │Exterior │ │Reception│ │Consult  │            │
│  │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │            │
│  │ 🔍 View │ │ 🔍 View │ │ 🔍 View │ │ 🔍 View │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [✅ Approve Application]  [❌ Reject]  [📝 Request More] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘

When admin clicks "View PDF":
→ Opens: https://res.cloudinary.com/.../certificate.pdf
→ Browser displays the PDF directly (no download to server needed)
```

---

## 💡 Key Advantages

### **1. Separation of Concerns**

```
FILES (Large data)          →  Cloudinary (Optimized storage)
URLs (Small metadata)       →  Database (Fast queries)
```

### **2. Performance**

```
Loading Application List:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query 1000 applications with URLs:  ~50ms   ✅ Fast
Query 1000 applications with files: ~5000ms ❌ Slow
```

### **3. Scalability**

```
Database Size with URLs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10,000 applications × 1.5 KB = 15 MB    ✅ Manageable

Database Size with Files:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10,000 applications × 10 MB = 100 GB    ❌ Too large!
```

### **4. CDN Benefits**

```
User in Mumbai requests logo:
┌─────────────────────────────────────────────┐
│ Without CDN (Files in database):            │
│ Mumbai → Database Server → Download         │
│ Time: 2000ms ❌                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ With Cloudinary (CDN):                      │
│ Mumbai → Nearest CDN edge → Instant         │
│ Time: 50ms ✅                                │
└─────────────────────────────────────────────┘
```

---

## 🔄 How Documents Are Accessed

### **Frontend Display**

```javascript
// Fetch user data
const response = await fetch('/api/users/123');
const user = await response.json();

// Extract document URLs
const docs = user.clinicOnboardingData?.clinicDocuments;

// Display image directly (URL works in <img> tag)
<img 
  src={docs.clinicPhotos.logo} 
  alt="Clinic Logo"
  className="w-32 h-32 object-cover rounded-lg"
/>

// Display PDF in new tab
<a 
  href={docs.medicalLicense}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 hover:underline"
>
  📄 View Medical License
</a>

// Download document
<a 
  href={docs.clinicRegistrationCertificate}
  download="clinic-registration.pdf"
  className="btn btn-primary"
>
  ⬇️ Download Certificate
</a>
```

### **Backend Retrieval**

```javascript
// Get user with documents
const user = await prisma.user.findUnique({
  where: { id: 123 },
});

// Access documents
const medicalLicenseUrl = 
  user.clinicOnboardingData.clinicDocuments.medicalLicense;

const logoUrl = 
  user.clinicOnboardingData.clinicDocuments.clinicPhotos.logo;

// Send to email for admin review
await sendEmail({
  to: 'admin@pulsemateconnect.com',
  subject: 'New Clinic Application',
  body: `
    Please review application #${user.id}
    
    Documents:
    - Registration: ${user.clinicOnboardingData.clinicDocuments.clinicRegistrationCertificate}
    - License: ${medicalLicenseUrl}
    - ID Proof: ${user.clinicOnboardingData.clinicDocuments.ownerIdProof}
  `,
});
```

---

## 🎯 Quick Reference

### **Document Fields Structure**

```javascript
clinicDocuments: {
  // ══════════ REQUIRED (3) ══════════
  clinicRegistrationCertificate: "URL",  // PDF or Image
  medicalLicense: "URL",                  // PDF or Image
  ownerIdProof: "URL",                    // PDF or Image
  
  // ══════════ OPTIONAL (1) ══════════
  gstCertificate: "URL" | null,          // PDF or Image
  
  // ══════════ PHOTOS (4) ═══════════
  clinicPhotos: {
    logo: "URL" | null,                  // Square logo
    exterior: "URL" | null,              // Building photo
    reception: "URL" | null,             // Waiting area
    consultation: "URL" | null,          // Consultation room
  },
  
  // ══════════ TEXT (2) ══════════════
  clinicRegistrationNumber: "string" | null,
  gstNumber: "string" | null,
  
  // ══════════ METADATA ══════════════
  completedAt: "timestamp"
}
```

---

## ✅ Summary

**Files Storage:** Cloudinary ☁️ (production) or Local Disk 💾 (dev)  
**URLs Storage:** PostgreSQL Database 🗄️ in JSON field  
**Structure:** Nested JSON with named keys 🏗️  
**Access:** Direct HTTPS URLs 🔗  
**Security:** File validation + unique filenames 🔐  
**Performance:** CDN delivery + fast database queries ⚡  

---

**Need Help?** Check `DATABASE-CLINIC-DOCUMENTS-STRUCTURE.md` for detailed SQL queries and examples!

---

**Document Version:** 1.0  
**Last Updated:** August 13, 2026
