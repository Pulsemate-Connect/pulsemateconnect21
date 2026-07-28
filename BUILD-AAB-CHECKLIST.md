# ✅ AAB Build Checklist

## 🎯 Current Status

**Version**: 1.3.3  
**Version Code**: 54  
**Build Method**: GitHub Actions (Cloud)  
**Status**: Setup files created ✅

---

## 📋 Pre-Build Checklist

### Before First Build:

- [ ] **Create Expo Account** (if you don't have one)
  - Go to: https://expo.dev/signup
  
- [ ] **Get Expo Access Token**
  - Go to: https://expo.dev/settings/access-tokens
  - Click "Create Token"
  - Name: `GITHUB_ACTIONS`
  - Copy token
  
- [ ] **Add Token to GitHub**
  - Go to: Repository → Settings → Secrets → Actions
  - Click "New repository secret"
  - Name: `EXPO_TOKEN`
  - Paste token value
  - Click "Add secret"
  
- [ ] **Push Workflow to GitHub**
  ```bash
  git add .github/workflows/build-android.yml
  git add *.md
  git commit -m "Setup GitHub Actions AAB build"
  git push origin main
  ```
  
- [ ] **Verify GitHub Repository**
  - Repository is on GitHub
  - You have push access
  - Branch is `main` or `master`

---

## 🔄 Before Each Build:

- [ ] **Update Version Info**
  - Open `app.json`
  - Increment `version` (e.g., 1.3.3 → 1.3.4)
  - Increment `versionCode` (e.g., 54 → 55)
  
- [ ] **Test Locally** (optional but recommended)
  ```bash
  npm start
  # Test in Expo Go
  ```
  
- [ ] **Commit Changes**
  ```bash
  git add .
  git commit -m "Version 1.3.4 - [describe changes]"
  git push origin main
  ```

---

## 🚀 Build Process:

### Automatic Build:
- [ ] Push to `main` or `master` branch
- [ ] Build starts automatically
- [ ] Wait 5-7 minutes

### Manual Build:
- [ ] Go to GitHub → Actions tab
- [ ] Click "Build Android AAB"
- [ ] Click "Run workflow"
- [ ] Select branch
- [ ] Click "Run workflow" button
- [ ] Wait 5-7 minutes

---

## 📦 After Build:

- [ ] **Verify Build Success**
  - Check for green ✅ in Actions tab
  - No red ❌ errors
  
- [ ] **Download AAB**
  - Click on workflow run
  - Scroll to "Artifacts" section
  - Click AAB filename to download
  
- [ ] **Verify AAB File**
  - File size: ~50-80 MB
  - Filename format: `pulsemate-v1.3.3-vc54-YYYYMMDD-HHMM.aab`
  
- [ ] **Upload to Google Play Console**
  - Go to: https://play.google.com/console
  - Select app
  - Production → Create new release
  - Upload AAB
  - Fill release notes
  - Submit for review

---

## 🐛 Troubleshooting Checklist:

### If Build Fails:

- [ ] Check GitHub Actions logs
- [ ] Verify `EXPO_TOKEN` is set correctly
- [ ] Check `app.json` syntax is valid
- [ ] Ensure all dependencies are up to date
- [ ] Check for error messages in logs
- [ ] Try re-running the workflow

### If Can't Download AAB:

- [ ] Build completed successfully (green ✅)
- [ ] Scrolled down to "Artifacts" section
- [ ] Build is less than 30 days old
- [ ] Have permission to access repository

### If Upload to Play Store Fails:

- [ ] Version code is higher than previous
- [ ] Version name is different from previous
- [ ] AAB file is not corrupted
- [ ] Signing certificate matches
- [ ] Package name is correct

---

## 📊 Build History

Keep track of your builds:

| Version | Version Code | Build Date | Status | Notes |
|---------|--------------|------------|--------|-------|
| 1.3.3   | 54           | 2026-07-28 | ✅ Setup | GitHub Actions configured |
| 1.3.4   | 55           | -          | ⏳ Pending | Next build |

---

## 🎯 Quick Commands

```bash
# Update version and build
# 1. Edit app.json (increment version)
# 2. Run:
git add app.json
git commit -m "Bump version to 1.3.4"
git push

# Check build status
# Go to: https://github.com/[username]/[repo]/actions

# Download previous builds
# Go to: Actions → Build Android AAB → Select run → Artifacts
```

---

## 📞 Support Resources

**GitHub Actions Docs**: https://docs.github.com/actions  
**Expo Build Docs**: https://docs.expo.dev/build/setup/  
**Google Play Console**: https://play.google.com/console  

**Internal Docs**:
- `GITHUB-ACTIONS-BUILD-GUIDE.md` - Full documentation
- `setup-github-actions.md` - Quick setup guide

---

## ✅ Success Criteria

Your AAB build is successful when:

- ✅ GitHub Actions shows green checkmark
- ✅ AAB file appears in Artifacts
- ✅ AAB file size is 50-80 MB
- ✅ Filename includes correct version
- ✅ Google Play accepts upload
- ✅ No signing or validation errors

---

## 🎉 You're Ready!

**Next Step**: Complete the "Pre-Build Checklist" and push the workflow to GitHub!

**Estimated Time**:
- First-time setup: 5 minutes
- Each subsequent build: 5-7 minutes

**Benefits**:
- ✅ No Windows path issues
- ✅ Unlimited free builds
- ✅ Automatic on every push
- ✅ Cloud storage included
- ✅ Professional workflow

---

**Last Updated**: 2026-07-28  
**Status**: Ready to use ✅
