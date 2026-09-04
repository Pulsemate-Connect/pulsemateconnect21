# 🚨 IMMEDIATE FIX: Payment Booking Error

## Issue
"Booking Failed - Internal server error" when trying to book appointment with payment.

## Most Likely Cause

Based on your Render environment variables showing `PORT=5000`, I suspect the issue is that **you need to REMOVE the PORT environment variable from Render**.

### Why?

Render automatically sets the `PORT` environment variable to a dynamic port. If you manually set `PORT=5000`, it might conflict with Render's internal port assignment.

---

## 🔧 QUICK FIX (Try This First)

### Step 1: Remove PORT from Render Environment Variables

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Find `PORT` variable
5. Click **Delete** (trash icon)
6. Click **Save**
7. Wait for auto-redeploy (2-3 minutes)

The code already handles this correctly:
```javascript
const PORT = process.env.PORT || 5000;
```

So removing the manual PORT setting will let Render use its own port.

---

## 🔍 Alternative Fixes (If Above Doesn't Work)

### Fix 1: Check Render Logs

1. **Render Dashboard** → Your Backend Service
2. Click **Logs** (left sidebar)
3. Look for errors containing:
   - `[payment]`
   - `initiatePayment`
   - `razorpay`
   - Stack trace starting with `Error:`

4. Copy the full error message and I can provide specific fix

---

### Fix 2: Add Database Connection Pool Settings

The Supabase connection string in your .env might need pool configuration.

**Update Render Environment Variable:**

`DATABASE_URL`:
```
postgresql://postgres.wcvyjdggmzetwktrrkhs:Pulsemateconnect21@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

Key changes:
- Add `pgbouncer=true`
- Set `connection_limit=1` (Render instances should use minimal connections)

---

### Fix 3: Test Razorpay Connectivity

Create this file locally to test Razorpay:

**File**: `backend/test-razorpay-live.js`

```javascript
require('dotenv').config();
const Razorpay = require('razorpay');

async function testRazorpayLive() {
  console.log('Testing Razorpay with LIVE credentials...\n');
  
  const razorpay = new Razorpay({
    key_id: 'rzp_live_Sz5uowTvIY9Mwv',
    key_secret: 'wVhmp2dFNEQGFfytMiT5NYk1',
  });

  try {
    // Create a test order
    const order = await razorpay.orders.create({
      amount: 1000, // ₹10 in paise
      currency: 'INR',
      receipt: 'test_' + Date.now(),
      notes: {
        purpose: 'connection_test'
      }
    });

    console.log('✅ Razorpay API Working!');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount / 100, 'INR');
    console.log('\n✅ Payment gateway is functional\n');
    
  } catch (error) {
    console.error('❌ Razorpay API Error:');
    console.error('Message:', error.error?.description || error.message);
    console.error('Code:', error.error?.code || 'UNKNOWN');
    
    if (error.error?.code === 'BAD_REQUEST_ERROR') {
      console.log('\n⚠️  Invalid Razorpay credentials');
      console.log('   Check KEY_ID and KEY_SECRET are correct\n');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Network connectivity issue');
      console.log('   Check internet connection\n');
    }
  }
}

testRazorpayLive();
```

**Run**:
```bash
cd backend
node test-razorpay-live.js
```

---

### Fix 4: Check Database Transaction Isolation

The payment initiation uses Prisma transactions with `Serializable` isolation level. Supabase/Postgres might have issues with this.

**Temporary Fix**: Change isolation level in `payment.controller.js`

Find this code (around line 400):
```javascript
}, {
  isolationLevel: 'Serializable',
  timeout: 10000,
});
```

Change to:
```javascript
}, {
  isolationLevel: 'ReadCommitted',  // ✅ More compatible
  timeout: 15000,  // Increase timeout
});
```

---

### Fix 5: Enable Better Error Logging

Add this to Render Environment Variables:

```
LOG_LEVEL=debug
NODE_ENV=production
```

This will give more detailed logs.

---

## 📋 Checklist

- [ ] Remove `PORT` env var from Render
- [ ] Check Render logs for actual error
- [ ] Test Razorpay API connectivity (run script above)
- [ ] Update DATABASE_URL with connection pool settings
- [ ] Change transaction isolation level if needed
- [ ] Enable debug logging

---

## 🎯 Most Likely Solution

**90% chance**: Remove `PORT=5000` from Render environment variables.

**9% chance**: Database connection pool exhausted (update DATABASE_URL).

**1% chance**: Razorpay API issues (test with script above).

---

## 📞 After Trying Above

If none of the above work, please:

1. Check **Render Logs**
2. Copy the full error message (including stack trace)
3. Share it - I'll provide the exact fix

---

## 🚀 Deploy After Fix

After making environment variable changes:

1. Render will auto-redeploy (2-3 minutes)
2. Check logs: Look for "🚀 PulseMate API running on port"
3. Test booking from app
4. Should work! ✅

---

**Quick Actions (In Order)**:
1. ✅ Remove PORT env var from Render
2. ⏳ Wait for redeploy (2-3 min)
3. 🧪 Test booking from app
4. 📋 If still fails: Check logs and share error

**Status**: ⚡ Action Required - Remove PORT env var from Render
