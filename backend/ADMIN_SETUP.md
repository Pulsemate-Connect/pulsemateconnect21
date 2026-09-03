# Super Admin Account Setup Guide

## Overview

This guide explains how to securely create Super Admin accounts for PulseMate Connect.

## Security Requirements

✅ **IMPLEMENTED SECURITY MEASURES:**
- Passwords are hashed using bcrypt with 12 salt rounds
- No hardcoded passwords in source code
- No password logging to console or files
- Environment variable based configuration
- Strong password validation
- Idempotent setup (safe to run multiple times)

## Prerequisites

1. Node.js installed
2. PostgreSQL database running
3. Backend dependencies installed: `npm install` (from backend directory)
4. Database migrations applied: `npx prisma migrate deploy`
5. `.env` file configured with `DATABASE_URL`

## Setup Methods

### Method 1: Using the Secure Setup Script (Recommended)

The `setup-admins.js` script creates admin accounts securely using environment variables.

#### Step 1: Set Environment Variables

**Linux/Mac:**
```bash
export ADMIN_1_EMAIL="sahilnaik1515@gmail.com"
export ADMIN_1_PASSWORD="Nkabu18\$"
export ADMIN_1_NAME="Sahil Naik"
export ADMIN_1_MOBILE="+917022818878"
export ADMIN_1_LEVEL="ROOT"

export ADMIN_2_EMAIL="shubham27052002@gmail.com"
export ADMIN_2_PASSWORD="Shubham27*"
export ADMIN_2_NAME="Shubham"
export ADMIN_2_MOBILE="+919876543210"
export ADMIN_2_LEVEL="SUPER_ADMIN"
```

**Windows PowerShell:**
```powershell
$env:ADMIN_1_EMAIL="sahilnaik1515@gmail.com"
$env:ADMIN_1_PASSWORD="Nkabu18`$"
$env:ADMIN_1_NAME="Sahil Naik"
$env:ADMIN_1_MOBILE="+917022818878"
$env:ADMIN_1_LEVEL="ROOT"

$env:ADMIN_2_EMAIL="shubham27052002@gmail.com"
$env:ADMIN_2_PASSWORD="Shubham27*"
$env:ADMIN_2_NAME="Shubham"
$env:ADMIN_2_MOBILE="+919876543210"
$env:ADMIN_2_LEVEL="SUPER_ADMIN"
```

**Windows CMD:**
```cmd
set ADMIN_1_EMAIL=sahilnaik1515@gmail.com
set ADMIN_1_PASSWORD=Nkabu18$
set ADMIN_1_NAME=Sahil Naik
set ADMIN_1_MOBILE=+917022818878
set ADMIN_1_LEVEL=ROOT

set ADMIN_2_EMAIL=shubham27052002@gmail.com
set ADMIN_2_PASSWORD=Shubham27*
set ADMIN_2_NAME=Shubham
set ADMIN_2_MOBILE=+919876543210
set ADMIN_2_LEVEL=SUPER_ADMIN
```

#### Step 2: Run the Setup Script

```bash
cd backend
node setup-admins.js
```

#### Expected Output

```
╔════════════════════════════════════════════════════════╗
║         Secure Super Admin Account Setup              ║
╚════════════════════════════════════════════════════════╝

✓ Found 2 admin account(s) to create/update

Processing: sahilnaik1515@gmail.com
  ✓ Created successfully

Processing: shubham27052002@gmail.com
  ✓ Created successfully

╔════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE                      ║
╚════════════════════════════════════════════════════════╝

✓ Successfully configured admin accounts:

  Email: sahilnaik1515@gmail.com
  Name:  Sahil Naik
  Level: ROOT
  Action: Created new account

  Email: shubham27052002@gmail.com
  Name:  Shubham
  Level: SUPER_ADMIN
  Action: Created new account

SECURITY REMINDERS:
  • Passwords are securely hashed with bcrypt
  • Store credentials in a secure password manager
  • Do not commit credentials to version control
  • Use environment variables or secrets management

