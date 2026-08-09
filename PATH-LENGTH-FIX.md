# ❌ Build Failed - Windows Path Length Issue

**Error:** `Filename longer than 260 characters`

---

## 🔍 PROBLEM

Windows has a 260-character limit for file paths. Your project path is too long:
```
C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\
```

When building with React Native Firebase, the nested node_modules create paths that exceed this limit.

---

## ✅ SOLUTION (Choose One)

### **Option 1: Enable Long Paths (Recommended)**

1. **Right-click** on `ENABLE-LONG-PATHS.ps1`
2. Select **"Run with PowerShell as Administrator"**
3. Wait for confirmation
4. **Restart your computer**
5. Try building again

OR manually:
1. Press `Win + R`
2. Type: `gpedit.msc` and press Enter
3. Navigate to: `Computer Configuration` → `Administrative Templates` → `System` → `Filesystem`
4. Double-click: **"Enable Win32 long paths"**
5. Select: **"Enabled"**
6. Click OK
7. Restart computer

### **Option 2: Move Project to Shorter Path (Faster)**

```powershell
# Move project to C:\Dev (much shorter path)
mkdir C:\Dev
xcopy "C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21" C:\Dev\pulsemate /E /I /H /Y
cd C:\Dev\pulsemate
npx expo run:android
```

### **Option 3: Use Subst Drive (Quick Fix)**

```powershell
# Create a virtual drive
subst P: "C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
cd /d P:\
npx expo run:android
```

---

## 🚀 AFTER FIX

Once paths are fixed, rebuild:

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

---

## 📝 NOTE

This is a Windows limitation, not an issue with the Firebase fix. The code changes are correct and will work once the path issue is resolved.
