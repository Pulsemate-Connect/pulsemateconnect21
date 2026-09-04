# ⚡ QUICK FIX CARD - Render Environment Variables

## 🎯 Goal
Fix payment error + Enable push notifications

## ⏱️ Time: 5 minutes

---

## 📝 Step-by-Step

### 1️⃣ Go to Render
```
https://dashboard.render.com
→ Login
→ Click your backend service
```

### 2️⃣ Open Environment Tab
```
Left sidebar → Click "Environment"
```

### 3️⃣ Delete PORT
```
Find: Key = PORT (Value = 5000)
Click: 🗑️ Delete button
```

### 4️⃣ Add Firebase
```
Click: "Add Environment Variable"
Key: FIREBASE_SERVICE_ACCOUNT_JSON
Value: (Copy from below)
```

**Get the value from:**
```
Open: backend/.env file
Find: FIREBASE_SERVICE_ACCOUNT_JSON=
Copy: Everything after the = sign (entire JSON)
Paste: Into Render's Value field
```

### 5️⃣ Save & Deploy
```
Click: "Save Changes"
Wait: 2-3 minutes for deployment
Status should show: "Live" ✅
```

### 6️⃣ Test
```
Open app → Book appointment
Expected: ✅ Payment works + Notification received
```

---

## ✅ Success Checklist

- [ ] PORT deleted
- [ ] Firebase added
- [ ] Saved changes
- [ ] Deployment complete (Live)
- [ ] Booking works
- [ ] Notification received

---

## 📞 Stuck?

See detailed guide: `RENDER_STEP_BY_STEP_GUIDE.md`
