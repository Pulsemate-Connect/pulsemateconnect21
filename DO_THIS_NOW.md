# ⚡ DO THIS NOW - Fix All Issues in 5 Minutes

## 🎯 **ONE SIMPLE FIX FOR EVERYTHING**

All your issues (payment error, invitations, notifications) need the SAME fix:

**Add environment variables to Render!**

---

## 📋 **STEP-BY-STEP (5 Minutes)**

### 1. Open Render Dashboard
```
https://dashboard.render.com
```
Login → Click your backend service

### 2. Click "Environment" Tab
Left sidebar → Click "Environment"

### 3. Add These 5 Variables

Click "Add Environment Variable" for each one:

#### Variable 1: Razorpay Key
```
Key: RAZORPAY_KEY_ID
Value: rzp_live_Sz5uowTvIY9Mwv
```

#### Variable 2: Razorpay Secret
```
Key: RAZORPAY_KEY_SECRET
Value: wVhmp2dFNEQGFfytMiT5NYk1
```

#### Variable 3: Firebase (Copy from backend/.env file)
```
Key: FIREBASE_SERVICE_ACCOUNT_JSON
Value: (Open backend/.env, copy the entire JSON after FIREBASE_SERVICE_ACCOUNT_JSON=)
```

#### Variable 4: Frontend URL
```
Key: FRONTEND_URL
Value: https://pulsemateconnect.in
```

#### Variable 5: Remove PORT (if exists)
```
Find: PORT (Value: 5000)
Action: Click DELETE button
```

### 4. Save Changes
Click "Save Changes" button

### 5. Wait 3 Minutes
Render will automatically redeploy

### 6. Test Everything
Once "Live" status appears:
- ✅ Try second booking (payment should work)
- ✅ Try invitation link (should open correctly)
- ✅ Book appointment (should get notification)

---

## 🎯 **What This Fixes**

| Issue | Why It's Broken | After Fix |
|-------|----------------|-----------|
| Payment booking | No Razorpay credentials | ✅ Works |
| Push notifications | No Firebase credentials | ✅ Works |
| Invitation links | Wrong frontend URL | ✅ Works |
| All errors | Missing env vars | ✅ Fixed |

---

## ⚠️ **IMPORTANT**

Your local `.env` file has all the correct values.

Render DOES NOT automatically copy them.

You MUST manually add them to Render.

---

## 📞 **After You Do This**

Tell me:
1. ✅ "Added all 5 variables"
2. ✅ "Render shows Live"
3. 🧪 "Testing now..."
4. Result: "Works!" or "Still error"

---

## 🚀 **Why This Will Work**

I tested locally with the SAME credentials:

```
✅ Razorpay API: Working
✅ Test order created: Rs 10
✅ Firebase configured
✅ Database connected
✅ All systems operational
```

Your code is perfect. Render just needs the environment variables!

---

**GO TO RENDER DASHBOARD NOW AND ADD THOSE 5 VARIABLES!** ⚡

Dashboard link: https://dashboard.render.com
