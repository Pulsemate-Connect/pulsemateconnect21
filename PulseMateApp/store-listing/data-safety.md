# Data Safety Form — Google Play Console
## PulseMate Connect (com.pulsemate.app)

Paste these answers in Play Console → App Content → Data Safety.

---

## Does your app collect or share any of the required user data types?
**Yes**

---

## Is all of the user data collected by your app encrypted in transit?
**Yes** — all API calls use HTTPS (TLS 1.2+)

---

## Do you provide a way for users to request that their data is deleted?
**Yes** — Profile → Delete Account (anonymizes all PII, cancels appointments)

---

## DATA COLLECTED

### Personal info
| Data type | Collected | Shared | Required/Optional | Purpose |
|---|---|---|---|---|
| Name | ✅ Yes | ❌ No | Optional | Display on appointment slips |
| Phone number | ✅ Yes | ❌ No | Required | Login via OTP (Firebase Auth) |
| Email address | ✅ Yes | ❌ No | Optional | Account notifications |

### Health & fitness
| Data type | Collected | Shared | Required/Optional | Purpose |
|---|---|---|---|---|
| Health info (blood group, allergies, conditions) | ✅ Yes | ❌ No | Optional | Shared with treating doctor during appointment |

### Location
| Data type | Collected | Shared | Required/Optional | Purpose |
|---|---|---|---|---|
| Approximate location | ✅ Yes | ❌ No | Optional | Find nearby clinics and doctors |
| Precise location | ✅ Yes | ❌ No | Optional | Find nearby clinics and doctors |

### Financial info
| Data type | Collected | Shared | Required/Optional | Purpose |
|---|---|---|---|---|
| Purchase history | ✅ Yes | ❌ No | Required | Appointment payment records |

### App activity
| Data type | Collected | Shared | Required/Optional | Purpose |
|---|---|---|---|---|
| App interactions | ✅ Yes | ❌ No | Required | App functionality (appointment history) |

---

## DATA NOT COLLECTED
- Contacts
- SMS / call logs
- Photos / videos
- Files
- Calendar
- Device or other identifiers beyond Firebase UID

---

## NOTES FOR REVIEWER
- Phone numbers are verified via Firebase Phone Authentication
- Health data is stored on secure servers (PostgreSQL, Render.com, Singapore region)
- Payment processing handled by Razorpay — PulseMate does not store card details
- FCM tokens stored for push notifications only, deleted on logout/account deletion
