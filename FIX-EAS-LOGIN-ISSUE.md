# 🔐 FIX: EAS Authentication Issue

**Error:** `Entity not authorized` - You don't have permissions to build this project.

**Current Login:** `shubhamskkk` (shubham27052002@gmail.com)  
**Project Owner:** `pulsemateconnect` (from app.json)

---

## 🎯 SOLUTION OPTIONS

### OPTION 1: Log In as Project Owner Account (Recommended)

If you have access to the `pulsemateconnect` Expo account:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Log out current user
eas logout

# Log in as project owner
eas login
# Enter credentials for: pulsemateconnect account
```

**Then verify:**
```bash
eas whoami
# Should show: pulsemateconnect
```

**Then build:**
```bash
eas build --platform android --profile production --clear-cache
```

---

### OPTION 2: Change Project Owner to Your Account

If you want to use your current account (`shubhamskkk`), change the project owner:

#### Step 1: Update app.json
Edit `app.json` and change the owner:

```json
{
  "expo": {
    "owner": "shubhamskkk",  // Changed from "pulsemateconnect"
    ...
  }
}
```

#### Step 2: Re-link the project
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Remove old project link
rm .expo/settings.json

# Re-create project under your account
eas init

# Follow prompts to create new project
```

#### Step 3: Upload Keystore to Your Account
Since the keystore is in the `pulsemateconnect` account, you'll need to upload it:

```bash
eas credentials

# Navigate: Android → production → Keystore
# Select: "Set up a new keystore"
# Select: "Upload an existing keystore"
# Browse to: credentials/android/keystore.jks or @pulsemateconnect__pulsemate-app.jks
# Enter keystore password
# Enter key alias: f1a185ee3a5ba7802fd6698297601ca8
# Enter key password
```

#### Step 4: Verify SHA-1
Make sure the uploaded keystore has SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`

#### Step 5: Build
```bash
eas build --platform android --profile production --clear-cache
```

---

### OPTION 3: Request Access from Project Owner

If someone else owns the `pulsemateconnect` account, ask them to:

1. Go to: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/settings
2. Navigate to: **Members** or **Permissions**
3. Add your account: `shubhamskkk` with **Admin** or **Write** permissions
4. You'll receive an email invitation
5. Accept the invitation
6. Try building again

---

## 🔍 WHY THIS HAPPENED

Your `app.json` has:
```json
{
  "expo": {
    "owner": "pulsemateconnect",  // Project owner account
    "extra": {
      "eas": {
        "projectId": "216bb6b9-f49f-41f1-902d-6cab4313a858"  // Project ID
      }
    }
  }
}
```

This means:
- Project belongs to `pulsemateconnect` Expo account
- You're logged in as `shubhamskkk` 
- You don't have permission to build this project

---

## ⚡ QUICKEST SOLUTION

**If you have access to `pulsemateconnect` account credentials:**

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Logout
eas logout

# Login as project owner
eas login
# Enter pulsemateconnect credentials

# Verify
eas whoami
# Should show: pulsemateconnect

# Configure keystore (IMPORTANT!)
eas credentials
# Select: Android → production → Keystore
# Select: "Use a different Keystore"
# Select: yKf5TaJ1Kx (SHA-1: 0B:84:89:11...)

# Build
eas build --platform android --profile production --clear-cache
```

---

## 🚨 CRITICAL KEYSTORE NOTE

**Regardless of which option you choose**, you MUST ensure:

1. The keystore with SHA-1 `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F` is used
2. This is keystore ID `yKf5TaJ1Kx` in the `pulsemateconnect` account
3. If you switch to your own account, you must upload this same keystore file

**Otherwise, Google Play Console will reject the AAB!**

---

## 📋 CHECKLIST

Choose ONE option and complete these steps:

### For Option 1 (Log in as pulsemateconnect):
- [ ] Run: `eas logout`
- [ ] Run: `eas login` (use pulsemateconnect credentials)
- [ ] Verify: `eas whoami` shows `pulsemateconnect`
- [ ] Run: `eas credentials` (select yKf5TaJ1Kx)
- [ ] Run: `eas build --platform android --profile production --clear-cache`

### For Option 2 (Change to your account):
- [ ] Edit `app.json`: Change owner to `shubhamskkk`
- [ ] Run: `eas init` (create new project)
- [ ] Upload keystore with correct SHA-1
- [ ] Run: `eas build --platform android --profile production --clear-cache`

### For Option 3 (Request access):
- [ ] Contact `pulsemateconnect` account owner
- [ ] Request admin/write permissions
- [ ] Accept invitation
- [ ] Run: `eas build --platform android --profile production --clear-cache`

---

## 🎯 RECOMMENDED: OPTION 1

If you have access to `pulsemateconnect` account, use Option 1:
- Fastest solution
- Keystore already configured
- No project re-creation needed
- Just login and build

---

## 📞 NEXT STEPS

1. **Choose an option** from above
2. **Follow the steps** for that option
3. **Build the AAB**
4. **Upload to Play Console**

---

**You need to resolve the authentication issue before you can build!** 🔐
