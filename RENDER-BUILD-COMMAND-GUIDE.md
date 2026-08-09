# 📋 RENDER BUILD COMMAND - VISUAL GUIDE

**Current Status:** Migration not run yet  
**Action:** Update Build Command in Render

---

## 🎯 EXACT STEPS TO FOLLOW

### Step 1: Open Render Dashboard
```
https://dashboard.render.com/
```

---

### Step 2: Find Your Service

Look for your backend service (probably named):
- `pulsemateconnect-api` 
- `pulsemateconnect-backend`
- or similar

**Click on it**

---

### Step 3: Go to Settings

On the left sidebar, click **"Settings"**

---

### Step 4: Find Build Command

Scroll down until you see a section called **"Build & Deploy"**

You'll see fields like:
- Build Command
- Start Command
- etc.

---

### Step 5: Update Build Command

**Current value might be:**
- `npm install`
- or blank
- or something else

**Change it to EXACTLY this:**
```
npm install && npm run build
```

**Important:** 
- Copy and paste exactly
- No extra spaces
- Use `&&` (two ampersands)

---

### Step 6: Save Changes

Click the **"Save Changes"** button at the bottom

**Render will show:** "Changes saved"

---

### Step 7: Deploy

**Go back to your service dashboard** (click service name at top)

**Click "Manual Deploy"** button (usually top right, blue button)

**Select "Deploy latest commit"**

**Click "Deploy"**

---

### Step 8: Wait for Deployment

**Watch the "Events" tab:**

You'll see:
1. "Build started" ⏳
2. "Build succeeded" ✅
3. "Deploy started" ⏳
4. "Deploy live" ✅

**Watch the "Logs" tab:**

Look for these lines:
```
==> Installing dependencies...
==> Running build command: npm install && npm run build
==> Running: npm run build
Applying migration `add_otp_attempt_table`...
✅ Migration applied successfully
✅ Prisma Client generated
==> Starting server...
Server running on port 5000
```

**Time:** 5-10 minutes

---

## ✅ WHEN YOU SEE "DEPLOY LIVE"

Come back here and type **"ready"**

I'll test immediately and we should see:
- ✅ API returns verificationId
- ✅ **SMS arrives on your phone!** 📱

---

## 🚨 TROUBLESHOOTING

### "I can't find Build Command field"

- Make sure you're in **"Settings"** tab (not Environment)
- Scroll down - it's in "Build & Deploy" section
- Look for a text field labeled "Build Command"

### "Save Changes button is disabled"

- Make sure you actually changed the text
- Try clicking in the field first, then paste the command

### "Deployment keeps failing"

- Check Logs tab for error message
- Look for red text with error details
- Share the error with me

---

## 📸 WHAT YOU SHOULD SEE

**In Settings:**
```
┌─────────────────────────────────────────┐
│ Build & Deploy                          │
├─────────────────────────────────────────┤
│                                         │
│ Build Command:                          │
│ ┌─────────────────────────────────────┐ │
│ │ npm install && npm run build        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Start Command:                          │
│ ┌─────────────────────────────────────┐ │
│ │ npm start                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│        [Save Changes]                   │
└─────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST

Before you come back:

- [ ] Opened Render Dashboard
- [ ] Found your backend service
- [ ] Clicked Settings tab
- [ ] Found "Build Command" field
- [ ] Changed it to: `npm install && npm run build`
- [ ] Clicked "Save Changes"
- [ ] Clicked "Manual Deploy"
- [ ] Selected "Deploy latest commit"
- [ ] Deployment started (Events tab shows activity)
- [ ] Waited for "Deploy live" message
- [ ] Checked Logs for migration success

---

## ⏰ TIMELINE

| Step | Time |
|------|------|
| Update Build Command | 1 min |
| Click Deploy | 30 sec |
| Wait for Deployment | 5-10 min |
| Test API | 1 min |
| **Total** | **7-12 min** |

---

## 🎉 SUCCESS = SMS ON YOUR PHONE!

Once deployment completes and you type "ready":
- I'll test the API
- You should receive SMS
- We'll verify OTP
- Then you can build the mobile app! 🚀

---

**Go update that Build Command now!**  
**Come back when you see "Deploy live"!**
