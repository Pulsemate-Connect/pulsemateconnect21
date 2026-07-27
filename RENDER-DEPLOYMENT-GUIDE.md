# 🚀 Render Deployment Guide - PulseMate Connect

## Prerequisites Checklist
- ✅ GitHub repository: https://github.com/Pulsemate-Connect/pulsemateconnect21.git
- ✅ Render account: https://render.com (sign up with GitHub)
- ✅ Firebase project configured
- ✅ 2Factor API key ready
- ✅ Razorpay credentials ready
- ✅ Cloudinary credentials ready

---

## Step 1: Push Code to GitHub

```bash
cd C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21

# Add all changes
git add .

# Commit changes
git commit -m "feat: Add production-ready dual OTP authentication system

- Implement Firebase Phone Auth for web with invisible reCAPTCHA
- Implement 2Factor SMS API for mobile
- Add JWT authentication with HttpOnly cookies and SecureStore
- Add comprehensive authentication middleware
- Add rate limiting and error handling
- Update backend routes and controllers
- Add frontend login UI and protected routes
- Add complete documentation"

# Push to GitHub
git push origin main
```

---

## Step 2: Connect Render to GitHub

1. Go to https://render.com/dashboard
2. Click **New +** → **Blueprint**
3. Select **Connect a repository**
4. Choose: `Pulsemate-Connect/pulsemateconnect21`
5. Click **Connect**

Render will automatically detect `render.yaml` and create:
- ✅ PostgreSQL Database (`pulsemate-db`)
- ✅ Backend Web Service (`pulsemate-backend`)
- ✅ Frontend Static Site (`pulsemate-frontend`)

---

## Step 3: Configure Environment Variables

### Backend Service Environment Variables

Go to **pulsemate-backend** service → **Environment** tab and add these **manually**:

#### 🔐 Firebase Configuration
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"pulsemateconnect",...}
```
**How to get:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content (single line)

#### 📱 2Factor SMS API
```bash
TWO_FACTOR_API_KEY=your_2factor_api_key_here
```
**How to get:**
1. Go to https://2factor.in/dashboard
2. Copy your API key

#### 💳 Razorpay Payment Gateway
```bash
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```
**How to get:**
1. Go to https://dashboard.razorpay.com/app/keys
2. Copy Key ID and Key Secret
3. For webhook secret: Settings → Webhooks → Create webhook
   - URL: `https://api.pulsemateconnect.in/api/payments/razorpay-webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy the webhook secret

#### ☁️ Cloudinary Image Storage
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
**How to get:**
1. Go to https://cloudinary.com/console
2. Copy Cloud Name, API Key, and API Secret

### Auto-generated Environment Variables (Already set in render.yaml)
- `JWT_ACCESS_SECRET` - Auto-generated
- `JWT_REFRESH_SECRET` - Auto-generated
- `COOKIE_SECRET` - Auto-generated
- `DATABASE_URL` - Auto-linked from PostgreSQL database
- `PORT` - Set to 5000
- `NODE_ENV` - Set to production
- `FRONTEND_URL` - https://www.pulsemateconnect.in
- `BACKEND_URL` - https://api.pulsemateconnect.in

---

## Step 4: Configure Custom Domains

### Backend Domain
1. Go to **pulsemate-backend** → **Settings** → **Custom Domain**
2. Add: `api.pulsemateconnect.in`
3. Add DNS records to your domain provider:
   ```
   Type: CNAME
   Name: api
   Value: pulsemate-backend.onrender.com
   ```

### Frontend Domain
1. Go to **pulsemate-frontend** → **Settings** → **Custom Domain**
2. Add: `www.pulsemateconnect.in`
3. Add DNS records:
   ```
   Type: CNAME
   Name: www
   Value: pulsemate-frontend.onrender.com
   ```
4. Also add root domain `pulsemateconnect.in`:
   ```
   Type: A
   Name: @
   Value: 216.24.57.1 (Render's IP)
   ```

---

## Step 5: Verify Deployment

### Check Backend Health
```bash
curl https://api.pulsemateconnect.in/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-27T..."
}
```

### Check Database Connection
```bash
curl https://api.pulsemateconnect.in/api/health/db
```

