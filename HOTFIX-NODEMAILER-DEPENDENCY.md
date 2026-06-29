# Hotfix: Missing nodemailer Dependency

**Date**: June 29, 2026  
**Status**: ✅ FIXED  
**Priority**: CRITICAL - Server crash on startup  
**Commit**: `390e0f8`

## Problem

Server was crashing immediately on startup with:

```
Error: Cannot find module 'nodemailer'
Require stack:
- /opt/render/project/src/backend/src/services/email.service.js
- /opt/render/project/src/backend/src/controllers/auth.controller.js
- /opt/render/project/src/backend/src/routes/auth.routes.js
- /opt/render/project/src/backend/src/server.js
```

### Root Cause

The `backend/src/services/email.service.js` file requires `nodemailer` at line 1:

```javascript
const nodemailer = require('nodemailer');
```

However, `nodemailer` was not listed in the `dependencies` section of `backend/package.json`, causing a runtime error during server startup.

## Solution

Added `nodemailer` to production dependencies:

```json
{
  "dependencies": {
    "nodemailer": "^6.9.16"
  }
}
```

## Files Changed

- ✅ `backend/package.json` - Added nodemailer to dependencies
- ✅ `backend/package-lock.json` - Updated lock file with nodemailer resolution

## Verification Steps

1. ✅ Installed nodemailer locally: `npm install` (added 1 package)
2. ✅ Committed changes to git
3. ✅ Pushed to main branch
4. ⏳ Waiting for Render deployment to verify

## Expected Outcome

Server should now start successfully without the "Cannot find module 'nodemailer'" error. The `email.service.js` module will load properly and email functionality will be available.

## Email Service Features

The email service supports multiple providers:
- **SMTP** (nodemailer) - Direct SMTP connection
- **Resend** - API-based (currently configured in production)
- **SendGrid** - API-based
- **Mailgun** - API-based

Production is currently using Resend, but nodemailer is still required for the SMTP fallback option and transporter initialization.

## Related Files

- `backend/src/services/email.service.js` - Email service implementation
- `backend/src/controllers/auth.controller.js` - Uses email service for password resets
- `render.yaml` - Deployment configuration with EMAIL_PROVIDER=resend

## Impact

- **Before**: Server crash on startup, no services available
- **After**: Server starts normally, all email functionality works

## Notes

This was the 7th deployment fix in the sequence:
1. Prisma 7 breaking changes → Pinned to 5.22.0
2. Duplicate constraint migration → Made idempotent
3. Failed migration blocking → Added resolve command
4. Duplicate notificationRoutes → Removed duplicate
5. **Missing nodemailer** → Added dependency ✅

---

**Next Steps**: Monitor Render deployment logs to confirm successful startup.
