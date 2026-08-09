# 🔑 OPTION B: Upload Original Keystore & Rebuild - Complete Guide

**Status:** ✅ Version incremented to 82  
**Next:** Upload keystore and rebuild

---

## 📋 WHAT YOU NEED

Before starting, make sure you have:
- [ ] Keystore password (REQUIRED)
- [ ] Key password (might be same as keystore password)
- [ ] Key alias: `f1a185ee3a5ba7802fd6698297601ca8`
- [ ] Terminal/PowerShell open

**Keystore files available:**
1. `c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks`
2. `c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks`

---

## 🎯 STEP-BY-STEP INSTRUCTIONS

### STEP 1: Open Terminal

1. Press: `Windows Key + R`
2. Type: `powershell`
3. Press: `Enter`

### STEP 2: Navigate to Project

Copy-paste this command:
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
```
Press `Enter`

### STEP 3: Run EAS Credentials

Type:
```bash
eas credentials
```
Press `Enter`

---

## 📺 INTERACTIVE MENU WALKTHROUGH

### Screen 1: Select Platform
```
? Select platform › - Use arrow-keys. Return to submit.
❯ Android
  iOS
  Exit
```
**Action:** Press `Enter`

---

### Screen 2: Select Build Profile
```
? Which build profile do you want to configure? › - Use arrow-keys. Return to submit.
  development
  preview
  apk
❯ production
```
**Action:** Use arrow keys to select `production`, press `Enter`

---

### Screen 3: Main Menu
```
✔ Using build profile: production

What do you want to do? › - Use arrow-keys. Return to submit.
❯ Keystore
  Google Service Account Key
  FCM Server Key
  Go back
```
**Action:** Press `Enter` (Keystore selected)

---

### Screen 4: Current Keystore Info
```
? Keystore › - Use arrow-keys. Return to submit.
  View credentials
❯ Set up a new keystore
  Remove Keystore
  Go back
```
**Action:** Arrow down to select `Set up a new keystore`, press `Enter`

---

### Screen 5: Upload or Generate
```
? How would you like to set up your Keystore? › - Use arrow-keys. Return to submit.
❯ Upload an existing keystore
  Generate new keystore
```
**Action:** Press `Enter` (Upload selected)

---

### Screen 6: Keystore File Path

```
? Path to keystore file: _
```

**Type EXACTLY (option 1):**
```
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks
```

**OR (option 2):**
```
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks
```

**Press `Enter`**

---

### Screen 7: Keystore Password

```
? Keystore password: _
```

**Type:** Your keystore password  
**Press `Enter`**

**⚠️ CRITICAL:** If password is wrong, you'll get an error. Try the other keystore file.

---

### Screen 8: Key Alias

```
? Key alias: _
```

**Type EXACTLY:**
```
f1a185ee3a5ba7802fd6698297601ca8
```

**Press `Enter`**

---

### Screen 9: Key Password

```
? Key password: _
```

**Type:** Your key password (might be same as keystore password)  
**Press `Enter`**

---

### Screen 10: Upload Processing

```
⠋ Uploading keystore...
```

Wait... (~5-10 seconds)

**Success:**
```
✔ Keystore uploaded successfully
```

---

### Screen 11: Verify SHA-1

**Back at keystore menu:**
```
? Keystore › - Use arrow-keys. Return to submit.
❯ View credentials
  Set up a new keystore
  Remove Keystore
  Go back
```

**Action:** Press `Enter` (View credentials)

**Should show:**
```
Keystore Credentials [some-id]
  SHA1 Fingerprint:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
  SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6 ✅
```

**⚠️ VERIFY SHA-1 MATCHES: `0B:84:89:11:44:B1:B8:DB...`**

**If SHA-1 matches:** ✅ Success! Continue to Screen 12  
**If SHA-1 different:** ❌ Wrong keystore, try the other file

---

### Screen 12: Exit

Press any key to continue, then:

```
? Keystore › - Use arrow-keys. Return to submit.
  View credentials
  Set up a new keystore
  Remove Keystore
