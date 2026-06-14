/**
 * getFileUrl — resolve any stored file path to a fully-qualified URL.
 *
 * Stored formats we handle:
 *  A) Already absolute:   https://api.pulsemateconnect.in/uploads/clinic-owner/file.jpg
 *  B) Relative:           /uploads/clinic-owner/file.jpg   (legacy — pre-fix records)
 *  C) Bare filename:      1234567-photo.jpg
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

  // A) Already an absolute URL — return as-is
  if (/^https?:\/\//i.test(raw)) return raw;

  // B) Relative /uploads/... path (legacy records stored without domain)
  if (raw.startsWith('/uploads/')) {
    return IS_PROD ? `${BACKEND_ORIGIN}${raw}` : raw;
  }

  // C) Bare filename — assume clinic-owner uploads folder
  const clean = raw.replace(/^\/+/, '');
  const path  = `/uploads/clinic-owner/${clean}`;
  return IS_PROD ? `${BACKEND_ORIGIN}${path}` : path;
};
