/**
 * getFileUrl — resolve any stored file path to a fully-qualified URL.
 *
 * Stored formats we handle:
 *  A) Already absolute:   https://api.pulsemateconnect.in/uploads/clinic-owner/file.jpg
 *  B) Cloudinary URL:     https://res.cloudinary.com/...
 *  C) Relative:           /uploads/clinic-owner/file.jpg
 *  D) Bare path:          uploads/clinic-owner/file.jpg
 *  E) Absolute Windows:   C:/Users/.../backend/uploads/clinic-owner/file.jpg (extract filename)
 *  F) Bare filename:      1234567-photo.jpg
 *
 * In production the frontend is a static site on www.pulsemateconnect.in while
 * the backend is on api.pulsemateconnect.in — relative paths must be converted.
 * We derive the backend origin from VITE_API_URL (set in render.yaml).
 */

// VITE_API_URL = "https://api.pulsemateconnect.in/api"  (prod)
// VITE_API_URL = undefined / ""                          (dev — Vite proxy handles /api)
const RAW_API_URL = import.meta.env.VITE_API_URL || '';

// Strip trailing /api to get base origin: "https://api.pulsemateconnect.in"
const BACKEND_ORIGIN = RAW_API_URL
  ? RAW_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  : '';

const IS_PROD = BACKEND_ORIGIN.startsWith('http');

export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const raw = String(filePath).trim();
  if (!raw) return null;

  // A) Already an absolute URL (HTTP/HTTPS or Cloudinary) — return as-is
  if (/^https?:\/\//i.test(raw)) return raw;

  // E) Absolute Windows path (e.g., C:/Users/.../backend/uploads/clinic-owner/file.jpg)
  // Extract just the relative path from "/uploads/" onwards, or fallback to filename
  if (/^[A-Za-z]:[\/\\]/.test(raw)) {
    // Try to extract from "/uploads/" onwards
    const match = raw.match(/[\/\\]uploads[\/\\](.+)$/);
    if (match) {
      const relativePath = `/uploads/${match[1].replace(/\\/g, '/')}`;
      return IS_PROD ? `${BACKEND_ORIGIN}${relativePath}` : relativePath;
    }
    // Fallback: extract just the filename and assume clinic-owner folder
    const filename = raw.split(/[\/\\]/).pop();
    const path = `/uploads/clinic-owner/${filename}`;
    return IS_PROD ? `${BACKEND_ORIGIN}${path}` : path;
  }

  // B) Relative /uploads/... path (with leading slash)
  if (raw.startsWith('/uploads/')) {
    return IS_PROD ? `${BACKEND_ORIGIN}${raw}` : raw;
  }

  // D) Relative uploads/... path (WITHOUT leading slash)
  if (raw.startsWith('uploads/')) {
    const pathWithSlash = `/${raw}`;
    return IS_PROD ? `${BACKEND_ORIGIN}${pathWithSlash}` : pathWithSlash;
  }

  // F) Bare filename — assume clinic-owner uploads folder
  const clean = raw.replace(/^\/+/, '');
  const path  = `/uploads/clinic-owner/${clean}`;
  return IS_PROD ? `${BACKEND_ORIGIN}${path}` : path;
};
