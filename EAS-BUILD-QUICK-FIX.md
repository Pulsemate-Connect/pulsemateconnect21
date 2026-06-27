# ⚡ Quick Fix for EAS Build - google-services.json Issue

## Problem
EAS Build can't find `google-services.json` because the git repo root is `pulsemate123` but the app is in `PulseMateApp/` subdirectory.

## ✅ Easiest Solution (5 minutes)

### Option 1: Set Environment Variable via Web UI

1. **Open EAS Project Settings:**
   - Go to: https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/settings
   - Or navigate to: Expo Dashboard → pulsemate-app → Settings → Environment variables

2. **Create File Environment Variable:**
   - Click **"Create"** or **"New environment variable"**
   - Fill in:
     ```
     Name: GOOGLE_SERVICES_JSON
     Type: File
     Visibility: Secret
     Value: [Upload the file: PulseMateApp/google-services.json]
     Environment: production
     ```
   - Click **"Create"** or **"Save"**

3. **Rebuild:**
   ```bash
   cd c:\Users\shubh\Desktop\pulsemate123\PulseMateApp
   npx eas build --platform android --profile production
   ```

### Option 2: Simpler - Remove from .gitignore and Commit

The file is already committed, but we need to make sure EAS can find it. Since it's already in the repo at `PulseMateApp/google-services.json`, let's verify the build picks it up.

Actually, the real issue might be that EAS uploads only from `PulseMateApp/` as the working directory. Let me check the EAS working directory configuration.

### Option 3: Move Everything to Root (Most Reliable)

This eliminates the monorepo issue entirely:

```bash
# Navigate to repo root
cd c:\Users\shubh\Desktop\pulsemate123

# Create a backup branch first
git checkout -b backup-before-restructure
git push -u origin backup-before-restructure
git checkout feature/fixes-and-improvements

# Move PulseMateApp contents to root
Get-ChildItem -Path PulseMateApp -Force | Move-Item -Destination . -Force

# Remove empty PulseMateApp directory
git rm -r PulseMateApp

# Move backend to a subdirectory to keep it separate
git add .
git commit -m "refactor: move app to repository root (fix EAS build monorepo issue)"
git push

# Now build from root
npx eas build --platform android --profile production
```

## 🎯 Recommended: Option 3

Moving the app to the root is the cleanest solution and will prevent future issues. The backend can stay in its `backend/` subdirectory.

**Pros:**
- Fixes the issue permanently
- Standard Expo app structure
- No environment variable management needed
- Easier for future developers

**Cons:**
- Requires restructuring (one-time, 5 minutes)
- Backend and app in same root (but in separate subdirectories)

---

## Quick Decision Guide

**If you want the fastest fix right now:** → Option 1 (Web UI environment variable)  
**If you want the best long-term solution:** → Option 3 (Move to root)  
**If you're unsure:** → Try Option 1 first, then Option 3 if issues persist

Let me know which option you'd like to proceed with!
