const REFRESH_COOKIE_NAME = 'pm_refresh_token';
const SESSION_COOKIE_NAME = 'pm_session'; // ✅ NEW: Production session cookie

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 1000 * 60 * 60 * 24 * 7,
});

// ✅ NEW: Production session cookie options
const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // lax for better UX (same-site GET requests allowed)
  path: '/', // Available to all API routes
  maxAge: parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10) * 24 * 60 * 60 * 1000,
});

const setRefreshTokenCookie = (res, refreshToken, maxAgeMs) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: maxAgeMs || getRefreshCookieOptions().maxAge,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
};

// ✅ NEW: Session cookie helpers
const setSessionCookie = (res, sessionToken, maxAgeMs) => {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    ...getSessionCookieOptions(),
    maxAge: maxAgeMs || getSessionCookieOptions().maxAge,
  });
};

const clearSessionCookie = (res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
};

module.exports = {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME, // ✅ NEW
  getRefreshCookieOptions,
  getSessionCookieOptions, // ✅ NEW
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  setSessionCookie, // ✅ NEW
  clearSessionCookie, // ✅ NEW
};