Login URL: https://pulsemateconnect.in/admin
```

### Method 2: One-Line Command (Quick Setup)

For one-time setup, you can pass environment variables inline:

**Linux/Mac:**
```bash
ADMIN_1_EMAIL="sahilnaik1515@gmail.com" \
ADMIN_1_PASSWORD="Nkabu18\$" \
ADMIN_2_EMAIL="shubham27052002@gmail.com" \
ADMIN_2_PASSWORD="Shubham27*" \
node backend/setup-admins.js
```

**Windows PowerShell:**
```powershell
$env:ADMIN_1_EMAIL="sahilnaik1515@gmail.com"; $env:ADMIN_1_PASSWORD="Nkabu18`$"; $env:ADMIN_2_EMAIL="shubham27052002@gmail.com"; $env:ADMIN_2_PASSWORD="Shubham27*"; node backend/setup-admins.js
```

### Method 3: Using .env File (Production)

For production environments, add credentials to your `.env` file:

```env
# Super Admin 1 (ROOT)
ADMIN_1_EMAIL=sahilnaik1515@gmail.com
ADMIN_1_PASSWORD=Nkabu18$
ADMIN_1_NAME=Sahil Naik
ADMIN_1_MOBILE=+917022818878
ADMIN_1_LEVEL=ROOT

# Super Admin 2 (SUPER_ADMIN)
ADMIN_2_EMAIL=shubham27052002@gmail.com
ADMIN_2_PASSWORD=Shubham27*
ADMIN_2_NAME=Shubham
ADMIN_2_MOBILE=+919876543210
ADMIN_2_LEVEL=SUPER_ADMIN
```

Then run:
```bash
cd backend
node setup-admins.js
```

## Configuration Options

### Required Variables (Admin 1)

- `ADMIN_1_EMAIL` - Email address (must be valid format)
- `ADMIN_1_PASSWORD` - Password (min 8 chars, must include uppercase, lowercase, number, special char)

### Optional Variables (Admin 1)

- `ADMIN_1_NAME` - Display name (defaults to email-derived name)
- `ADMIN_1_MOBILE` - Mobile number in E.164 format (defaults to +919999999001)
- `ADMIN_1_LEVEL` - Admin level: `ROOT`, `SUPER_ADMIN`, `SUPPORT`, or `FINANCE` (defaults to `ROOT`)

### Second Admin (Optional)

If you want to create a second admin account:
- `ADMIN_2_EMAIL`
- `ADMIN_2_PASSWORD`
- `ADMIN_2_NAME` (optional)
- `ADMIN_2_MOBILE` (optional, defaults to +919999999002)
- `ADMIN_2_LEVEL` (optional, defaults to `SUPER_ADMIN`)

## Password Requirements

The script enforces strong password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Examples of valid passwords:
- `Nkabu18$`
- `Shubham27*`
- `SecureP@ss123`
- `Admin!Pass2024`

## Admin Levels

| Level | Permissions |
|-------|------------|
| `ROOT` | Full system access, can create other admins, reset database |
| `SUPER_ADMIN` | Full system access, cannot create ROOT admins |
| `SUPPORT` | Can view and manage support tickets, limited admin functions |
| `FINANCE` | Can view financial reports and manage payments |

## Troubleshooting

### "No admin credentials found in environment variables"

**Cause:** Environment variables not set or script cannot read them.

**Solution:** 
1. Verify environment variables are set: `echo $ADMIN_1_EMAIL` (Linux/Mac) or `echo $env:ADMIN_1_EMAIL` (Windows PowerShell)
2. Ensure you're running the command in the same terminal session where you set the variables
3. Check for typos in variable names

### "Invalid email format"

**Cause:** Email address is not in valid format.

**Solution:** Ensure email follows format: `user@domain.com`

### "Weak password"

**Cause:** Password doesn't meet security requirements.

**Solution:** Use a password with:
- At least 8 characters
- Uppercase letter (A-Z)
- Lowercase letter (a-z)
- Number (0-9)
- Special character (@, #, $, %, &, *, etc.)

### "Invalid admin level"

**Cause:** Admin level is not one of the allowed values.

**Solution:** Use one of: `ROOT`, `SUPER_ADMIN`, `SUPPORT`, `FINANCE`

### Database connection errors

**Cause:** Database is not running or `DATABASE_URL` is incorrect.

**Solution:**
1. Verify database is running
2. Check `DATABASE_URL` in `.env` file
3. Test connection: `npx prisma studio`

## Verifying Admin Accounts

After creating admin accounts, verify they exist:

```bash
cd backend
npx prisma studio
```

Navigate to the `users` table and check:
1. Both admin users exist
2. `role` is set to `SUPER_ADMIN`
3. `approvalStatus` is `VERIFIED`
4. `isActive` is `true`
5. `passwordHash` is present (never shows actual password)

Navigate to the `admin_profiles` table and check:
1. Admin profiles exist for both users
2. `level` is set correctly (`ROOT` and `SUPER_ADMIN`)

## Login Testing

1. Navigate to the admin login page: `https://pulsemateconnect.in/admin` (or `http://localhost:3000/admin` for local)
2. Enter the email address for one of the admin accounts
3. Enter the corresponding password
4. Click "Secure Login"
5. Verify successful login and redirect to admin dashboard

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords for each admin
- Store credentials in a secure password manager
- Use environment variables for credentials
- Rotate passwords periodically
- Enable two-factor authentication when available
- Log admin actions via audit logs

