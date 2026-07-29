# Windows Path Length Fix

## ❌ Error: Filename longer than 260 characters

This is a Windows limitation. The build path is too long:
```
C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\android\app\.cxx\RelWithDebInfo\6zw424e3\arm64-v8a\...
```

## ✅ Solutions

### Option 1: Enable Long Paths (Recommended)

Run as Administrator:

```powershell
# Enable long paths in Windows
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Also enable for Git
git config --global core.longpaths true
```

**Then restart your computer.**

### Option 2: Use EAS Build (Cloud Build)

Instead of building locally, use Expo's cloud build service:

```bash
eas build --profile production --platform android
```

- Builds on Expo servers (no path length issues)
- Takes 15-20 minutes
- Returns download link for AAB file
- No local build issues

### Option 3: Move Project to Shorter Path

Move your project closer to root:

```bash
# From: C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
# To: C:\pm21

# Command:
xcopy "C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21" "C:\pm21" /E /I /H

# Then build from new location:
cd C:\pm21\android
.\gradlew bundleRelease
```

## 🎯 Recommended: Use EAS Build

Since the EAS build was already started earlier, let me restart it for you!
