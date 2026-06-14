/**
 * upload.middleware.js
 *
 * Uses Cloudinary for persistent file storage.
 * Render's filesystem is ephemeral — local disk uploads are wiped on every deploy.
 * Cloudinary stores files permanently and returns a public HTTPS URL.
 *
 * Required env vars (set in Render dashboard):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Falls back to local disk storage when Cloudinary env vars are NOT set
 * (i.e. local development without Cloudinary configured).
 */

const path    = require('path');
const multer  = require('multer');

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new Error('Only PDF, JPG, PNG, and WEBP files are allowed'));
    return;
  }
  callback(null, true);
};

// ── Cloudinary path ────────────────────────────────────────────────────────────
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let clinicOwnerUpload;

if (hasCloudinary) {
  const cloudinary           = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
      // Images → deliver as image resource type (supports jpg/png/webp).
      // PDFs  → use raw resource type so they're downloadable.
      const isPdf      = file.mimetype === 'application/pdf';
      const isImage    = file.mimetype.startsWith('image/');
      const resourceType = isPdf ? 'raw' : 'image';

      // Build a clean public_id from the original filename (no extension for images — Cloudinary adds it)
      const baseName = (file.originalname || 'document')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .slice(0, 60) || 'document';

      return {
        folder:        'pulsemate/clinic-owner',
        resource_type: resourceType,
        public_id:     `${Date.now()}-${baseName}`,
        // For images, Cloudinary auto-detects format; for PDFs use the original extension
        format: isPdf ? 'pdf' : undefined,
      };
    },
  });

  clinicOwnerUpload = multer({
    storage: cloudinaryStorage,
    limits:  { fileSize: 8 * 1024 * 1024 },
    fileFilter,
  });

} else {
  // ── Local disk fallback (development) ─────────────────────────────────────
  const fs = require('fs');

  const uploadsRoot         = path.join(__dirname, '..', '..', 'uploads');
  const clinicOwnerUploadsDir = path.join(uploadsRoot, 'clinic-owner');
  fs.mkdirSync(clinicOwnerUploadsDir, { recursive: true });

  const sanitizeBaseName = (value) =>
    String(value || 'document')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'document';

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, clinicOwnerUploadsDir);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
      const baseName  = sanitizeBaseName(file.originalname);
      callback(null, `${Date.now()}-${baseName}${extension}`);
    },
  });

  clinicOwnerUpload = multer({
    storage,
    limits:     { fileSize: 8 * 1024 * 1024 },
    fileFilter,
  });
}

module.exports = { clinicOwnerUpload, hasCloudinary: !!hasCloudinary };

// Log which storage is active (visible in Render logs on startup)
console.log(`[upload] Storage: ${hasCloudinary ? '☁️  Cloudinary (persistent)' : '💾 Local disk (ephemeral — dev only)'}`);
