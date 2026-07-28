# 🔥 YOUR FIREBASE SETUP - EXACT STEPS

**Date:** 2026-07-28  
**Status:** Ready to configure Firebase Console

---

## ✅ **STEP 1: SHA CERTIFICATES - COMPLETE**

I've generated your SHA certificates. Here they are:

### **Debug Build Certificates:**

```
SHA-1:     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
SHA-256:   FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

**Valid until:** Wednesday, 1 May, 2052 ✅

---

## 📋 **STEP 2: ADD TO FIREBASE CONSOLE** (5 minutes)

### **Copy These Exact Values:**

**SHA-1:**
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

**SHA-256:**
```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

### **Instructions:**

1. **Open Firebase Console:**
   ```
   https://console.firebase.google.com/project/pulsemateconnect/settings/general
   ```

2. **Scroll down to "Your apps" section**

3. **Find your Android app:**
   - Package name: `in.pulsemateconnect.patient`
   - Should be the second app in the list

4. **Add SHA-1 fingerprint:**
   - Click "Add fingerprint" button
   - Paste: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - Click "Save"

5. **Add SHA-256 fingerprint:**
   - Click "Add fingerprint" button again
   - Paste: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
   - Click "Save"

6. **Verify Phone Authentication is enabled:**
   - Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
   - Find "Phone" provider
   - Make sure it's **Enabled** (toggle should be green)

7. **Remove test phone numbers (IMPORTANT):**
   - Still on the Phone provider page
   - Click "Phone numbers for testing"
   - Delete any test numbers if present
   - Click "Save"

---

## 📥 **STEP 3: DOWNLOAD NEW GOOGLE-SERVICES.JSON** (2 minutes)

1. **Go back to Project Settings:**
   ```
   https://console.firebase.google.com/project/pulsemateconnect/settings/general
   ```

2. **Find your Android app:** `in.pulsemateconnect.patient`

3. **Download the config file:**
   - Click the **settings gear icon** ⚙️ (next to "Android app")
   - Click "Download google-services.json"
   - Save to your Downloads folder

4. **Verify the downloaded file:**
   - File name should be: `google-services.json`
   - File size should be around 1-2 KB
   - It should have your SHA certificates in it

---

## 🔄 **STEP 4: REPLACE FILES IN PROJECT** (1 minute)

**Option A: Using File Explorer (Easy)**

1. Open Downloads folder
2. Find `google-services.json`
3. Copy it
4. Navigate to: `C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\`
5. Paste and replace `google-services.json`
6. Navigate to: `C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\android\app\`
7. Paste and replace `google-services.json`

**Option B: Using Command Line (Fast)**

Open PowerShell and run:

```powershell
# Replace root file
copy C:\Users\shubh\Downloads\google-services.json C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\google-services.json

# Replace Android app file
copy C:\Users\shubh\Downloads\google-services.json C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\android\app\google-services.json
```

---

## ✅ **STEP 5: VERIFY CHANGES** (1 minute)

Let me verify the files for you:

<function_calls>
<invoke name="execute_pwsh">
<parameter name="command">Test-Path google-services.json