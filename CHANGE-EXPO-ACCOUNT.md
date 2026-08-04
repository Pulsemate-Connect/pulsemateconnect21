# 🔄 How to Change Expo Account

## ✅ Yes, You Can Change Expo Account!

This will let you use a different account's free build quota.

---

## 🎯 **Quick Steps**

### **Step 1: Logout from Current Account**

```bash
eas logout
```

or

```bash
npx expo logout
```

---

### **Step 2: Login with New Account**

```bash
eas login
```

**Enter:**
- Email/Username of new account
- Password

**Or create new account:**
```bash
eas register
```

---

### **Step 3: Verify Login**

```bash
eas whoami
```

Should show your new account username.

---

### **Step 4: Update Project Owner (Optional)**

If you want to transfer the project to the new account:

**Edit `app.json`:**
```json
{
  "expo": {
    "owner": "new-username",  ← Change this
    ...
  }
}
```

**Or keep current owner and just use different build account.**

---

### **Step 5: Build with New Account**

```bash
npx eas build --platform android --profile preview
```

**New account's free quota will be used!** ✅

---

## 📊 **Free Build Quota per Account**

| Plan | Android Builds/Month | iOS Builds/Month |
|------|---------------------|------------------|
| **Free** | 30 | 30 |
| **Production** | Unlimited | Unlimited |

**So if you create a new account, you get 30 more free builds!**

---

## ⚠️ **Important Notes**

### **1. Project Credentials**

If you change owner, you need to reconfigure credentials:

```bash
eas credentials
```

Choose:
- Use existing credentials
- Or configure new credentials

### **2. EAS Project ID**

Your project ID in `app.json` stays the same:
```json
"eas": {
  "projectId": "dc7f9afd-2b0f-4eb0-88f8-7ac7865edbd3"
}
```

**This links to the original owner.**

To transfer completely:
1. Create new project with new account
2. Update projectId in app.json
3. Reconfigure all credentials

### **3. Build History**

Old builds stay with original account.

New builds go to new account.

---

## 🚀 **Recommended Approach**

### **Option A: Just Switch Account for Builds** ⭐ **SIMPLE**

1. Logout: `eas logout`
2. Login with new account: `eas login`
3. Build: `npx eas build --platform android --profile preview`
4. New account quota is used ✅

**Project stays with original owner, but builds use new account's quota!**

---

### **Option B: Transfer Project Completely**

1. Create new EAS account
2. Create new project on new account
3. Update `app.json`:
   ```json
   "owner": "new-username",
   "eas": {
     "projectId": "new-project-id"
   }
   ```
4. Reconfigure credentials:
   ```bash
   eas credentials
   ```

**Complete transfer to new account.**

---

## 🎯 **Quick Commands**

### **Check Current Account:**
```bash
eas whoami
```

### **Logout:**
```bash
eas logout
```

### **Login:**
```bash
eas login
```

### **Register New Account:**
```bash
eas register
```

### **List Projects:**
```bash
eas project:list
```

---

## 💡 **For Your Situation**

Since you've exhausted free builds this month:

**Option 1: Create New Expo Account** (FREE)
```bash
# 1. Logout
eas logout

# 2. Create new account
eas register

# 3. Build (uses new account's quota)
npx eas build --platform android --profile preview
```

**Benefits:**
- ✅ Get 30 more free builds
- ✅ Completely FREE
- ✅ Can switch back anytime

**Option 2: Upgrade Current Account** ($29/month)
- Unlimited builds
- Priority queue
- Faster builds

---

## ✅ **Step-by-Step: Switch Account Now**

Want me to help you switch accounts? Here's the command:

```bash
# Logout from current account
eas logout

# Login with different account (or create new one)
eas login
```

After login, you can build immediately with new quota! 🚀

---

## 🔄 **Switching Back**

You can always switch back to original account:

```bash
eas logout
eas login
# Enter original account credentials
```

**All projects and credentials are preserved!**

---

**Want me to help you logout and switch accounts now?** 

Just say **"yes"** and I'll run the logout command! ✅
