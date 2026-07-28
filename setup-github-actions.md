# 🚀 Quick Setup: GitHub Actions AAB Build

## ⚡ 3-Step Setup (5 minutes)

### Step 1: Get Expo Token (2 minutes)

1. Open: https://expo.dev/settings/access-tokens
2. Click **"Create Token"**
3. Name: `GITHUB_ACTIONS`
4. Copy the token (looks like: `ey...`)
5. **Keep this tab open** - you'll need it in Step 2

### Step 2: Add Token to GitHub (1 minute)

1. Go to your GitHub repository settings
2. Navigate: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `EXPO_TOKEN` (EXACTLY THIS)
5. Value: Paste the token from Step 1
6. Click **"Add secret"**

### Step 3: Push the Workflow (2 minutes)

Run these commands in your terminal:

```bash
# Add the workflow file
git add .github/workflows/build-android.yml

# Add the guide too
git add GITHUB-ACTIONS-BUILD-GUIDE.md setup-github-actions.md

# Commit
git commit -m "Add GitHub Actions AAB build workflow"

# Push (replace 'main' with 'master' if needed)
git push origin main
```

---

## ✅ That's It!

### Your First Build Will Start Automatically!

**Watch it live:**
1. Go to: `https://github.com/[your-username]/[your-repo]/actions`
2. Click on the **"Build Android AAB"** workflow
3. Watch the progress (5-7 minutes)

**Download your AAB:**
1. Wait for build to complete (green checkmark ✅)
2. Scroll down to **"Artifacts"** section
3. Click the AAB file to download
4. File will be named: `pulsemate-v1.3.3-vc54-[timestamp].aab`

---

## 🎯 Build Triggers

Your AAB builds automatically when:
- ✅ You push to `main` or `master` branch
- ✅ You manually trigger from GitHub Actions tab

### Manual Trigger:

1. Go to: **Actions** → **Build Android AAB**
2. Click: **"Run workflow"** button
3. Select branch and click **"Run workflow"**

---

## 🔄 Update Version Before Next Build

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.3.4",      // ← Increment
    "android": {
      "versionCode": 55      // ← Increment
    }
  }
}
```

Then commit and push:

```bash
git add app.json
git commit -m "Bump version to 1.3.4"
git push
```

Build starts automatically!

---

## 🐛 Quick Troubleshooting

### "EXPO_TOKEN not found" error
- Double-check secret name is exactly `EXPO_TOKEN`
- Make sure you added it to the correct repository
- Try generating a new token

### Build fails
- Check the error logs in GitHub Actions
- Verify `app.json` syntax is correct
- Ensure you pushed the latest code

### Can't find AAB download
- Build must complete successfully (green ✅)
- Artifacts appear at bottom of workflow run page
- Click the filename to download

---

## 📦 What You Get

Every successful build produces:
- ✅ Signed AAB file ready for Google Play
- ✅ Named with version and timestamp
- ✅ Stored for 30 days
- ✅ Downloadable anytime

---

## 💡 Pro Tips

1. **Commit often** - Each push triggers a build
2. **Watch first build** - Learn the process
3. **Download immediately** - Files expire after 30 days
4. **Keep tokens safe** - Never commit them

---

## Next Steps

1. ✅ Complete the 3 steps above
2. ✅ Watch your first build
3. ✅ Download the AAB
4. ✅ Upload to Google Play Console
5. 🎉 Done!

---

**Questions?** Check `GITHUB-ACTIONS-BUILD-GUIDE.md` for detailed docs.

**Ready to build?** Push the workflow and watch the magic happen! ✨
