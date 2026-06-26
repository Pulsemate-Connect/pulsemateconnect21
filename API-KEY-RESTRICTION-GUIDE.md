# 🔒 Firebase API Key Restriction Guide

## Current API Key
```
AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc
```

This key is used in:
- `PulseMateApp/src/config/firebase.js`
- `PulseMateApp/google-services.json`

---

## Why Restrict the API Key?

**Security:** Prevents unauthorized apps from using your Firebase services and running up costs.

**Required restrictions:**
- Package name: `in.pulsemateconnect.app`
- SHA-1 fingerprint: `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`

---

## Method 1: Restrict in Google Cloud Console (Recommended)

### Step-by-Step Instructions

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pulsemateconnect
   - Make sure project "pulsemateconnect" is selected in the top dropdown

2. **Find Your API Key**
   - Look in the "API Keys" section
   - Find the key ending in: `...KEDBc` (last 5 chars of AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc)
   - The name might be "Android key (auto created by Firebase)" or similar

3. **Edit the Key**
   - Click the pencil icon (✏️) next to the key
   - You'll see the "Edit API key" screen

4. **Add Application Restrictions**
   - Under **"Application restrictions"** section:
     - **Select:** "Android apps" (NOT "None")
   
   - Click **"+ ADD AN ITEM"** button
   
   - In the popup, enter:
     ```
     Package name: in.pulsemateconnect.app
     SHA-1 certificate fingerprint: 83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72
     ```
   
   - Click **"DONE"** to close the popup

5. **Save Changes**
   - Scroll to the bottom
   - Click **"SAVE"** button
   
6. **Verify**
   - After saving, you should see:
     - "Application restrictions: Android apps"
     - Your package name listed: `in.pulsemateconnect.app`

---

## Method 2: Restrict in Firebase Console (Alternative)

If you can't find the key in Google Cloud Console, you can also restrict it through Firebase:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
   - Scroll to "Your apps"

2. **Find Android App**
   - Click on the Android app (`in.pulsemateconnect.app`)

3. **Check API Key**
   - You should see the API key listed
   - Click on the key to view/edit restrictions

4. **Add Restrictions**
   - Follow the same steps as Method 1

---

## Common Issues & Solutions

### Issue: "Key is required" Error
**Cause:** This appears when switching from "None" to "Android apps" restriction.

**Solution:** This is normal! Just continue adding your package name and SHA-1, then save. The error will disappear once you add at least one Android app.

### Issue: Can't Find the API Key
**Solution:** 
1. Check that you're in the right project: "pulsemateconnect"
2. Look for keys with name containing "Firebase" or "Android"
3. Check the last 5 characters match: `KEDBc`

### Issue: Multiple API Keys Shown
**Solution:** 
- Look for the one with Firebase-related name
- Or check which one is used in your `google-services.json`
- Restrict the one matching: `AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc`

### Issue: Can't Save - "Add at least one item"
**Solution:** 
- Make sure you clicked "DONE" after entering package name + SHA-1
- The item should appear in the list before you click "SAVE"

---

## What Happens After Restriction?

### ✅ Still Works
- Your Android app with package `in.pulsemateconnect.app` signed with the SHA-1 fingerprint
- Phone authentication
- All Firebase services

### ❌ Will Fail
- Unauthorized apps trying to use your Firebase project
- Apps with different package names
- Apps signed with different keystores

**This is good!** It's exactly what we want for security.

---

## Testing After Restriction

Once you've restricted the API key:

1. **Build the app:**
   ```bash
   npx eas build --platform android --profile production
   ```

2. **Install on device/emulator**

3. **Test phone authentication:**
   - Go to Login screen
   - Enter phone number
   - Verify OTP works

4. **If authentication fails:**
   - Check SHA-1 is correct in Firebase Console
   - Check package name matches exactly: `in.pulsemateconnect.app`
   - Wait 5-10 minutes for restrictions to propagate

---

## API Key Details Summary

| Field | Value |
|---|---|
| **API Key** | `AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc` |
| **Project** | pulsemateconnect (157620382332) |
| **Package Name** | `in.pulsemateconnect.app` |
| **SHA-1** | `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72` |
| **Restriction Type** | Android apps |

---

## Screenshot Guide

When on the "Edit API key" screen, you should see:

```
┌─────────────────────────────────────────┐
│ Edit API key                             │
├─────────────────────────────────────────┤
│                                          │
│ Name: [Android key (auto created...)]   │
│                                          │
│ Key: AIzaSyA2PXJxyIZpYOG2tXHDRu95gaa... │
│                                          │
│ Application restrictions:                │
│   ○ None                                 │
│   ● Android apps                         │
│   ○ HTTP referrers                       │
│   ○ IP addresses                         │
│                                          │
│   Package name                    SHA-1  │
│   ┌───────────────────────────────────┐ │
│   │ in.pulsemateconnect.app        83...│ │
│   └───────────────────────────────────┘ │
│   [+ ADD AN ITEM]                        │
│                                          │
│ API restrictions:                        │
│   ● Don't restrict key                   │
│   ○ Restrict key                         │
│                                          │
│                          [SAVE] [CANCEL] │
└─────────────────────────────────────────┘
```

Make sure "Android apps" is selected and your package appears in the list before clicking SAVE.

---

## ⚠️ Important: Don't Delete the Key!

**DO NOT** delete this API key! Your app needs it to communicate with Firebase. Only add restrictions to secure it.

---

## Ready to Proceed?

Once you've successfully saved the API key restrictions:

✅ SHA-1 added to Firebase Console  
✅ API key restricted in Google Cloud Console  

**Next step:** Build production AAB
```bash
cd c:\Users\shubh\Desktop\pulsemate123\PulseMateApp
npx eas build --platform android --profile production
```
