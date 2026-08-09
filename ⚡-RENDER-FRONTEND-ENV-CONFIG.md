# ⚡ Configure Frontend Environment on Render

**IMPORTANT**: The frontend `.env` file should NOT be committed to Git.  
It's only for local development. For production, configure in Render dashboard.

---

## 🎯 Required Environment Variables on Render

### Frontend Service Configuration

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `https://pulsemate-backend.onrender.com/api` | Backend API endpoint |

---

## 📋 Step-by-Step: Add Environment Variable to Render

### 1. Open Render Dashboard
- Go to: https://dashboard.render.com
- Login with your account

### 2. Navigate to Frontend Service
- Click on **"pulsemate-frontend"** (or your frontend service name)
- You should see the service details page

### 3. Go to Environment Tab
- Click **"Environment"** in the left sidebar menu
- You'll see a list of current environment variables (if any)

### 4. Add New Environment Variable
- Click the **"Add Environment Variable"** button
- Enter the following:
  ```
  Key:   VITE_API_URL
  Value: https://pulsemate-backend.onrender.com/api
  ```
- Click **"Save Changes"**

### 5. Wait for Automatic Redeploy
- Render will automatically trigger a new build with the environment variable
- Monitor the **"Logs"** tab to see the deployment progress
- Look for: `VITE_API_URL=https://pulsemate-backend.onrender.com/api` in build logs

### 6. Verify Deployment
Once deployed, test the login:
- Open your frontend URL
- Open browser DevTools (F12) → Network tab
- Try to log in
- Verify the request goes to: `https://pulsemate-backend.onrender.com/api/auth/login`

---

## 🔍 Verify Environment Variable in Build Logs

When Render builds your frontend, you should see:

```
==> Running build command 'npm install && npm run build'...
==> Using environment variables:
    VITE_API_URL=https://pulsemate-backend.onrender.com/api

> pulsemate-frontend@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 1435 modules transformed.
```

If you DON'T see `VITE_API_URL` in the environment variables list, the login button won't work.

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T Commit `.env` Files
```bash
# This is WRONG:
git add frontend/.env
git commit -m "Add env file"
```

The `.env` file is already in `.gitignore` and should stay there.

### ✅ DO Configure in Render Dashboard
Environment variables should be set in:
- **Local development**: `frontend/.env` (git-ignored)
- **Render production**: Render dashboard → Environment tab

### ❌ DON'T Forget the VITE_ Prefix
Vite requires all environment variables to start with `VITE_`:
```bash
# This WON'T work:
API_URL=https://...

# This WILL work:
VITE_API_URL=https://...
```

### ❌ DON'T Use Runtime Variables
Vite bakes environment variables into the build at **build time**, not runtime:
```javascript
// This gets replaced during build:
const url = import.meta.env.VITE_API_URL;

// NOT like Node.js where process.env works at runtime!
```

---

## 🔧 Optional: Add More Environment Variables

If you want to enable Firebase notifications later:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

For Razorpay integration:
```
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## 📱 Local Development

For local development, you can use the `frontend/.env` file I created:

```env
VITE_API_URL=https://pulsemate-backend.onrender.com/api
```

**To run locally**:
```bash
cd frontend
npm run dev
```

The dev server will automatically load variables from `.env` file.

---

## 🐛 Troubleshooting

### Login Button Still Not Working?

**Step 1**: Verify environment variable is set
- Go to Render dashboard → Frontend service → Environment
- Check that `VITE_API_URL` is listed

**Step 2**: Check build logs
- Click on latest deployment
- Search for `VITE_API_URL` in logs
- If not found, the variable wasn't used during build

**Step 3**: Force rebuild
```bash
git commit --allow-empty -m "chore: rebuild with env vars"
git push origin main
```

**Step 4**: Check browser network tab
- Open DevTools (F12) → Network
- Try to login
- Check the URL of the POST request
- Should be: `https://pulsemate-backend.onrender.com/api/auth/login`
- If it's something else, env var not configured correctly

---

## ✅ Success Checklist

- [ ] `VITE_API_URL` added to Render environment variables
- [ ] Render automatically redeployed
- [ ] Build logs show the environment variable
- [ ] Login button makes request to correct backend URL
- [ ] Login works successfully

---

**Status**: 🟡 Environment variable created locally, needs to be configured on Render

**Next Step**: Add `VITE_API_URL` to Render frontend service environment variables
