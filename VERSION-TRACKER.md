# 📦 Version Tracking System

## Current Version
**Version Code:** 72  
**Version Name:** 1.3.4

---

## 🚀 How to Build AAB with Auto-Versioning

### Option 1: Automatic Version Increment + Build (RECOMMENDED)
```bash
.\build-aab-auto-version.bat
```

This script will:
1. ✅ Automatically increment version code (72 → 73)
2. ✅ Update `VERSION.txt`, `app.json`, and `android/app/build.gradle`
3. ✅ Build AAB file
4. ✅ Rollback version if build fails

### Option 2: Manual Version Increment Only
```bash
.\increment-version.bat
```

This script will:
1. ✅ Increment version code (72 → 73)
2. ✅ Update `VERSION.txt`, `app.json`, and `android/app/build.gradle`
3. ❌ Does NOT build AAB (you need to build manually)

Then build manually:
```bash
npx eas build --platform android --profile production
```

### Option 3: Check Current Version
```bash
type VERSION.txt
```

---

## 📝 Version History

| Version Code | Version Name | Date | Changes |
|--------------|--------------|------|---------|
| 72 | 1.3.4 | 2026-08-01 | Fixed Firebase OTP - Updated google-services.json with production keystore SHA-1 |
| 71 | 1.3.4 | 2026-08-01 | Fixed reCAPTCHA verifier check (version already used) |
| 70 | 1.3.4 | 2026-08-01 | Fixed hardcoded versionCode in build.gradle |
| 65 | 1.3.4 | 2026-08-01 | Previous version |
| 60 | 1.3.3 | 2026-08-01 | Previous version |
| 55 | 1.3.2 | Previous | Previous version |

---

## 🔧 Files That Track Version

1. **`VERSION.txt`** - Single source of truth for version code
2. **`app.json`** - Expo configuration (`android.versionCode`)
3. **`android/app/build.gradle`** - Native Android configuration (`versionCode`)

All three files MUST be in sync!

---

## ⚠️ Important Rules

1. **NEVER reuse version codes** - Play Store rejects duplicate version codes
2. **Always increment before building** - Use `build-aab-auto-version.bat` to avoid mistakes
3. **Track version in VERSION.txt** - This file is the master reference
4. **Update version history** - Document changes in this file after each build

---

## 🎯 Quick Commands

### Check Current Version
```bash
type VERSION.txt
```

### Manually Set Version (Emergency Only)
```bash
echo 73 > VERSION.txt
```
Then run `increment-version.bat` to sync all files.

### View Version in app.json
```bash
findstr "versionCode" app.json
```

### View Version in build.gradle
```bash
findstr "versionCode" android\app\build.gradle
```

---

## 🚨 Troubleshooting

### Problem: "Version code XX has already been used"
**Solution:** Version was already uploaded to Play Store. Run:
```bash
.\increment-version.bat
```
Then build again.

### Problem: Version mismatch between files
**Solution:** Check `VERSION.txt` first, then run:
```bash
.\increment-version.bat
```
This will sync all files to the next version.

### Problem: Need to skip a version
**Solution:**
1. Manually edit `VERSION.txt` to desired version - 1
2. Run `.\increment-version.bat`
3. Build AAB

---

## 📊 Next Build

**Next Version Code:** 73  
**Command:** `.\build-aab-auto-version.bat`

---

**Last Updated:** 2026-08-01
