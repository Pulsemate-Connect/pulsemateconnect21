# Firebase Package Name Mismatch Fix

## Problem
Your Firebase Android app is registered with:
- **Package name:** `in.pulsemateconnect.app`
- **App ID:** `1:157620382332:android:a13dffbc9a712ac2e6b7f9`

But your `app.json` uses:
- **Package name:** `com.pulsemate.app`

This mismatch will break Phone Authentication and any Firebase services.

---

## ✅ Solution 1: Re-register Android App (Recommended)

### Step 1: Delete the Incorrect Android App
1. Go to: https://console.firebase.google.com
2. Select project: **pulsemateconnect**
3. Click ⚙️ → **Project settings**
4. Scroll to **"Your apps"**
5. Find the Android app with package `in.pulsemateconnect.app`
6. Click the 3 dots (⋮) → **Delete app**
7. Confirm deletion

### Step 2: Register with Correct Package Name
1. In the same **"Your apps"** section
2. Click **"Add app"** → **Android**
3. Enter:
   ```
   Android package name: com.pulsemate.app
   App nickname: PulseMate
   ```
4. Click **"Register app"**

### Step 3: Download New google-services.json
1. Download the new `google-services.json` file
2. Verify it contains:
   ```json
   "package_name": "com.pulsemate.app"
   ```
3. Save to: `c:\Users\shubh\Desktop\pulsemate123\PulseMateApp\google-services.json`

---

## ⚠️ Solution 2: Change Your App Package Name (Not Recommended)

If you want to keep the Firebase registration as-is, update your app:

### Update app.json
Change package name from `com.pulsemate.app` to `in.pulsemateconnect.app`:

```json
"android": {
  "package": "in.pulsemateconnect.app",
  ...
},
"ios": {
  "bundleIdentifier": "in.pulsemateconnect.app"
}
```

**Cons:**
- Play Store listing URLs will use `in.pulsemateconnect.app`
- Less professional package name format
- All existing build artifacts become invalid

---

## 🎯 Recommended Action

**Use Solution 1** - Re-register with `com.pulsemate.app`:
- Cleaner package name
- Matches your existing configuration
- No code changes required
- Better for Play Store branding

Let me know once you've re-registered, and I'll update the project files.