### ❌ DO NOT:
- Commit credentials to version control
- Share admin credentials via email/chat
- Use the same password for multiple admins
- Hard-code credentials in source code
- Log passwords in console or files
- Store passwords in plaintext anywhere

## Production Deployment

For production environments:

1. **Use Secrets Management:**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Cloud Secret Manager
   - HashiCorp Vault

2. **Set Environment Variables via Platform:**
   - Render.com: Dashboard → Environment Variables
   - Heroku: `heroku config:set ADMIN_1_EMAIL=...`
   - AWS: Systems Manager Parameter Store
   - Docker: Pass via `docker run -e ADMIN_1_EMAIL=...`

3. **Run Setup Script:**
   - During deployment: Add to build script
   - Manual: SSH into server and run with env vars
   - Automated: Use deployment scripts with secret injection

## Support

If you encounter issues:

1. Check this documentation for troubleshooting steps
2. Verify all prerequisites are met
3. Review error messages carefully
4. Check database connectivity
5. Ensure Node.js and dependencies are properly installed

## Security Notice

⚠️ **IMPORTANT:** The credentials provided by the project owner are sensitive and must be handled securely:
- `sahilnaik1515@gmail.com` with password `Nkabu18$`
- `shubham27052002@gmail.com` with password `Shubham27*`

These credentials:
- Should NEVER be committed to version control
- Should NEVER be shared publicly
- Should be stored in a secure password manager
- Should only be set via environment variables or secrets management
- Are now properly hashed in the database using bcrypt

## Migration from Old Scripts

If you previously used `create-admins-direct.js`:

1. That script is now **DEPRECATED** and should not be used
2. It has been modified to prevent hardcoded credentials
3. Use `setup-admins.js` instead (this script)
4. The new script is more secure and follows best practices

## Script Features

The `setup-admins.js` script includes:

✅ **Security:**
- No hardcoded credentials
- Bcrypt password hashing (12 rounds)
- No password logging
- Environment variable based

✅ **Validation:**
- Email format validation
- Strong password requirements
- Admin level validation
- Mobile number normalization

✅ **Reliability:**
- Idempotent (safe to run multiple times)
- Preserves existing accounts
- Transaction-based updates
- Detailed error messages

✅ **Usability:**
- Clear console output
- Step-by-step progress
- Comprehensive documentation
- Multiple setup methods
