# 🔐 PulseMate Connect — Security & Secret Rotation Guide

**Date**: August 27, 2026  
**Status**: Critical Security Update Required  
**Priority**: Immediate Action Required  

---

## ⚠️ CRITICAL SECURITY ISSUE IDENTIFIED

**Issue**: Plaintext passwords and secrets stored in `.env` file

**Files Affected**:
- `backend/.env` (contains plaintext admin passwords and API secrets)

**Risk Level**: 🔴 **CRITICAL**

**Impact**:
- Complete admin account compromise
- Payment gateway access (Razorpay)
- Firebase service account compromise
- Database credential exposure
- If committed to git, secrets are permanently in history

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Step 1: Verify .env is NOT in Git History

```bash
# Check if .env was ever committed
cd backend
git log --all --full-history -- .env

# If found, you MUST rotate ALL secrets immediately
```

**If .env found in git history:**
1. All secrets are compromised
2. Proceed to Step 2 immediately
3. Consider using git-filter-repo to remove from history (advanced)

---

### Step 2: Rotate Admin Passwords IMMEDIATELY

```bash
# Connect to your production database
# Run these SQL commands:

-- Check current admin accounts
SELECT id, email, name, role FROM users 
WHERE role = 'SUPER_ADMIN';

-- You'll need to manually reset passwords using your application's password reset flow
-- OR use bcrypt to generate new password hashes
```

**Generate secure passwords**:
```bash
# Use a password manager to generate 20+ character passwords
# Examples: 1Password, LastPass, Bitwarden

# OR use command line:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### Step 3: Rotate JWT Secrets

```bash
# Generate new JWT secrets (64 bytes = 128 hex chars)
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Update in production**:
1. Update environment variables in your hosting platform
2. Restart application
3. All existing JWT tokens will be invalidated
4. Users must log in again (expected behavior)

---

### Step 4: Rotate Razorpay Secrets

**⚠️ WARNING**: Rotating Razorpay keys will break existing payment integrations

1. Login to Razorpay Dashboard: https://dashboard.razorpay.com/
2. Go to **Settings** → **API Keys**
3. Click **Regenerate Key**
4. Copy new `key_id` and `key_secret`
5. Update environment variables
6. Test payment flow in staging first
7. Deploy to production
8. Monitor for payment failures

**Rollback plan**: Keep old keys active for 24 hours if possible

---

### Step 5: Rotate Firebase Service Account

**⚠️ WARNING**: Rotating Firebase service account will break authentication

1. Login to Firebase Console: https://console.firebase.google.com/
2. Go to **Project Settings** → **Service Accounts**
3. Click **Generate New Private Key**
4. Download JSON file
5. Convert to single-line JSON (no newlines):
   ```bash
   cat firebase-key.json | jq -c . > firebase-key-oneline.json
   ```
6. Update `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
7. Delete old service account key
8. Test authentication flow
9. Deploy to production

---

### Step 6: Rotate Cloudinary Secrets

1. Login to Cloudinary Dashboard: https://cloudinary.com/console
2. Go to **Settings** → **Security**
3. Click **Regenerate API Secret**
4. Update `CLOUDINARY_API_SECRET` environment variable
5. Test image upload flow

---

### Step 7: Rotate Resend API Key

1. Login to Resend Dashboard: https://resend.com/api-keys
2. Delete old API key
3. Create new API key
4. Update `RESEND_API_KEY` environment variable
5. Test email sending

---

### Step 8: Rotate Message Central Password

1. Login to Message Central
2. Change account password
3. Base64 encode new password:
   ```bash
   echo -n 'YourNewPassword' | base64
   ```
4. Update `MESSAGE_CENTRAL_PASSWORD` environment variable

---

## 🛡️ SECURE SECRET MANAGEMENT

### Option 1: AWS Secrets Manager (Recommended for Production)

```javascript
// backend/src/config/secrets.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'ap-south-1' });

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}

// Usage
const secrets = await getSecret('pulsemate/production/secrets');
process.env.JWT_ACCESS_SECRET = secrets.JWT_ACCESS_SECRET;
```

**Setup**:
```bash
# Install AWS SDK
npm install aws-sdk

# Store secrets
aws secretsmanager create-secret \
  --name pulsemate/production/secrets \
  --secret-string file://secrets.json
```

---

### Option 2: HashiCorp Vault

```bash
# Store secret
vault kv put secret/pulsemate/jwt access_secret="xxx" refresh_secret="yyy"

