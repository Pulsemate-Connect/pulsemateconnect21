# 🔧 Firebase Backend Configuration Fix

## 🎯 CURRENT STATUS

### ✅ What's Working:
- **Firebase Client SDK** (React Native app) - **WORKING!** ✅
- SMS OTP is being sent and received
- OTP: 774030 received successfully
- Frontend authentication flow complete

### ⚠️ What's NOT Working:
- **Backend Firebase Admin SDK** - Not configured on production server
- Error: "Firebase Auth is not configured. Contact support"
- Backend cannot verify Firebase ID tokens

---

## 🔍 ROOT CAUSE

Your **local** `.env` file has Firebase credentials configured:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

BUT your **production server** (https://api.pulsemateconnect.in) doesn't have this environment variable set.

---

## 🚀 SOLUTION: Add Firebase Credentials to Production Server

### **WHERE IS YOUR BACKEND HOSTED?**

Check which platform you're using:
- ✅ **Render.com** → Follow Option A
- ✅ **Heroku** → Follow Option B
- ✅ **AWS / DigitalOcean / VPS** → Follow Option C
- ✅ **Docker / Self-hosted** → Follow Option D

---

## OPTION A: Render.com

### **Step 1: Get Firebase Service Account JSON**

From your local backend `.env` file, copy the entire value of:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### **Step 2: Add to Render Environment Variables**

1. Go to https://dashboard.render.com
2. Select your **PulseMate API** service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Set:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste the entire JSON (starting with `{"type":...`)
6. Click **"Save Changes"**
7. **Redeploy** your service (should auto-deploy after env change)

### **Step 3: Verify**

After redeploy (2-5 minutes):
```bash
curl https://api.pulsemateconnect.in/health
```

Should show status: ok

---

## OPTION B: Heroku

```bash
cd backend

# Set the Firebase credentials
heroku config:set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' --app your-app-name

# Verify
heroku config:get FIREBASE_SERVICE_ACCOUNT_JSON --app your-app-name
```

---

## OPTION C: AWS / DigitalOcean / VPS

### **Method 1: Environment Variable**

```bash
# SSH into your server
ssh user@your-server-ip

# Edit environment file
nano /path/to/your/app/.env

# Add this line:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Save and restart
pm2 restart pulsemate-backend
# or
systemctl restart pulsemate-backend
```

### **Method 2: Secret File (More Secure)**

```bash
# Create secrets directory
mkdir -p /etc/secrets

# Create Firebase secret file
nano /etc/secrets/firebase.json

# Paste the JSON object (without quotes):
{
  "type": "service_account",
  "project_id": "pulsemateconnect",
  ...
}

# Save and set permissions
chmod 600 /etc/secrets/firebase.json

# Restart backend
pm2 restart pulsemate-backend
```

---

## OPTION D: Docker

### **Update docker-compose.yml**

```yaml
services:
  backend:
    environment:
      - FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Or use a secrets file:

```yaml
services:
  backend:
    volumes:
      - ./firebase-service-account.json:/etc/secrets/firebase.json:ro
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## 🧪 TESTING AFTER FIX

### **Step 1: Check Backend Logs**

Look for:
```
Firebase Admin SDK initialized ✅
```

NOT:
```
Firebase not configured: FIREBASE_SERVICE_ACCOUNT_JSON is missing ❌
```

### **Step 2: Test from App**

1. Open your PulseMate app
2. Enter phone number: `+91 7780132349`
3. Get OTP (you already did this - it works!)
4. Enter OTP: `774030`
5. **Click "Verify OTP"**
6. Should see: **Login successful** ✅

---

## 📋 QUICK CHECKLIST

- [ ] Copied `FIREBASE_SERVICE_ACCOUNT_JSON` from local `.env`
- [ ] Added to production server environment variables
- [ ] Redeployed/restarted backend server
- [ ] Checked backend logs for "Firebase Admin SDK initialized"
- [ ] Tested login from app
- [ ] Login successful ✅

---

## 🎯 EXPECTED RESULT

After fixing, when you enter the OTP and click "Verify OTP":

### **Before Fix:**
```
❌ "Firebase Auth is not configured. Contact support"
```

### **After Fix:**
```
✅ Login successful
✅ Welcome to PulseMate Connect
✅ User dashboard loads
```

---

## 📞 QUICK FIX GUIDE

**If you don't know where your backend is hosted:**

1. Check `backend/package.json` for deployment scripts
2. Check for `.render.yaml`, `heroku.yml`, `docker-compose.yml`
3. Check your domain DNS: `api.pulsemateconnect.in` → Points to?
4. Ask your dev team / check deployment docs

**Most likely: Render.com** (based on your setup)

---

## 🚨 SECURITY NOTE

The Firebase service account JSON contains sensitive credentials. 

✅ **DO:**
- Store in environment variables
- Use secrets management (Render Secrets, AWS Secrets Manager)
- Restrict file permissions (`chmod 600`)

❌ **DON'T:**
- Commit to Git
- Share publicly
- Store in frontend code

---

## ✅ AFTER YOU FIX IT

Come back and tell me:
- ✅ "Firebase credentials added to production"
- ✅ "Backend redeployed"
- ✅ "Login tested - SUCCESS!"

Then we can promote to production track! 🚀
