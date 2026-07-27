# ✅ Render Setup Checklist

## 🎯 Quick Start - Deploy in 10 Minutes

### Step 1: Connect GitHub to Render (2 min)
1. Go to https://render.com/dashboard
2. Click **New +** → **Blueprint**
3. Click **Connect a repository**
4. Authorize GitHub access if prompted
5. Select repository: **Pulsemate-Connect/pulsemateconnect21**
6. Click **Connect**
7. Render will automatically detect `render.yaml` and show:
   - ✅ Database: `pulsemate-db` (PostgreSQL)
   - ✅ Web Service: `pulsemate-backend` (Node.js)
   - ✅ Static Site: `pulsemate-frontend` (React)
8. Click **Apply** to start deployment

**Status:** ⏳ Wait 3-5 minutes for initial deployment

---

### Step 2: Add Required Environment Variables (5 min)

Go to **pulsemate-backend** service → **Environment** tab → Add these:

#### 🔥 Firebase Service Account (CRITICAL)
```bash
Key: FIREBASE_SERVICE_ACCOUNT_JSON
Value: {"type":"service_account","project_id":"pulsemateconnect",...}
```
**Where to get:**
1. Firebase Console: https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk
2. Click **Generate new private key**
3. Copy the ENTIRE JSON content (paste as single line)

---

#### 📱 2Factor SMS API Key
```bash
Key: TWO_FACTOR_API_KEY
Value: your_api_key_from_2factor_dashboard
```
**Where to get:** https://2factor.in/dashboard

---

#### 💳 Razorpay (Optional - for payments)
```bash
Key: RAZORPAY_KEY_ID
Value: rzp_live_xxxxx

Key: RAZORPAY_KEY_SECRET
Value: your_secret_key

Key: RAZORPAY_WEBHOOK_SECRET
Value: webhook_secret_from_razorpay
```
**Where to get:** https://dashboard.razorpay.com/app/keys

---

#### ☁️ Cloudinary (Optional - for image uploads)
```bash
Key: CLOUDINARY_CLOUD_NAME
Value: your_cloud_name

Key: CLOUDINARY_API_KEY
Value: your_api_key

Key: CLOUDINARY_API_SECRET
Value: your_api_secret
```
**Where to get:** https://cloudinary.com/console

---

### Step 3: Configure Firebase Console (2 min)

1. Go to https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
2. Click **Phone** provider
3. Ensure it's **Enabled**
4. Go to **Settings** → **Authorized domains**
5. Add these domains:
   - `api.pulsemateconnect.in`
   - `www.pulsemateconnect.in`
   - `pulsemateconnect.in`
   - `pulsemate-backend.onrender.com`
   - `pulsemate-frontend.onrender.com`

---

### Step 4: Test Deployment (1 min)

#### Test Backend Health
```bash
curl https://pulsemate-backend.onrender.com/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "PulseMate API",
  "version": "1.0.0"
}
```

#### Test Frontend
Open in browser: https://pulsemate-frontend.onrender.com

---

### Step 5: Configure Custom Domains (Optional - 5 min)

#### Backend Domain
1. Go to **pulsemate-backend** → **Settings** → **Custom Domain**
2. Add: `api.pulsemateconnect.in`
3. Add DNS record in your domain provider:
   ```
   Type: CNAME
   Name: api
   Value: pulsemate-backend.onrender.com
   TTL: 3600
   ```

#### Frontend Domain
1. Go to **pulsemate-frontend** → **Settings** → **Custom Domain**
2. Add: `www.pulsemateconnect.in`
3. Add DNS records:
   ```
   Type: CNAME
   Name: www
   Value: pulsemate-frontend.onrender.com
   TTL: 3600
   
   Type: A
   Name: @
   Value: 216.24.57.1
   TTL: 3600
   ```

**Note:** DNS propagation takes 5-30 minutes

---

## 🚨 Common Issues & Quick Fixes

### Issue 1: Build Failed
**Symptom:** Red error in Render logs
**Fix:** Check logs for specific error
- If Prisma migration error: Already handled automatically
- If missing env variable: Add it in Step 2

### Issue 2: Backend Health Check Fails
**Fix:**
1. Check **Environment** tab → Verify `DATABASE_URL` is linked
2. Check **Logs** → Look for connection errors
3. Ensure all Step 2 env variables are set

### Issue 3: Firebase Auth Not Working
**Fix:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is correct (single line)
2. Check Firebase Console → Authentication → Phone is enabled
3. Add your domain to Firebase authorized domains (Step 3)

### Issue 4: Frontend Shows CORS Error
**Fix:** Already configured in backend. If still happens:
1. Check backend logs for CORS errors
2. Verify `FRONTEND_URL` env variable matches your domain
3. Clear browser cache and hard refresh

### Issue 5: Backend Sleeps After 15 Min (Free Tier)
**Expected Behavior:** First request after sleep takes ~30 seconds
**Fix (Optional):** Upgrade to paid plan ($7/month) to keep always-on

---

## 📊 Deployment Status Dashboard

Check real-time status:
- Backend: https://dashboard.render.com/web/pulsemate-backend
- Frontend: https://dashboard.render.com/static/pulsemate-frontend
- Database: https://dashboard.render.com/d/pulsemate-db

---

## ✅ Production Readiness Checklist

After deployment is complete:

- [ ] Backend health check passing
- [ ] Frontend loads correctly
- [ ] Firebase service account JSON added
- [ ] 2Factor API key added and verified
- [ ] Test Firebase Phone Auth on web (optional)
- [ ] Test 2Factor SMS API for mobile (optional)
- [ ] Razorpay credentials added (if using payments)
- [ ] Cloudinary credentials added (if using image uploads)
- [ ] Custom domains configured (if applicable)
- [ ] DNS records updated and propagated
- [ ] Firebase authorized domains updated
- [ ] Backend logs show no errors
- [ ] Test user registration flow
- [ ] Test login flow (both web and mobile endpoints)
- [ ] Monitor first few real user sessions

---

## 🔄 Update Deployment

To deploy changes:
```bash
git add .
git commit -m "your changes"
git push origin main
```

Render will automatically rebuild and deploy (takes 3-5 minutes).

---

## 📚 Documentation Reference

- **Full Setup Guide:** `DUAL-OTP-COMPLETE-SETUP.md`
- **Architecture Guide:** `DUAL-OTP-IMPLEMENTATION-GUIDE.md`
- **File Structure:** `DUAL-OTP-IMPLEMENTATION-FILES.md`
- **Dependencies:** `DEPENDENCIES-REFERENCE.md`
- **Deployment Details:** `RENDER-DEPLOYMENT-GUIDE.md`

---

## 🆘 Need Help?

- Render Docs: https://render.com/docs
- Project Issues: https://github.com/Pulsemate-Connect/pulsemateconnect21/issues
- Firebase Support: https://firebase.google.com/support

---

**🚀 Deployment Status:** READY TO GO!

Your code is pushed to GitHub. Follow Steps 1-4 above to complete the deployment.
