# 🚀 START HERE - Deploy PulseMate Connect to Render

## ✅ Your Code is Ready!

All code has been pushed to GitHub:
- Repository: https://github.com/Pulsemate-Connect/pulsemateconnect21
- Branch: `main`
- Status: ✅ Ready to deploy

---

## 🎯 Deploy in 3 Steps (10 minutes)

### Step 1: Connect GitHub to Render
1. Open https://render.com/dashboard
2. Sign in with GitHub (or create account)
3. Click **New +** button (top right)
4. Select **Blueprint**
5. Click **Connect a repository**
6. Choose: **Pulsemate-Connect/pulsemateconnect21**
7. Click **Apply**

**Wait 3-5 minutes** while Render creates:
- ✅ PostgreSQL database
- ✅ Backend API service
- ✅ Frontend web application

---

### Step 2: Add Environment Variables (CRITICAL)

After deployment completes, go to **pulsemate-backend** service:

1. Click **Environment** tab (left sidebar)
2. Add these 2 CRITICAL variables:

#### Firebase Service Account (Required)
```
Name: FIREBASE_SERVICE_ACCOUNT_JSON
Value: Copy from Firebase Console
```

**How to get this:**
1. Go to https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts
2. Click **"Generate new private key"** button
3. A JSON file will download
4. Open it in notepad
5. Copy the ENTIRE content
6. Paste into Render (keep it as single line)

#### 2Factor API Key (Required)
```
Name: TWO_FACTOR_API_KEY
Value: Get from 2Factor dashboard
```

**How to get this:**
1. Go to https://2factor.in/dashboard
2. Copy your API key
3. Paste into Render

3. Click **Save Changes**
4. Render will automatically redeploy (wait 2-3 minutes)

---

### Step 3: Test Your Deployment

#### Test Backend
Open in browser or run:
```bash
curl https://pulsemate-backend.onrender.com/health
```

Should see:
```json
{
  "status": "ok",
  "service": "PulseMate API",
  "version": "1.0.0"
}
```

#### Test Frontend
Open in browser:
```
https://pulsemate-frontend.onrender.com
```

Should see your login page!

---

## ✅ You're Done!

Your application is now live on Render! 🎉

### URLs:
- **Backend API:** https://pulsemate-backend.onrender.com
- **Frontend Web:** https://pulsemate-frontend.onrender.com
- **Database:** Managed by Render (auto-connected)

---

## 🔧 Optional: Add Custom Domains

If you want to use your own domain (e.g., api.pulsemateconnect.in):

1. Go to service → **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records at your domain provider

📋 See `RENDER-DEPLOYMENT-GUIDE.md` for detailed DNS instructions.

---

## 📱 Optional: Configure Razorpay & Cloudinary

If you're using payments or image uploads, add these environment variables:

### Razorpay (for payments)
```
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

### Cloudinary (for image uploads)
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

## 🐛 Troubleshooting

### Backend won't start?
- Check **Logs** tab in Render dashboard
- Verify environment variables are set correctly
- Make sure Firebase JSON is valid (no syntax errors)

### Frontend not loading?
- Check build logs for errors
- Ensure backend is running first
- Try clearing browser cache

### Need more help?
📋 See detailed guides:
- `RENDER-SETUP-CHECKLIST.md` - Step-by-step checklist
- `RENDER-DEPLOYMENT-GUIDE.md` - Comprehensive guide
- `DEPLOYMENT-STATUS.md` - Full deployment info

---

## 🎯 Quick Links

- **Render Dashboard:** https://render.com/dashboard
- **Firebase Console:** https://console.firebase.google.com/project/pulsemateconnect
- **2Factor Dashboard:** https://2factor.in/dashboard
- **GitHub Repo:** https://github.com/Pulsemate-Connect/pulsemateconnect21

---

## 📞 What's Next?

1. ✅ Deploy to Render (you're doing this now!)
2. ✅ Test authentication flows
3. ✅ Configure custom domains (optional)
4. ✅ Test with real users
5. ✅ Monitor logs and performance
6. ✅ Set up backups
7. ✅ Configure monitoring/alerts

---

**Ready to deploy?** Follow Step 1 above! 🚀

---

**Last Updated:** July 27, 2026  
**Deployment Time:** ~10 minutes  
**Status:** ✅ READY
