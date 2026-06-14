/**
 * getFileUrl — resolve stored file paths to a fully-qualified URL.
 *
 * In development, Vite proxies `/uploads/*` → localhost:5000, so a relative
 * path like `/uploads/clinic-owner/file.jpg` just works.
 *
 * In production (Render), the frontend is a static site on www.pulsemateconnect.in
 * and the backend lives on api.pulsemateconnect.in. Relative `/uploads/` paths
 * would resolve against the frontend origin and 404. We must prepend the backend
 * origin derived from VITE_API_URL.
 *
 * Rules:
 *  1. null / empty                    → null (caller shows fallback)
 *  2. already full https:// URL       → return as-is
 *  3. /uploads/... relative path      → prepend backend origin in prod, keep relative in dev
 *  4. bare filename                   → treat as /uploads/clinic-owner/<filename>
 */

// Derive the backend base URL from VITE_API_URL (strips trailing /api)
// e.g. https://api.pulsemateconnect.in/api → https://api.pulsemateconnect.in
const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const BACKEND_ORIGIN = RAW_API_URL
  ? RAW_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  : '';

// In dev, VITE_API_URL is not set (falls back to /api via Vite proxy),
// so BACKEND_ORIGIN will be '' — meaning relative /uploads/ paths work fine.
const IS_PROD = BACKEND_ORIGIN.startsWith('http');

export const getFileUrl = (filePath) => {
  if (!filePath) return null;

  // Already an absolute URL (http/https) — return unchanged
  if (/^https?:\/\//i.test(filePath)) return filePath;

  // Relative /uploads/... path
  if (filePath.startsWith('/uploads/')) {
    return IS_PROD ? `${BACKEND_ORIGIN}${filePath}` : filePath;
  }

  // Bare filename — assume clinic-owner uploads
  const cleanName = filePath.replace(/^\/+/, '');
  const path = `/uploads/clinic-owner/${cleanName}`;
  return IS_PROD ? `${BACKEND_ORIGIN}${path}` : path;
};