# Retrieve secret
vault kv get -field=access_secret secret/pulsemate/jwt
```

---

### Option 3: Environment-Specific .env Files (Minimum Security)

**Structure**:
```
backend/
├── .env.example          # Template (committed to git)
├── .env.development      # Local dev (NOT in git)
├── .env.staging          # Staging secrets (NOT in git)
├── .env.production       # Production secrets (NOT in git)
└── .env                  # Symlink to active environment
```

**Load based on NODE_ENV**:
```javascript
// backend/src/config/environment.js
const dotenv = require('dotenv');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'staging'
  ? '.env.staging'
  : '.env.development';

dotenv.config({ path: path.join(__dirname, '../../', envFile) });
```

---

## 🔒 .gitignore Configuration

**Verify these entries exist in `.gitignore`**:

```gitignore
# Environment files
.env
.env.local
.env.development
.env.staging
.env.production
.env.*.local

# Secrets
secrets/
*.pem
*.key
*.p12
firebase-key*.json

# Logs (may contain secrets)
logs/
*.log
npm-debug.log*
```

**Check current status**:
```bash
# Verify .env is ignored
git check-ignore backend/.env

# Should output: backend/.env
# If nothing, add to .gitignore immediately
```

---

## 📋 SECRET ROTATION SCHEDULE

| Secret | Rotation Frequency | Last Rotated | Next Due |
|--------|-------------------|--------------|----------|
| Admin Passwords | Every 90 days | 🔴 NEVER | IMMEDIATELY |
| JWT Secrets | Every 180 days | 🔴 NEVER | IMMEDIATELY |
| Razorpay Keys | Every 365 days | 🔴 NEVER | IMMEDIATELY |
| Firebase SA | Every 365 days | 🔴 NEVER | IMMEDIATELY |
| Cloudinary | Every 365 days | 🔴 NEVER | IMMEDIATELY |
| Database Password | Every 180 days | Unknown | TBD |

---

## ✅ POST-ROTATION VERIFICATION

After rotating secrets, verify:

### 1. Authentication Works
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"+919876543210","password":"new_password"}'
```

### 2. Payment Flow Works
- Create test appointment
- Initiate payment
- Verify webhook callback
- Check payment status

### 3. Image Upload Works
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

### 4. Email Sending Works
- Trigger password reset
- Verify email received
- Check email logs

### 5. SMS Sending Works
- Request OTP
- Verify SMS received
- Check delivery logs

---

## 🚫 NEVER DO THIS

❌ Store passwords in `.env` files  
❌ Commit `.env` to git  
❌ Share `.env` via email/Slack/WhatsApp  
❌ Use same secrets across environments  
❌ Store secrets in application code  
❌ Log secrets in console or files  
❌ Send secrets in API responses  
❌ Store secrets in frontend code  
❌ Use weak passwords (< 16 characters)  
❌ Reuse passwords across services  

---

## ✅ ALWAYS DO THIS

✅ Use secrets manager (AWS/Vault/Azure)  
✅ Rotate secrets regularly  
✅ Use different secrets per environment  
✅ Limit secret access (principle of least privilege)  
✅ Audit secret access logs  
✅ Encrypt secrets at rest  
✅ Use strong random generation  
✅ Document rotation procedures  
✅ Test after rotation  
✅ Have rollback plan  

---

## 📞 EMERGENCY CONTACTS

**If secrets are compromised:**

1. **Database**: Contact Supabase support immediately
2. **Payment**: Contact Razorpay support to freeze account
3. **Firebase**: Revoke compromised service account key
4. **Email users**: Notify about forced password reset
5. **Incident report**: Document what happened, when, how

**Supabase Support**: support@supabase.com  
**Razorpay Support**: support@razorpay.com  
**Firebase Support**: firebase-support@google.com  

---

## 🔍 AUDIT LOG

| Date | Action | Performed By | Secrets Rotated | Status |
|------|--------|--------------|-----------------|--------|
| 2026-08-27 | Initial Audit | System | - | Issue Identified |
| TBD | Emergency Rotation | Your Name | All | Pending |

---

## 📚 ADDITIONAL RESOURCES

- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [12 Factor App - Config](https://12factor.net/config)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Next Steps**:
1. Review this document
2. Execute Step 1-8 in sequence
3. Test thoroughly in staging
4. Deploy to production
5. Monitor for issues
6. Update audit log
7. Schedule next rotation (set calendar reminders)

**Status**: 🔴 **Action required within 24 hours**
