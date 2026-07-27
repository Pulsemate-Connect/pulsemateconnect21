# 🏗️ Build AAB File Locally - Complete Guide

## ✅ Prerequisites Checklist

Before building, ensure you have:
- [x] Java Development Kit (JDK 17)
- [x] Android SDK
- [x] Gradle
- [x] Keystore file (for signing)
- [x] All dependencies installed

---

## 📋 Step-by-Step Build Process

### Step 1: Verify Prerequisites

```bash
# Check Java version (should be 17)
java -version

# Check Gradle
cd android
.\gradlew --version

# Should show Gradle 8.x
```

---

### Step 2: Clean Previous Builds

```bash
# From project root
cd android

# Clean previous builds
.\gradlew clean

# Remove old AAB files
Remove-Item app\build\outputs\bundle\release\*.aab -ErrorAction SilentlyContinue
```

---

### Step 3: Update Version Code (Optional)

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 52  // Increment from 51
        versionName "1.3.1"  // Update version
    }
}
```

---

### Step 4: Verify Keystore Configuration

Check `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=keystore.jks
MYAPP_UPLOAD_KEY_ALIAS=pulsemateconnect
MYAPP_UPLOAD_STORE_PASSWORD=your_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

Check `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
}
```

---

### Step 5: Build the AAB File

```bash
# From android directory
.\gradlew bundleRelease --no-daemon

# This will take 5-10 minutes
# You'll see:
# > Task :app:bundleRelease
# BUILD SUCCESSFUL
```

---

### Step 6: Locate the AAB File

```bash
# AAB file location
.\android\app\build\outputs\bundle\release\app-release.aab

# Copy to project root for easy access
Copy-Item android\app\build\outputs\bundle\release\app-release.aab `
  -Destination .\pulsemate-v1.3.1-vc52.aab
```

---

### Step 7: Verify the AAB File

```bash
# Check file size (should be 40-60 MB)
Get-Item .\pulsemate-v1.3.1-vc52.aab | Select-Object Name, Length

# Verify signing
cd android
.\gradlew :app:bundleRelease --console=plain | Select-String -Pattern "signing"
```

---

## 🚀 Alternative: Quick Build Script

Create `build-aab.ps1` in project root:

```powershell
# Build AAB Script
Write-Host "🏗️  Building PulseMate Connect AAB..." -ForegroundColor Cyan

# Step 1: Clean
Write-Host "`n📦 Cleaning previous builds..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean
Set-Location ..

# Step 2: Build
Write-Host "`n🔨 Building release AAB..." -ForegroundColor Yellow
Set-Location android
.\gradlew bundleRelease --no-daemon
Set-Location ..

# Step 3: Copy AAB
Write-Host "`n📋 Copying AAB file..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$aabName = "pulsemate-v1.3.1-$timestamp.aab"
Copy-Item android\app\build\outputs\bundle\release\app-release.aab -Destination $aabName

# Step 4: Done
Write-Host "`n✅ AAB file created: $aabName" -ForegroundColor Green
Get-Item $aabName | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}

Write-Host "`n📍 Location: $(Get-Location)\$aabName" -ForegroundColor Cyan
Write-Host "🚀 Ready to upload to Google Play Console!" -ForegroundColor Green
```

**Run it:**
```bash
.\build-aab.ps1
```

---

## 🐛 Troubleshooting

### Error: "Keystore was tampered with, or password was incorrect"

**Solution:**
```bash
# Generate new keystore
cd android\app
keytool -genkeypair -v -storetype PKCS12 -keystore keystore.jks `
  -alias pulsemateconnect -keyalg RSA -keysize 2048 -validity 10000

# Update gradle.properties with new password
```

### Error: "SDK location not found"

**Solution:**
Create `android/local.properties`:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Error: "Execution failed for task ':app:bundleReleaseResources'"

**Solution:**
```bash
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew bundleRelease --stacktrace
```

### Error: "Out of memory"

**Solution:**
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

---

## 📱 Upload to Google Play Console

### Step 1: Go to Play Console
1. Open https://play.google.com/console
2. Select **PulseMate Connect** app
3. Go to **Production** → **Create new release**

### Step 2: Upload AAB
1. Click **Upload**
2. Select your `pulsemate-v1.3.1-vc52.aab` file
3. Wait for upload (may take 2-5 minutes)

