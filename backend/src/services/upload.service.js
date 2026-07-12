const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      return cb(err);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images (including WebP) and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)|application\/pdf/.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed'));
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Get file URL from filename.
 * Always uses HTTPS on production (Render terminates SSL at the proxy,
 * so req.protocol is 'http' even on HTTPS requests — we force https here).
 */
const getFileUrl = (filename, req) => {
  // Prefer explicit API_URL env var (set in Render environment variables)
  if (process.env.API_URL) {
    return `${process.env.API_URL.replace(/\/api\/?$/, '')}/uploads/${filename}`;
  }
  // In production, always use https regardless of req.protocol
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
  return `${protocol}://${req.get('host')}/uploads/${filename}`;
};

/**
 * Delete file
 */
const deleteFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../../uploads', filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

module.exports = {
  upload,
  getFileUrl,
  deleteFile,
};
