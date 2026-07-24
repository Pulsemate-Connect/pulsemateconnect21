# ⚡ Twilio SMS — Quick Start (2 minutes)

## Get Twilio Credentials

1. **Sign Up**: https://www.twilio.com/try-twilio
2. **Copy Account SID**: Console → Account → API Keys
3. **Copy Auth Token**: (same page)
4. **Get Phone Number**: Console → Phone Numbers → Get Number

---

## Configure Backend

Edit `pulsemateconnect21/backend/.env`:

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Restart Backend

In terminal (ID 53), type: `rs`

---

## Test on Phone

1. Enter your number in app
2. Click "Send OTP"
3. **Check SMS inbox** (SMS should arrive!)
4. Enter code in app
5. ✅ Login successful

---

## ✅ You're Done!

Real SMS is now working. Check backend console for:
```
[Twilio] Sent. SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxx
```

If you see "[Twilio]" messages instead of "[mock]", SMS is working! 🚀