### Check Frontend
Open browser: https://www.pulsemateconnect.in

---

## Step 6: Test Authentication

### Test Firebase Phone Auth (Web)
1. Open https://www.pulsemateconnect.in
2. Enter phone number (with country code)
3. Solve reCAPTCHA
4. Enter OTP sent by Firebase
5. Should redirect to dashboard

### Test 2Factor SMS (Mobile - API Test)
```bash
# Send OTP
curl -X POST https://api.pulsemateconnect.in/api/auth/mobile/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Verify OTP
curl -X POST https://api.pulsemateconnect.in/api/auth/mobile/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

---

## Step 7: Monitor Deployment

### View Logs
1. Go to Render Dashboard
2. Click on **pulsemate-backend**
3. Go to **Logs** tab
4. Monitor for errors

### Check Build Status
- Backend: https://dashboard.render.com/web/pulsemate-backend
- Frontend: https://dashboard.render.com/static/pulsemate-frontend
- Database: https://dashboard.render.com/d/pulsemate-db

---

## Common Issues & Solutions

### 1. Build Failed - Prisma Migration Error
**Solution:** Database migrations run automatically during build. Check logs for specific errors.

### 2. Backend Health Check Fails
**Solution:** 
- Check if `DATABASE_URL` is properly linked
- Verify all required environment variables are set
- Check logs for connection errors

### 3. Firebase Authentication Not Working
**Solution:**
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is correctly set (single line JSON)
- Check Firebase Console → Authentication → Sign-in method → Phone is enabled
- Verify app is authorized in Firebase

### 4. 2Factor SMS Not Sending
**Solution:**
- Verify `TWO_FACTOR_API_KEY` is correct
- Check 2Factor dashboard for credits
- Check backend logs for API errors

### 5. CORS Errors on Frontend
**Solution:** Already configured in backend:
```javascript
// backend/src/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 6. JWT Token Not Persisting
**Solution:** 
- Web: Cookies are HttpOnly and Secure in production
- Mobile: Uses Expo SecureStore
- Check browser devtools → Application → Cookies

---

## Render Free Tier Limits

- ⏱️ Backend sleeps after 15 minutes of inactivity (first request takes ~30 seconds)
- 💾 PostgreSQL: 1GB storage, 97 hours/month free
- 🌐 750 hours/month free for web services
- 📦 100GB bandwidth/month

**To prevent backend sleep:**
- Upgrade to paid plan ($7/month)
- Or use external service to ping backend every 10 minutes

---

## Production Checklist

- [ ] All environment variables set in Render dashboard
- [ ] Custom domains configured and DNS updated
- [ ] Firebase Console → Authentication → Phone enabled
- [ ] Firebase Console → Add `api.pulsemateconnect.in` to authorized domains
- [ ] 2Factor API key verified and has credits
- [ ] Razorpay webhook configured
- [ ] Cloudinary credentials working
- [ ] Backend health check passing
- [ ] Frontend loading correctly
- [ ] Test login flow (both web and mobile endpoints)
- [ ] Check logs for any errors
- [ ] Monitor first few user registrations

---

## Quick Commands Reference

```bash
# View backend logs
render logs pulsemate-backend --tail

# Restart backend
render restart pulsemate-backend

# Check service status
render services

# Trigger manual deploy
git commit --allow-empty -m "Trigger Render deployment"
git push origin main
```

---

## Support & Documentation

- Render Docs: https://render.com/docs
- Firebase Auth: https://firebase.google.com/docs/auth
- 2Factor API: https://2factor.in/docs
- Project Documentation: See `DUAL-OTP-COMPLETE-SETUP.md`

---

## Next Steps After Deployment

1. ✅ Test all authentication flows
2. ✅ Set up monitoring and alerts
3. ✅ Configure backup strategy for PostgreSQL
4. ✅ Set up error tracking (e.g., Sentry)
5. ✅ Test payment flows with Razorpay
6. ✅ Verify email notifications
7. ✅ Load test the APIs
8. ✅ Set up CI/CD for automated deployments

---

**Deployment Status:** Ready to deploy! 🚀

Run the git commands in Step 1 to push your changes, then follow the Render setup steps.
