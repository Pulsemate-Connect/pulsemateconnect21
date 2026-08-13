# 🧪 Test Resend OTP - Step by Step

**Date:** 2026-08-12  
**Issue:** Resend OTP not working after 1 minute

---

## Exact Steps to Test

### 1. Open Browser with DevTools
- Open Chrome/Edge
- Press **F12** to open DevTools
- Click **Console** tab
- Keep it open during entire test

### 2. Start Registration
1. Go to: http://localhost:3000/clinic-partner
2. Click "Create account"
3. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - ✓ Check Terms
4. Click "Continue"

### 3. OTP Screen Should Appear
You should see:
```
✅ Heading: "Verify your email"
✅ Text: "We've sent a 6-digit OTP to test@example.com"
✅ 6 OTP input boxes
✅ Text: "Didn't receive the code? Resend in 60s"
```

### 4. Watch the Countdown
- Timer should count down: 60, 59, 58... 3, 2, 1, 0
- This takes 1 full minute
- **Wait for the full minute** - don't click anything yet

### 5. When Countdown Reaches 0
The text should change to:
```
Before: "Didn't receive the code? Resend in 0s"
After:  "Didn't receive the code? Resend OTP" (clickable link in blue)
```

**Question 1: Does the text change to "Resend OTP" (clickable link)?**
- [ ] Yes, I see "Resend OTP" as a blue clickable link
- [ ] No, it still shows "Resend in 0s"
- [ ] No, it shows nothing
- [ ] Other: ___________

### 6. Click "Resend OTP"
- Click the blue "Resend OTP" link
- **Look at the console immediately**

**Question 2: What appears in the console?**

Expected logs:
```javascript
[ClinicAuthModal] Resend OTP clicked, countdown: 0
[ClinicAuthModal] formData.mobile: 
[ClinicAuthModal] formData.email: test@example.com
[ClinicAuthModal] Resending email OTP...
[ClinicAuthModal] Email OTP resent successfully
```

**Question 3: What toast message appears?**
- [ ] "TEST MODE: Your OTP is 123456"
- [ ] "OTP sent successfully! Check your email."
- [ ] "Failed to resend OTP. Please try again."
- [ ] No toast message
- [ ] Other: ___________

**Question 4: Does the countdown reset?**
After clicking resend, the text should change back to:
```
"Didn't receive the code? Resend in 60s"
```
And count down again: 59, 58, 57...

- [ ] Yes, countdown resets to 60
- [ ] No, still shows "Resend OTP"
- [ ] No, countdown stays at 0
- [ ] Other: ___________

---

## Common Issues & What They Mean

### Issue A: "Resend OTP" link never appears
**Symptom:** After 60 seconds, still shows "Resend in 0s"  
**Cause:** Countdown timer or conditional rendering issue  
**Console log:** None  

### Issue B: Clicking does nothing
**Symptom:** Link is there, clicking does nothing  
**Console log:** May show error or nothing  
**Cause:** Event handler not connected or error in function  

### Issue C: Countdown doesn't reset
**Symptom:** Click works, toast appears, but countdown stays at 0  
**Console log:** Shows "Resending email OTP..." and "Email OTP resent successfully"  
**Cause:** Send function doesn't set countdown  

### Issue D: No toast message
**Symptom:** Click works in console but no visual feedback  
**Console log:** Shows "Resending email OTP..."  
**Cause:** API call failing or toast not configured  

---

## What to Check in Console

### 1. When page loads:
```
No specific logs yet - that's fine
```

### 2. When countdown reaches 0:
```
Nothing - countdown is just a timer
```

### 3. When you click "Resend OTP":
```javascript
[ClinicAuthModal] Resend OTP clicked, countdown: 0
[ClinicAuthModal] formData.mobile: 
[ClinicAuthModal] formData.email: test@example.com
[ClinicAuthModal] Resending email OTP...
```

### 4. If successful:
```javascript
[ClinicAuthModal] Email OTP resent successfully
// Toast should appear: "TEST MODE: Your OTP is 123456"
```

### 5. If error:
```javascript
[ClinicAuthModal] Resend OTP error: Error: [some error message]
// Toast should appear: "Failed to resend OTP. Please try again."
```

---

## Take Screenshots

Please take screenshots of:

1. **After 60 seconds** - showing the "Resend OTP" button
2. **Browser console** - after clicking "Resend OTP"
3. **Toast message** - if any appears
4. **Network tab** - showing the API call (if any)

### How to check Network tab:
1. Open DevTools (F12)
2. Click "Network" tab
3. Click "Resend OTP"
4. Look for a request to `/auth/register-email-otp/send`
5. Click on it to see details

---

## Quick Test

**Test with Mobile OTP (Login Flow):**

1. Go to http://localhost:3000/clinic-partner
2. Enter: `9999999999`
3. Click "Send One Time Password"
4. Wait 60 seconds
5. Click "Resend OTP"
6. Check console logs

This tests if the issue is specific to email or affects both flows.

---

## What I Need to Know

Please answer these questions:

1. **Does the "Resend OTP" button appear after 60 seconds?**
   - Yes / No

2. **When you click it, what happens?**
   - Nothing / Toast appears / Error message / Something else

3. **What's in the browser console after clicking?**
   - Copy and paste the console logs

4. **Does the countdown reset after clicking?**
   - Yes / No / Don't know

5. **Are you testing with EMAIL (test@example.com) or MOBILE (9999999999)?**
   - Email / Mobile / Both

---

**Instructions:**
Please follow the steps above exactly and let me know the answers to the questions. This will help me understand exactly what's happening! 🔍