❯ Go back
```

**Action:** Arrow down to `Go back`, press `Enter`

Keep selecting `Go back` until you see:
```
✔ All done!
```

---

## 🚀 STEP 4: Build with Correct Keystore

Now build the AAB with the uploaded keystore:

```bash
eas build --platform android --profile production --clear-cache
```

**Press `Enter`**

**Watch for this critical line within 30 seconds:**
```
√ Using Keystore from configuration: [keystore-id]
```

**Verify:** Check build logs to confirm SHA-1: `0B:84:89:11:44:B1:B8:DB...`

**Build time:** ~10 minutes

---

## ✅ STEP 5: Download and Upload

### After Build Completes:

**You'll see:**
```
√ Build finished
🤖 Android app: https://expo.dev/artifacts/eas/[hash].aab
```

### Download AAB:
Click the link to download

### Upload to Play Console:
1. Go to: https://play.google.com/console
2. Select: **PulseMate Connect**
3. Navigate: **Production** → **Create new release**
4. Upload: AAB file (Build 82)
5. Should be **ACCEPTED** ✅ (SHA-1 matches!)
6. Fill release notes
7. Submit for review

---

## 🚨 TROUBLESHOOTING

### Problem: "Keystore was tampered with, or password was incorrect"

**Solution:**
- Wrong password OR wrong keystore file
- Try the OTHER keystore file:
  - If you tried `keystore.jks`, try `@pulsemateconnect__pulsemate-app.jks`
  - If you tried `@pulsemateconnect__pulsemate-app.jks`, try `keystore.jks`

### Problem: SHA-1 doesn't match after upload

**Solution:**
- You uploaded wrong keystore
- Run `eas credentials` again
- Select: Keystore → Remove Keystore
- Try uploading the OTHER keystore file

### Problem: Don't know keystore password

**Options:**
1. Try common passwords: `android`, `123456`, project name
2. Check password manager, emails, documentation
3. Contact previous developer
4. **Last resort:** Go back to Option A (Play App Signing with auto-generated keystore)

### Problem: Build uses wrong keystore

**Check build logs:**
```bash
eas build:view [build-id]
```

Look for which keystore was used

**If wrong keystore:**
- Run `eas credentials` again
- Verify correct keystore is set for production profile
- Rebuild

---

## 📊 EXPECTED RESULTS

### Before (Auto-generated keystore):
```
Keystore: fWuNBo7oSr
SHA-1:    [Different]
Result:   ❌ Requires Play App Signing
```

### After (Original keystore):
```
Keystore: [new-id]
SHA-1:    0B:84:89:11:44:B1:B8:DB... ✅
Result:   ✅ Direct acceptance by Play Console
```

---

## ⏱️ TIMELINE

- **Step 1-3:** 10-15 minutes (upload keystore)
- **Step 4:** 10 minutes (build)
- **Step 5:** 5 minutes (upload to Play Console)
- **Total:** ~25-30 minutes

---

## ✅ SUCCESS CHECKLIST

- [ ] Opened terminal
- [ ] Navigated to project directory
- [ ] Ran `eas credentials`
- [ ] Selected: Android → production → Keystore
- [ ] Uploaded keystore file
- [ ] Provided: keystore password, key alias, key password
- [ ] Verified: SHA-1 matches `0B:84:89:11:44:B1:B8:DB...`
- [ ] Exited credentials menu
- [ ] Ran: `eas build --platform android --profile production --clear-cache`
- [ ] Build completed successfully
- [ ] Downloaded AAB
- [ ] Uploaded to Play Console
- [ ] Accepted! ✅

---

## 🎯 YOUR COMMANDS

**Copy these and run in your terminal:**

```bash
# 1. Navigate to project
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# 2. Upload keystore (interactive)
eas credentials

# 3. Build with correct keystore
eas build --platform android --profile production --clear-cache
```

---

## 💡 TIPS

- **Be patient** with interactive menus
- **Read carefully** before pressing Enter
- **Have passwords ready** before starting
- **Verify SHA-1** after upload
- **Check build logs** to confirm correct keystore
- **Don't panic** if something goes wrong - you can retry

---

## 📞 IF YOU GET STUCK

**Password issues:**
- Check: `UPLOAD-ORIGINAL-KEYSTORE.md` for password help
- Try: Both keystore files
- Consider: Switching to Option A (Play App Signing)

**Technical issues:**
- Check build logs: `eas build:list`
- View specific build: `eas build:view [build-id]`
- Check credentials: `eas credentials`

---

**Ready? Open your terminal and run the commands above!** 🚀

**Good luck!** 🍀
