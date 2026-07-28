# 🚀 GitHub Actions AAB Build Guide

## Overview

This guide shows you how to build Android AAB files automatically using GitHub Actions (FREE & unlimited builds). This bypasses Windows path limitations.

---

## 📋 Prerequisites

1. **GitHub Repository**: Your code needs to be on GitHub
2. **Expo Account**: You need an Expo account (free)
3. **Expo Access Token**: For authentication

---

## 🔧 One-Time Setup (5 minutes)

### Step 1: Get Your Expo Access Token

1. Go to: https://expo.dev/accounts/[your-username]/settings/access-tokens
2. Click "Create Token"
3. Name it: `GITHUB_ACTIONS_BUILD`
4. Copy the token (you'll need it in the next step)

### Step 2: Add Token to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste the token from Step 1
6. Click **Add secret**

### Step 3: Commit and Push the Workflow

The workflow file has been created at `.github/workflows/build-android.yml`

Now push it to GitHub:

```bash
git add .github/workflows/build-android.yml
git commit -m "Add GitHub Actions AAB build workflow"
git push origin main
```

*(Replace `main` with `master` if that's your branch name)*

---

## 🚀 How to Build

### Method 1: Automatic Build (on every push)

The AAB will build automatically whenever you:
- Push code to `main` or `master` branch
- Make any commit to these branches

### Method 2: Manual Build (trigger anytime)

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Build Android AAB** workflow (left sidebar)
4. Click **Run workflow** button (right side)
5. Select branch: `main`
6. Click **Run workflow**

---

## 📦 Download Your AAB

### After Build Completes (~5-7 minutes):

1. Go to **Actions** tab
2. Click on the latest **Build Android AAB** run
3. Scroll down to **Artifacts** section
4. Click the AAB file to download
   - Example: `pulsemate-v1.3.3-vc54-20260728-1430.aab`

### File Naming Convention:

```
pulsemate-v{version}-vc{versionCode}-{date}-{time}.aab
```

Example:
- `pulsemate-v1.3.3-vc54-20260728-1430.aab`
  - Version: 1.3.3
  - Version Code: 54
  - Built: 2026-07-28 at 14:30

---

## 🎯 Current Build Configuration

- **Version**: 1.3.3
- **Version Code**: 54
- **Package**: `in.pulsemateconnect.patient`
- **Build Type**: Release (signed AAB)

---

## 📊 Build Status

You can check build status in real-time:

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the live logs

**Build Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Setup Java 17
4. ✅ Setup Expo
5. ✅ Install dependencies
6. ✅ Run Expo prebuild
7. ✅ Build AAB (Gradle)
8. ✅ Upload artifact

**Typical Build Time**: 5-7 minutes

---

## 🔄 Update Version Before Building

Before triggering a build, update version in `app.json`:

```json
{
  "expo": {
    "version": "1.3.4",  // ← Update this
    "android": {
      "versionCode": 55  // ← Increment this
    }
  }
}
```

Then commit and push:

```bash
git add app.json
git commit -m "Bump version to 1.3.4 (vc55)"
git push origin main
```

The build will start automatically!

---

## 🐛 Troubleshooting

### Build Fails with "Expo Token" Error

**Problem**: Missing or invalid `EXPO_TOKEN`

**Solution**:
1. Check token is added in GitHub Settings → Secrets
2. Name must be exactly: `EXPO_TOKEN`
3. Generate a new token if needed

### Build Fails with "Gradle" Error

**Problem**: Gradle build issues

**Solution**:
1. Check the build logs in GitHub Actions
2. Look for specific error messages
3. Usually related to dependencies or configuration

### Can't Find AAB File

**Problem**: No artifacts after build

**Solution**:
1. Check if build completed successfully (green checkmark)
2. Scroll down to **Artifacts** section at bottom of workflow run
3. AAB only appears if build succeeded

### Build Takes Too Long

**Problem**: Build stuck or very slow

**Solution**:
- First build takes 5-7 minutes (normal)
- Subsequent builds are faster (~3-4 minutes)
- Check GitHub Actions status page if issues persist

---

## 💰 Cost

**GitHub Actions is FREE for public repositories!**

Free tier includes:
- ✅ 2,000 minutes/month (private repos)
- ✅ Unlimited minutes (public repos)
- ✅ Unlimited storage for artifacts (30 days retention)

Your builds typically use:
- ~5-7 minutes per build
- ~1 GB storage per AAB

---

## 🎉 Benefits Over Local Build

| Feature | Local Windows | GitHub Actions |
|---------|---------------|----------------|
| Path limitation | ❌ Fails | ✅ Works |
| Build time | N/A (fails) | 5-7 minutes |
| Setup required | Complex | 5 minutes |
| Cost | Free | Free |
| Automatic | No | Yes |
| Works offline | N/A | No (needs internet) |
| Cloud storage | No | Yes (30 days) |

---

## 📝 Additional Features

### Email Notifications

GitHub will email you when:
- Build starts
- Build succeeds
- Build fails

Configure in: GitHub Settings → Notifications

### Build Badge

Add build status badge to README:

```markdown
![Build Status](https://github.com/[username]/[repo]/actions/workflows/build-android.yml/badge.svg)
```

### Scheduled Builds

Add to workflow file for daily builds:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
```

---

## 🔐 Security Notes

1. **Never commit these files to GitHub:**
   - `google-services.json` (already in `.gitignore`)
   - `.env` files with secrets
   - Keystore files (`.jks`)

2. **Expo Token**:
   - Keep it secret
   - Rotate periodically
   - Revoke if compromised

3. **AAB Files**:
   - Download and delete from GitHub after use
   - Don't share publicly
   - Keep originals backed up

---

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs for error messages
2. Verify all secrets are configured
3. Ensure `app.json` is valid
4. Check Expo account is active

---

## 🎯 Quick Reference Commands

```bash
# Commit workflow
git add .github/workflows/build-android.yml
git commit -m "Add GitHub Actions build"
git push

# Update version and trigger build
# 1. Edit app.json (bump version)
git add app.json
git commit -m "Bump version to 1.3.4"
git push

# Check build status
# Go to: https://github.com/[username]/[repo]/actions
```

---

## ✅ Checklist

Before first build:

- [ ] Expo account created
- [ ] Expo access token generated
- [ ] Token added to GitHub secrets as `EXPO_TOKEN`
- [ ] Workflow file committed and pushed
- [ ] Repository on GitHub (public or private)
- [ ] `app.json` has correct version info

Ready to build:

- [ ] Code is pushed to GitHub
- [ ] Version updated in `app.json`
- [ ] Triggered build (auto or manual)
- [ ] Waited 5-7 minutes
- [ ] Downloaded AAB from Artifacts

---

**Last Updated**: 2026-07-28  
**Status**: Ready to use ✅  
**Next Step**: Push workflow to GitHub and trigger your first build!
