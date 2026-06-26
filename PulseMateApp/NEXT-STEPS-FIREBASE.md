# 🚀 Next Steps — Add SHA-1 to Firebase & Build

## ✅ What's Complete

1. ✅ EAS Project initialized (`dc7f9afd-2b0f-4eb0-88f8-7ac7865edbd3`)
2. ✅ Keystore "PulseMate Connect" created and set as default
3. ✅ SHA-1 fingerprint generated
4. ✅ All changes committed and pushed to GitHub

---

## 🔥 ACTION REQUIRED (5 minutes)

### Step 1: Copy SHA-1 Fingerprint

**Copy this entire line:**
```
83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72
```

### Step 2: Add SHA-1 to Firebase Console

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
   - Make sure you're signed in to your Google account

2. **Navigate to Your App:**
   - Scroll down to **"Your apps"** section
   - Find the **Android icon** with package name `in.pulsemateconnect.app`
   - If you don't see it, you may need to add the Android app first

3. **Add SHA-1 Fingerprint:**
   - Click **"Add fingerprint"** button (or "+" icon)
   - Paste: `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`
   - Click **"Save"**

4. **Verify:**
   - You should see the SHA-1 listed under "SHA certificate fingerprints"
   - Status should show a green checkmark

### Step 3: Restrict Firebase API Key

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pulsemateconnect

2. **Find Your API Key:**
   - Look for: `AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc`
   - Click the **pencil icon** (Edit) next to it

3. **Add Application Restrictions:**
   - Under **"Application restrictions"**, select **"Android apps"**
   - Click **"Add an item"**
   - Enter:
     - **Package name:** `in.pulsemateconnect.app`
     - **SHA-1 certificate fingerprint:** `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`
   - Click **"Done"**
   - Click **"Save"** at the bottom

4. **Verify:**
   - The API key should now show "Android apps" under restrictions
   - Package `in.pulsemateconnect.app` should be listed

---

## 📦 Step 4: Build Production AAB (15 minutes)

Once steps 1-3 are complete, run this command:

```bash
cd c:\Users\shubh\Desktop\pulsemate123\PulseMateApp
npx eas build --platform android --profile production
```

**What this does:**
- Builds an Android App Bundle (.aab) for Play Store
- Uses the "PulseMate Connect" keystore for signing
- Uploads to EAS servers
- Provides download link when complete

**Build time:** ~10-15 minutes

**During the build:**
- EAS will ask if you want to push changes to Git (say yes if needed)
- You can monitor progress at: https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds
- You'll get a notification when the build completes

**After build completes:**
- Download the `.aab` file from the EAS dashboard
- You'll upload this to Play Console in the next step

---

## 📱 Step 5: Create Play Store Listing (30 minutes)

### 5.1 Create App in Play Console

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name:** PulseMate Connect
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:** Check all boxes
4. Click **"Create app"**

### 5.2 Upload AAB to Internal Testing

1. In Play Console, go to: **Testing → Internal testing**
2. Click **"Create new release"**
3. Click **"Upload"** and select the `.aab` file from step 4
4. **Release name:** 1.0.0 (version 2)
5. **Release notes:**
   ```
   Initial internal testing release
   - Phone authentication with OTP
   - Find nearby clinics
   - Book appointments
   - View medical records
   - Receive notifications
   ```
6. Click **"Save"** → **"Review release"** → **"Start rollout to Internal testing"**

### 5.3 Fill Store Listing

Use the content from `store-listing/` directory:

1. **Short description** (80 chars):
   - Copy from: `store-listing/short-description.txt`
   - Paste in: **Main store listing → Short description**

2. **Full description** (4000 chars):
   - Copy from: `store-listing/full-description.txt`
   - Paste in: **Main store listing → Full description**

3. **App icon:**
   - Already configured in `app.json`
   - EAS will include it in the build

4. **Feature graphic** (1024×500 px):
   - Create using: Logo + "Smart Healthcare at Your Fingertips"
   - Upload in: **Main store listing → Graphics → Feature graphic**

5. **Screenshots** (min 2):
   - Take from emulator or device
   - Upload in: **Main store listing → Graphics → Phone screenshots**

### 5.4 Complete Data Safety Form

1. Go to: **App content → Data safety**
2. Click **"Start"**
3. Use answers from: `store-listing/data-safety.md`
4. Copy/paste each answer for:
   - Data collection and security
   - Data types
   - Data usage and handling
   - Privacy policy URL: `https://pulsemateconnect.in/privacy`

### 5.5 Fill Remaining Content

1. **App category:**
   - Category: **Medical**
   - Tags: healthcare, doctor appointment, telemedicine

2. **Contact details:**
   - Email: your-email@domain.com
   - Phone: (optional)
   - Website: https://pulsemateconnect.in

3. **Content rating:**
   - Complete questionnaire (Medical app)
   - Target age: All ages

---

## 📊 Current Status

| Task | Status | Time |
|---|---|---|
| EAS project initialized | ✅ DONE | — |
| Keystore created | ✅ DONE | — |
| SHA-1 generated | ✅ DONE | — |
| Add SHA-1 to Firebase | ⚠️ **DO NOW** | 2 mins |
| Restrict API key | ⚠️ **DO NOW** | 3 mins |
| Build production AAB | ⏳ NEXT | 15 mins |
| Create Play Console listing | ⏳ NEXT | 30 mins |
| Upload AAB | ⏳ NEXT | 5 mins |
| Fill Data Safety form | ⏳ NEXT | 10 mins |
| Create assets (graphic + screenshots) | ⏳ NEXT | 20 mins |

**Total time remaining: ~1-1.5 hours**

---

## 🔗 Quick Links

- **Firebase Console (Add SHA-1):** https://console.firebase.google.com/project/pulsemateconnect/settings/general
- **Google Cloud Console (Restrict API):** https://console.cloud.google.com/apis/credentials?project=pulsemateconnect
- **EAS Builds Dashboard:** https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds
- **Play Console:** https://play.google.com/console
- **Store Listing Content:** `c:\Users\shubh\Desktop\pulsemate123\PulseMateApp\store-listing\`

---

## ⚠️ Important Notes

1. **Do NOT skip SHA-1 step** — Phone authentication will fail without it
2. **Keep KEYSTORE-CREDENTIALS.md secure** — Never commit to Git (already in .gitignore)
3. **Download AAB after build** — You'll need it for Play Console
4. **Test internal release** — Before submitting to production

---

## 🎯 Start Here

**Right now, you should:**
1. Open: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Add SHA-1: `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`
3. Open: https://console.cloud.google.com/apis/credentials?project=pulsemateconnect
4. Restrict API key to `in.pulsemateconnect.app` with SHA-1
5. Run: `npx eas build --platform android --profile production`

Then come back when the build completes (check email for notification).
