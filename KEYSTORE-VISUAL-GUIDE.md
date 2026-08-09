# 🎯 Visual Guide: Set Keystore to yKf5TaJ1Kx

## 📝 OPEN YOUR TERMINAL AND RUN:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas credentials
```

---

## 👁️ WHAT YOU'LL SEE (Visual Guide)

### Screen 1: Select Platform
```
? Select platform › - Use arrow-keys. Return to submit.
❯ Android          ← PRESS ENTER HERE
  iOS
  Exit
```
**Action:** Press **Enter** (Android is already selected)

---

### Screen 2: Select Build Profile
```
? Which build profile do you want to configure? › - Use arrow-keys. Return to submit.
  development
  preview
  apk
❯ production      ← PRESS ENTER HERE
```
**Action:** Use **Down Arrow** to select `production`, then press **Enter**

---

### Screen 3: Main Menu
```
✔ Using build profile: production

What do you want to do? › - Use arrow-keys. Return to submit.
❯ Keystore         ← PRESS ENTER HERE
  Google Service Account Key
  FCM Server Key
  Go back
```
**Action:** Press **Enter** (Keystore is already selected)

---

### Screen 4: Keystore Menu
```
? Keystore › - Use arrow-keys. Return to submit.
  View credentials
  Set up a new keystore
❯ Use a different Keystore    ← SELECT THIS!
  Remove Keystore
  Go back
```
**Action:** Use **Down Arrow** twice to select `Use a different Keystore`, then press **Enter**

---

### Screen 5: SELECT CORRECT KEYSTORE ⚠️ CRITICAL!
```
? Select a Keystore › - Use arrow-keys. Return to submit.
❯ Keystore yKf5TaJ1Kx (SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F)    ← SELECT THIS ONE! ✅
  Keystore 8Xpt79mt7A (SHA1: 56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61)    ← DO NOT SELECT! ❌
  Go back
```

**⚠️ CRITICAL:** Make sure `yKf5TaJ1Kx` is highlighted (it should be at the top)

**Action:** Press **Enter** to select `yKf5TaJ1Kx`

---

### Screen 6: Confirmation
```
✔ Selected Keystore: yKf5TaJ1Kx

Press any key to continue...
```
**✅ SUCCESS!** You've set the correct keystore!

**Action:** Press any key

---

### Screen 7: Verify (Optional)
```
? Keystore › - Use arrow-keys. Return to submit.
❯ View credentials    ← PRESS ENTER TO VERIFY
  Set up a new keystore
  Use a different Keystore
  Remove Keystore
  Go back
```
**Action (Optional):** Press **Enter** to view and verify

**Should show:**
```
Keystore Credentials yKf5TaJ1Kx
  SHA1 Fingerprint:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
  SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6 ✅

Press any key to continue...
```

---

### Screen 8: Exit
```
? Keystore › - Use arrow-keys. Return to submit.
  View credentials
  Set up a new keystore
  Use a different Keystore
  Remove Keystore
❯ Go back         ← SELECT THIS
```
**Action:** Use **Down Arrow** to select `Go back`, press **Enter**

**Repeat "Go back" until you see:**
```
✔ All done!
```

---

## 🚀 AFTER CONFIGURING KEYSTORE

Now run the build:

```bash
eas build --platform android --profile production --clear-cache
```

**⚠️ CRITICAL: Watch for this line within 30 seconds:**
```
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default) ✅
```

**If you see `yKf5TaJ1Kx`:**
- ✅ Perfect! Let the build continue (~10 minutes)

**If you see `8Xpt79mt7A`:**
- ❌ Press **Ctrl+C** immediately
- ❌ Run `eas credentials` again and repeat the steps

---

## 🎯 QUICK REFERENCE

### Correct Keystore (Select This):
```
ID:      yKf5TaJ1Kx
SHA-1:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
```

### Wrong Keystore (Do NOT Select):
```
ID:      8Xpt79mt7A
SHA-1:   56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61 ❌
```

---

## 📋 CHECKLIST

- [ ] Opened terminal/PowerShell
- [ ] Navigated to project directory
- [ ] Ran `eas credentials`
- [ ] Selected: Android → production → Keystore
- [ ] Selected: "Use a different Keystore"
- [ ] **Selected: yKf5TaJ1Kx (the correct one!)**
- [ ] Confirmed selection
- [ ] Verified (optional)
- [ ] Exited credentials menu
- [ ] Ready to build!

---

## 🎊 AFTER THIS IS DONE

You'll be ready to build Build 81 with the correct keystore!

**Next command:**
```bash
eas build --platform android --profile production --clear-cache
```

---

## 💡 TIPS

- Use **Arrow Keys** to navigate menus
- Press **Enter** to select
- Press **Esc** to go back
- Read carefully before selecting
- Look for `yKf5TaJ1Kx` (starts with 0B:84:89:11...)

---

**Now open your terminal and run the commands!** 🚀

Good luck! 🍀
