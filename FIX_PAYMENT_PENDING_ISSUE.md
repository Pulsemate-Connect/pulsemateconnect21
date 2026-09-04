# 🔧 FIX: Payment Showing "Something went wrong" + "Pending" Status

## 🎯 **Issues Reported**

1. **"Something went wrong" screen** appears after completing payment
2. **Status shows "Pending"** instead of showing queue number after payment

## 🔍 **Root Cause**

The issues are happening because **Razorpay credentials are missing from Render backend**.

### What's Happening:
```
1. User completes payment in Razorpay
   ↓
2. Frontend calls: POST /api/payments/verify
   ↓
3. Backend checks: if (RAZORPAY_KEY_SECRET exists)
   ↓
4. NOT FOUND on Render → Cannot verify signature
   ↓
5. Payment verification FAILS
   ↓
6. Appointment stays in "PENDING_PAYMENT" status
   ↓
7. User sees "Pending" instead of queue number
```

## ✅ **THE FIX**

You MUST add Razorpay credentials to Render environment variables!

### **Step 1: Add to Render**

1. Go to https://dashboard.render.com
2. Select your **backend service**
3. Click **Environment** tab
4. Add TWO variables:

```
Key: RAZORPAY_KEY_ID
Value: rzp_live_Sz5uowTvIY9Mwv

Key: RAZORPAY_KEY_SECRET
Value: wVhmp2dFNEQGFfytMiT5NYk1
```

5. Click **Save Changes**
6. Wait 2-3 minutes for redeploy

### **Step 2: Test Payment**

After Render redeploys:
1. Open PulseMate app
2. Book appointment
3. Complete ₹10 payment
4. **Expected**:
   - ✅ Payment successful
   - ✅ Shows queue number
   - ✅ Status: "Confirmed" (not "Pending")

---

## 🔧 **Technical Details**

### Backend Payment Verification:
```javascript
// backend/src/controllers/payment.controller.js line ~810

// ── Real Razorpay HMAC verification ───────────────────────────────────────
const expectedSig = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)  // ← NEEDS THIS!
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

if (expectedSig !== razorpaySignature) {
  // ❌ Verification fails if KEY_SECRET is missing
  await prisma.payment.update({ where: { appointmentId }, data: { status: 'FAILED' } });
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'CANCELLED' } });
  return sendError(res, 'Payment verification failed', 400);
}
```

Without `RAZORPAY_KEY_SECRET`, signature verification always fails!

### After Successful Verification:
```javascript
// Updates payment status
await prisma.payment.update({
  where: { appointmentId },
  data: { status: 'PAID', razorpayPaymentId, razorpaySignature, paidAt: new Date() },
});

// Assigns queue number and confirms appointment
const confirmed = await assignQueueAndConfirm(appointment, doctorClinic, io);
// confirmed.status = 'BOOKED'
// confirmed.queueNumber = 5 (example)

return sendSuccess(res, { verified: true, appointment: confirmed });
```

---

## 🧪 **How to Verify the Fix**

### Test 1: Check Render Logs

After adding credentials:
1. Go to Render Dashboard → Logs
2. Make a test booking
3. Look for: `[payment] verify — signature valid`
4. Should NOT see: `[payment] verify — invalid signature`

### Test 2: Check Appointment Status

After payment:
1. Open appointment details
2. Status should show: **"Confirmed"** or **"Booked"**
3. Should show: **Queue Number #5** (example)
4. Should NOT show: **"Pending"**

### Test 3: Check Database

Run this to verify:
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const appt = await prisma.appointment.findFirst({
    where: { patientId: '<patient-id>' },
    orderBy: { createdAt: 'desc' },
    include: { payment: true }
  });
  console.log('Status:', appt.status);
  console.log('Queue:', appt.queueNumber);
  console.log('Payment:', appt.payment?.status);
  await prisma.\$disconnect();
})();
"
```

---

## 📊 **Complete Fix Checklist**

- [ ] Add `RAZORPAY_KEY_ID` to Render
- [ ] Add `RAZORPAY_KEY_SECRET` to Render
- [ ] Save and wait for redeploy (2-3 min)
- [ ] Test booking with payment
- [ ] Verify status shows "Confirmed" not "Pending"
- [ ] Verify queue number is displayed
- [ ] Verify no "Something went wrong" error

---

## 🎯 **Why "Something went wrong" Appears**

The error happens because:
1. Payment verification fails (no Razorpay secret)
2. Backend returns error response
3. Frontend `RazorpayScreen` catches error
4. Navigates to `PaymentStatus` screen
5. PaymentStatus polls but payment is marked FAILED
6. Eventually times out → "Something went wrong"

After adding credentials:
1. Payment verification succeeds ✅
2. Backend returns confirmed appointment with queue
3. Frontend navigates to success screen
4. Shows queue number ✅

---

## 💡 **Additional Improvements Made**

Added better logging in `RazorpayScreen.jsx`:
```javascript
console.log('[Payment] Verification successful:', {
  appointmentId: confirmedAppt.id,
  status: confirmedAppt.status,
  queueNumber: confirmedAppt.queueNumber,
});
```

This helps debug if verification succeeds but data is missing.

---

## ⚠️ **Common Issues After Fix**

### Issue 1: Still showing "Pending" after adding credentials

**Cause:** Old appointments created before fix remain in PENDING status

**Solution:** Book a NEW appointment to test

### Issue 2: Payment succeeds but no queue number

**Cause:** Appointment type is ONLINE (online appointments don't have queue)

**Solution:** Test with OFFLINE (clinic visit) appointment

### Issue 3: "Something went wrong" still appears

**Causes:**
- Render hasn't redeployed yet (wait 3-5 minutes)
- Wrong Razorpay credentials (double-check values)
- Network issue (check Render logs)

---

## 🚀 **Summary**

**Problem 1:** "Something went wrong" after payment  
**Problem 2:** Status shows "Pending" instead of queue  

**Root Cause:** Missing `RAZORPAY_KEY_SECRET` in Render  

**Fix:** Add both Razorpay credentials to Render environment  

**Time:** 3 minutes to add, 2-3 minutes to deploy  

**Result:** Payment verification works → Status shows "Confirmed" with queue ✅

---

## 📞 **After Adding Credentials**

1. Wait for Render to show "Live" status
2. Book a NEW test appointment
3. Complete payment
4. Tell me:
   - ✅ "Works! Shows queue number"
   - or
   - ❌ "Still broken: [error message]"

**Add those Razorpay credentials to Render NOW!** 🚀

Dashboard: https://dashboard.render.com