### Step 3: Add Release Notes
```
Version 1.3.1 (Build 52)

🔔 NEW: Complete Notification System
- Real-time push notifications
- Beautiful notification center
- Scheduled appointment reminders (24h, 2h, 30m before)
- Live queue updates
- Deep linking to relevant screens

🎨 IMPROVEMENTS:
- Enhanced UI/UX across the app
- Better performance and stability
- Improved error handling

🐛 BUG FIXES:
- Fixed various issues reported by users
- Improved notification delivery
- Enhanced Firebase authentication
```

### Step 4: Review & Release
1. Review release
2. Click **Review release**
3. Click **Start rollout to Production**

---

## 🔄 Render Deployment

Good news! **Your code is already on GitHub and Render will auto-deploy!**

### Verify Render Deployment

1. Go to https://dashboard.render.com
2. Check **pulsemate-backend** service
3. Should see "Deploy in progress" or "Live"
4. Check logs for:
   ```
   [NOTIFICATION-JOB] Notification scheduler started
   [SOCKET-NOTIFICATION] Socket.IO notification service initialized
   ```

### Manual Trigger (if needed)

```bash
# Trigger manual deploy
git commit --allow-empty -m "trigger: Manual Render deployment"
git push origin main
```

### Run Database Migration on Render

1. Go to Render Dashboard → **pulsemate-backend**
2. Click **Shell** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```
4. Should see:
   ```
   Applying migration `add_notification_system`
   Migration applied successfully
   ```

---

## 📊 Post-Deployment Verification

### Backend Health Check
```bash
curl https://api.pulsemateconnect.in/health
```

Expected:
```json
{
  "status": "ok",
  "service": "PulseMate API",
  "version": "1.0.0"
}
```

### Check Notification Tables
```bash
# Render Shell
npx prisma studio
# Or query directly
psql $DATABASE_URL -c "\dt notification*"
```

Should show:
- notifications
- notification_templates
- notification_preferences
- scheduled_notifications
- notification_delivery_log
- broadcast_notifications

### Test Notification API
```bash
curl -X GET https://api.pulsemateconnect.in/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Complete Build Checklist

### Pre-Build
- [ ] Update version code in `android/app/build.gradle`
- [ ] Update version name
- [ ] Verify keystore configuration
- [ ] Clean previous builds
- [ ] Ensure all dependencies installed

### Build
- [ ] Run `.\gradlew clean`
- [ ] Run `.\gradlew bundleRelease --no-daemon`
- [ ] Wait for "BUILD SUCCESSFUL"
- [ ] Copy AAB to project root
- [ ] Rename with version number

### Post-Build
- [ ] Verify AAB file size (40-60 MB)
- [ ] Check signing configuration
- [ ] Upload to Google Play Console
- [ ] Add release notes
- [ ] Submit for review

### Render Deployment
- [ ] Code pushed to GitHub
- [ ] Render auto-deployed
- [ ] Database migration run
- [ ] Backend health check passes
- [ ] Notification tables created
- [ ] Cron jobs started

---

## 🎯 Quick Commands Reference

```bash
# Clean build
cd android
.\gradlew clean

# Build AAB
.\gradlew bundleRelease --no-daemon

# Copy AAB
Copy-Item android\app\build\outputs\bundle\release\app-release.aab `
  -Destination pulsemate-v1.3.1.aab

# Check file
Get-Item pulsemate-v1.3.1.aab

# Trigger Render deploy (if needed)
git commit --allow-empty -m "trigger: Deploy"
git push origin main
```

---

## 🆘 Need Help?

### Build Issues
- Check Java version (must be 17)
- Check Gradle version (must be 8.x)
- Ensure keystore password is correct
- Review full build logs with `--stacktrace`

### Render Issues
- Check Render dashboard for errors
- Review deployment logs
- Verify environment variables
- Run migration in Shell

### AAB Upload Issues
- Ensure version code is incremented
- Check AAB file isn't corrupted
- Verify signing certificate matches
- Review Google Play Console errors

---

**Status:** ✅ Ready to build and deploy!

**Next Steps:**
1. Run `.\gradlew bundleRelease` from `android` directory
2. Upload AAB to Google Play Console
3. Verify Render deployment (already auto-deployed!)
