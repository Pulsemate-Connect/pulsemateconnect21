# 📅 PulseMate Connect - Appointment Booking Flow

## Complete Guide: How Appointments Work

This document explains the entire appointment booking flow from patient selection to queue management, including sessions, time slots, and real-world examples.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Appointment Types](#appointment-types)
3. [Clinic Sessions](#clinic-sessions)
4. [Time Slots](#time-slots)
5. [Booking Flow - Step by Step](#booking-flow-step-by-step)
6. [Queue Management](#queue-management)
7. [Payment Flow](#payment-flow)
8. [Notifications](#notifications)
9. [Real-World Examples](#real-world-examples)
10. [Edge Cases](#edge-cases)

---

## 🎯 Overview

PulseMate Connect supports **two types** of appointments:
1. **ONLINE** - Pre-scheduled appointments with specific time slots
2. **OFFLINE** - Walk-in appointments with queue management

---

## 📌 Appointment Types

### 1. ONLINE Appointment (Scheduled)

**Characteristics:**
- Patient books a **specific date and time slot**
- Requires advance booking
- Uses clinic sessions (Morning, Afternoon, Evening)
- Time-bound (e.g., 10:00 AM, 2:30 PM)
- Payment required upfront

**Example:**
```
Patient: "I want to see Dr. Sharma on August 15th at 10:30 AM"
System: Creates appointment with slotTime = "10:30"
Result: Appointment confirmed for exactly 10:30 AM
```

### 2. OFFLINE Appointment (Walk-in/Queue)

**Characteristics:**
- Patient joins a **queue** for today
- No specific time slot
- Queue position assigned (Token #1, #2, #3...)
- First-come-first-served
- Wait time estimated based on queue position

**Example:**
```
Patient: "I want to see Dr. Sharma today (walk-in)"
System: Assigns queue token #5
Result: Estimated wait = 40 minutes (4 people ahead × 10 min avg)
```

---

## 🏥 Clinic Sessions

Clinics divide their day into **sessions**. Each session has:
- **Start Time** (e.g., 09:00)
- **End Time** (e.g., 13:00)
- **Slot Duration** (e.g., 15 minutes)
- **Max Patients** (e.g., 16 slots)

### Example: Dr. Sharma's Clinic Sessions

```
┌─────────────────────────────────────────────────────────────────┐
│ Session 1: Morning                                              │
├─────────────────────────────────────────────────────────────────┤
│ Time: 09:00 AM - 01:00 PM                                       │
│ Duration: 4 hours = 240 minutes                                 │
│ Slot Duration: 15 minutes                                       │
│ Available Slots: 240 ÷ 15 = 16 slots                            │
│                                                                  │
│ Slots:                                                           │
│  ✓ 09:00 AM    ✓ 09:15 AM    ✓ 09:30 AM    ✓ 09:45 AM          │
│  ✓ 10:00 AM    ✗ 10:15 AM    ✓ 10:30 AM    ✓ 10:45 AM          │
│  ... (total 16 slots)                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Session 2: Evening                                              │
├─────────────────────────────────────────────────────────────────┤
│ Time: 05:00 PM - 09:00 PM                                       │
│ Duration: 4 hours = 240 minutes                                 │
│ Slot Duration: 15 minutes                                       │
│ Available Slots: 16 slots                                       │
│                                                                  │
│ Slots:                                                           │
│  ✓ 05:00 PM    ✓ 05:15 PM    ✓ 05:30 PM    ✓ 05:45 PM          │
│  ✓ 06:00 PM    ✓ 06:15 PM    ✗ 06:30 PM    ✓ 06:45 PM          │
│  ... (total 16 slots)                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Database Structure

```sql
-- ClinicSession Table
CREATE TABLE ClinicSession (
  id UUID PRIMARY KEY,
  clinicId UUID NOT NULL,
  name VARCHAR(100), -- "Morning", "Evening"
  startTime VARCHAR(5), -- "09:00"
  endTime VARCHAR(5), -- "13:00"
  slotDuration INT, -- 15 (minutes)
  maxPatients INT, -- 16
  enabled BOOLEAN, -- true/false
  daysOfWeek INT[] -- [1,2,3,4,5] = Mon-Fri
);
```

---

## ⏰ Time Slots

### How Slots are Generated

**Algorithm:**
```javascript
function generateSlots(startTime, endTime, slotDuration) {
  const slots = [];
  let current = parseTime(startTime); // 09:00 → 540 minutes
  const end = parseTime(endTime); // 13:00 → 780 minutes
  
  while (current < end) {
    slots.push(formatTime(current)); // 540 → "09:00"
    current += slotDuration; // 540 + 15 = 555 → "09:15"
  }
  
  return slots;
}
```

**Example:**
```
Session: 09:00 AM - 01:00 PM, Slot Duration: 15 min

Generated Slots:
09:00 AM ─┐
09:15 AM  │
09:30 AM  │
09:45 AM  ├─ 16 slots total
10:00 AM  │
10:15 AM  │
...       │
12:45 PM ─┘
```

### Slot Booking Rules

1. **One booking per slot** - Each slot can only have ONE confirmed appointment
2. **Session boundary validation** - Slot must fall within session time
3. **No overlapping** - Same doctor can't have 2 bookings at same time
4. **Date validation** - Can't book in the past

---

## 🔄 Booking Flow - Step by Step

### Scenario 1: ONLINE Appointment (Pre-scheduled)

**Patient:** Rahul wants to see Dr. Sharma on **August 15, 2026** at **10:30 AM**

#### Step 1: Patient Selects Doctor & Date

```
Mobile App → API Call
POST /api/patient/appointments
{
  "doctorId": "dr-sharma-123",
  "clinicId": "clinic-abc",
  "appointmentType": "ONLINE",
  "appointmentDate": "2026-08-15",
  "slotTime": "10:30",
  "sessionId": "morning-session-id",
  "symptoms": "Fever and cough"
}
```

#### Step 2: Backend Validates

```javascript
// Check 1: Session exists and enabled
const session = await prisma.clinicSession.findUnique({
  where: { id: sessionId }
});
// Result: Session "Morning" (09:00-13:00) ✓

// Check 2: Slot falls within session
// slotTime = 10:30
// Session: 09:00 - 13:00
// 10:30 is between 09:00 and 13:00 ✓

// Check 3: Slot not already booked
const existing = await prisma.appointment.findFirst({
  where: {
    doctorId,
    clinicId,
    appointmentDate: "2026-08-15",
    slotTime: "10:30",
    status: NOT IN ['CANCELLED', 'NO_SHOW']
  }
});
// Result: No existing booking ✓

// Check 4: Doctor available on this day
const doctorClinic = await prisma.doctorClinic.findFirst({
  where: { doctorId, clinicId }
});
// Result: Dr. Sharma works at this clinic ✓
```

#### Step 3: Create Appointment

```javascript
const appointment = await prisma.appointment.create({
  data: {
    patientId: "rahul-456",
    doctorId: "dr-sharma-123",
    clinicId: "clinic-abc",
    sessionId: "morning-session-id",
    appointmentType: "ONLINE",
    appointmentDate: new Date("2026-08-15"),
    slotTime: "10:30",
    symptoms: "Fever and cough",
    status: "BOOKED",
    queueNumber: null, // No queue for ONLINE
    estimatedWaitMinutes: 0
  }
});

// Result:
// Appointment ID: appt-789
// Status: BOOKED
// Date: August 15, 2026
// Time: 10:30 AM
```

#### Step 4: Send Notifications

```javascript
// Notify Patient
notifyAppointmentBooked(
  "rahul-456",
  "Dr. Sharma",
  "2026-08-15",
  null // No queue number
);
// Push notification: "✅ Appointment Confirmed"
// "Your appointment with Dr. Sharma is confirmed for August 15, 2026 at 10:30 AM"

// Notify Doctor
notifyDoctorNewBooking(
  "dr-sharma-123",
  "Rahul Kumar",
  "2026-08-15"
);
// Push notification: "📅 New Appointment Booked"
// "Rahul Kumar booked an appointment for August 15, 2026"
```

#### Step 5: Patient View

```
┌─────────────────────────────────────────────────────────────┐
│ Appointment Details                                         │
├─────────────────────────────────────────────────────────────┤
│ Doctor: Dr. Sharma                                          │
│ Clinic: City Care Clinic, MG Road, Bangalore               │
│ Date: August 15, 2026 (Friday)                             │
│ Time: 10:30 AM                                              │
│ Type: Pre-scheduled (ONLINE)                                │
│ Status: ✅ BOOKED                                           │
│ Symptoms: Fever and cough                                   │
│                                                              │
│ [View Details] [Cancel] [Get Directions]                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 2: OFFLINE Appointment (Walk-in with Queue)

**Patient:** Priya wants to see Dr. Patel **today** (walk-in)

#### Step 1: Patient Selects Walk-in

```
Mobile App → API Call
POST /api/patient/appointments
{
  "doctorId": "dr-patel-456",
  "clinicId": "clinic-xyz",
  "appointmentType": "OFFLINE",
  "appointmentDate": "2026-08-10", // Today
  "slotTime": null, // No specific slot
  "sessionId": null, // Or current session
  "symptoms": "Back pain"
}
```

#### Step 2: Backend Creates Queue

```javascript
// Get or create today's queue
const queue = await getOrCreateQueue(
  clinicId,
  doctorId,
  "2026-08-10", // Today
  sessionId // Current session (if any)
);

// Queue found:
// Queue ID: queue-abc-123
// Date: August 10, 2026
// Doctor: Dr. Patel
// Clinic: City Care Clinic

// Get last queue number
const lastItem = await prisma.queueItem.findFirst({
  where: { queueId: queue.id },
  orderBy: { queueNumber: 'desc' }
});

// Last queue number: 4
// New queue number: 5

// Count waiting patients
const waitingCount = await prisma.queueItem.count({
  where: { queueId: queue.id, status: 'WAITING' }
});
// Waiting: 4 patients

// Calculate estimated wait
const avgConsultation = 10; // minutes (from doctor settings)
const estimatedWait = waitingCount * avgConsultation;
// Estimated wait: 4 × 10 = 40 minutes
```

#### Step 3: Create Appointment + Queue Item

```javascript
// Create appointment
const appointment = await prisma.appointment.create({
  data: {
    patientId: "priya-789",
    doctorId: "dr-patel-456",
    clinicId: "clinic-xyz",
    appointmentType: "OFFLINE",
    appointmentDate: new Date("2026-08-10"),
    slotTime: null, // No specific time
    symptoms: "Back pain",
    status: "BOOKED",
    queueNumber: 5,
    estimatedWaitMinutes: 40
  }
});

// Create queue item
const queueItem = await prisma.queueItem.create({
  data: {
    queueId: queue.id,
    appointmentId: appointment.id,
    patientId: "priya-789",
    queueNumber: 5,
    status: "WAITING",
    position: 5 // Same as queue number initially
  }
});
```

#### Step 4: Patient View

```
┌─────────────────────────────────────────────────────────────┐
│ Walk-in Appointment                                         │
├─────────────────────────────────────────────────────────────┤
│ Doctor: Dr. Patel                                           │
│ Clinic: City Care Clinic, MG Road, Bangalore               │
│ Date: Today (August 10, 2026)                              │
│ Type: Walk-in (OFFLINE)                                     │
│ Status: ⏳ WAITING IN QUEUE                                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Your Token Number: 5                                │    │
│ │ People Ahead: 4                                      │    │
│ │ Estimated Wait: 40 minutes                           │    │
│ │ Current Token Being Served: 1                        │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ [View Queue] [Cancel] [Get Directions]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎫 Queue Management

### Queue States

```
WAITING → CALLED → IN_CONSULTATION → COMPLETED
            ↓
        MISSED (if patient doesn't show)
```

### Queue Screen (Live Updates via WebSocket)

```
┌─────────────────────────────────────────────────────────────┐
│ Live Queue - Dr. Patel (August 10, 2026)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🟢 CURRENTLY CONSULTING                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Token #1 - Amit Sharma                               │   │
│ │ Status: IN_CONSULTATION (Started: 10:15 AM)         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 📋 WAITING                                                   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Token #2 - Sunita Verma (Estimated: 10:25 AM)       │   │
│ │ Token #3 - Rajesh Kumar (Estimated: 10:35 AM)       │   │
│ │ Token #4 - Meena Patel (Estimated: 10:45 AM)        │   │
│ │ Token #5 - Priya Singh (Estimated: 10:55 AM) ← YOU  │   │
│ │ Token #6 - Arjun Reddy (Estimated: 11:05 AM)        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ✅ COMPLETED TODAY: 5 patients                              │
│ ⏸️  Queue Status: ACTIVE                                    │
│                                                              │
│ [Refresh] [Live Updates: ON]                                │
└─────────────────────────────────────────────────────────────┘
```

### Doctor Calls Next Patient

```javascript
// Doctor clicks "Call Next" button
POST /api/doctor/queue/call-next
{
  "queueId": "queue-abc-123"
}

// Backend:
1. Find next WAITING patient (Token #2)
2. Update queueItem status: WAITING → CALLED
3. Send notification to patient
4. Update previous patient: IN_CONSULTATION → COMPLETED
5. Broadcast via WebSocket to all connected clients
```

**Patient Notification:**
```
🔔 Your Turn!
Please proceed to Dr. Patel's consultation room.
Token #2
```

---

## 💳 Payment Flow

### Payment Required For Booking

```javascript
// After creating appointment (status = PENDING_PAYMENT)
const appointment = await prisma.appointment.create({
  data: {
    ...appointmentData,
    status: "PENDING_PAYMENT" // Not BOOKED yet
  }
});

// Create Razorpay order
const razorpayOrder = await razorpay.orders.create({
  amount: 500 * 100, // ₹500 in paise
  currency: "INR",
  receipt: appointment.id
});

// Return to patient
return {
  appointmentId: appointment.id,
  orderId: razorpayOrder.id,
  amount: 500,
  status: "PENDING_PAYMENT"
};
```

### Payment Success

```javascript
// Patient completes payment via Razorpay
POST /api/payments/verify
{
  "razorpayOrderId": "order_xyz",
  "razorpayPaymentId": "pay_abc",
  "razorpaySignature": "signature_123"
}

// Backend verifies signature
const isValid = verifyRazorpaySignature(...);

if (isValid) {
  // Update appointment
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "BOOKED" } // ✅ Now confirmed
  });
  
  // Create payment record
  await prisma.payment.create({
    data: {
      appointmentId,
      patientId,
      amount: 500,
      status: "PAID",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date()
    }
  });
  
  // Send confirmation notifications
  notifyAppointmentBooked(...);
  notifyDoctorNewBooking(...);
}
```

---

## 🔔 Notifications

### Notification Timeline

```
BOOKING
   ↓
Patient: "✅ Appointment Confirmed"
   ↓
Doctor: "📅 New Appointment Booked"
   ↓
[1 day before]
   ↓
Patient: "⏰ Appointment Reminder - Tomorrow at 10:30 AM"
   ↓
[Queue - Your turn]
   ↓
Patient: "🔔 Your Turn! Token #5"
   ↓
[Consultation complete]
   ↓
Patient: "✅ Consultation Completed"
   ↓
[If cancelled]
   ↓
Patient: "❌ Appointment Cancelled"
Doctor: "🚫 Booking Cancelled"
```

### Notification Content (Safe)

❌ **Never include sensitive medical info:**
```
Bad: "Your HIV test appointment is confirmed"
Bad: "Dr. Sharma - Your diabetes checkup"
```

✅ **Generic messages only:**
```
Good: "Appointment confirmed with Dr. Sharma"
Good: "Your consultation is scheduled"
Good: "Your turn for consultation"
```

---

## 📖 Real-World Examples

### Example 1: Regular Patient - Pre-scheduled

**Scenario:** Amit has a regular checkup every month

```
Date: August 15, 2026
Time: 10:00 AM
Type: ONLINE (Pre-scheduled)
Doctor: Dr. Sharma
Clinic: City Care Clinic

Timeline:
Aug 10: Books appointment (5 days in advance)
Aug 10: Payment ₹500
Aug 10: Receives confirmation notification
Aug 14: Receives reminder notification (1 day before)
Aug 15 09:50: Arrives at clinic
Aug 15 10:00: Consultation starts (on time)
Aug 15 10:15: Consultation completes
Aug 15: Receives prescription via app
```

### Example 2: Emergency Walk-in

**Scenario:** Priya has sudden back pain

```
Date: August 10, 2026 (Today)
Time: 11:00 AM arrival
Type: OFFLINE (Walk-in)
Doctor: Dr. Patel
Clinic: City Care Clinic

Timeline:
11:00 AM: Priya arrives at clinic
11:05 AM: Books walk-in via mobile app
11:05 AM: Payment ₹300
11:05 AM: Assigned Token #5 (Wait: 40 min)
11:10 AM: Checks queue - Token #1 in consultation
11:20 AM: Token #2 called
11:30 AM: Token #3 called
11:35 AM: Notification "Almost your turn"
11:40 AM: Token #4 called
11:45 AM: 🔔 Notification "Your Turn! Token #5"
11:45 AM: Priya goes to consultation room
11:50 AM: Consultation completes
```

### Example 3: Multiple Sessions

**Scenario:** Dr. Sharma works morning and evening

```
Morning Session: 09:00 AM - 01:00 PM
Evening Session: 05:00 PM - 09:00 PM

Patient bookings:
1. Rahul: 10:30 AM (Morning session, Slot #10)
2. Sunita: 06:00 PM (Evening session, Slot #4)
3. Amit: 11:00 AM (Morning session, Slot #16)

Dr. Sharma's day:
09:00 - Patient 1 (Token #1 walk-in)
09:15 - Patient 2 (Token #2 walk-in)
...
10:30 - Rahul (Pre-booked)
11:00 - Amit (Pre-booked)
...
01:00 - Lunch break
...
05:00 - Patient 1 (Evening walk-in)
05:15 - Patient 2 (Evening walk-in)
06:00 - Sunita (Pre-booked)
...
09:00 - Done for the day
```

---

## ⚠️ Edge Cases

### Case 1: Slot Already Booked (Race Condition)

**Scenario:** Two patients try to book same slot simultaneously

```
Time: 10:00:00.000
Patient A: Selects slot 10:30 AM → Sends request
Patient B: Selects slot 10:30 AM → Sends request

Backend (Transaction):
Request A arrives at 10:00:00.100
  ├─ Check slot availability → Available ✓
  ├─ Create appointment → Success
  └─ Slot now BOOKED

Request B arrives at 10:00:00.150
  ├─ Check slot availability → Already booked ✗
  └─ Return error: "Slot already booked"

Result:
Patient A: ✅ Booking confirmed
Patient B: ❌ Error - "This slot is no longer available"
```

### Case 2: Queue Number Collision

**Fixed with PostgreSQL Advisory Lock:**

```javascript
// Prevent two patients getting same queue number
await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${queueId}))`;

// Now safely get next number
const lastItem = await tx.queueItem.findFirst({
  where: { queueId },
  orderBy: { queueNumber: 'desc' }
});

const nextNumber = (lastItem?.queueNumber || 0) + 1;

// Create queue item with unique number
await tx.queueItem.create({
  data: { queueNumber: nextNumber, ... }
});
```

### Case 3: Doctor Doesn't Show Up

```
Queue Status: ACTIVE → PAUSED

All waiting patients receive notification:
"⏸️ Queue Paused"
"Dr. Patel's queue has been temporarily paused. Please wait."

When doctor resumes:
"▶️ Queue Resumed"
"Dr. Patel's queue has resumed. Please come back to the clinic."
```

### Case 4: Patient Misses Turn

```
Token #5 called
  ↓
Patient doesn't respond (5 min timeout)
  ↓
Status: CALLED → MISSED
  ↓
Next patient called (Token #6)
  ↓
Patient #5 can be added back to queue (Token #10)
```

### Case 5: Free Booking (First Appointment)

```
New patient gets first appointment FREE

Backend:
1. Check user.freeBookingUsed === false
2. Create appointment (amount = 0)
3. Mark user.freeBookingUsed = true (atomic operation)
4. Create payment record (status = PAID, amount = 0)

Prevents:
- Race condition: Two requests both seeing freeBookingUsed=false
- Using updateMany with WHERE condition ensures atomicity
```

---

## 📊 Database Schema Summary

```sql
-- Core Tables

Appointment
  ├─ appointmentType: ONLINE | OFFLINE
  ├─ appointmentDate: Date
  ├─ slotTime: "10:30" (ONLINE) or NULL (OFFLINE)
  ├─ sessionId: UUID (optional)
  ├─ queueNumber: INT (OFFLINE) or NULL (ONLINE)
  ├─ estimatedWaitMinutes: INT
  └─ status: BOOKED | CANCELLED | COMPLETED | NO_SHOW

ClinicSession
  ├─ name: "Morning" | "Evening"
  ├─ startTime: "09:00"
  ├─ endTime: "13:00"
  ├─ slotDuration: 15 (minutes)
  ├─ maxPatients: 16
  └─ enabled: true | false

Queue
  ├─ date: "2026-08-10"
  ├─ doctorId: UUID
  ├─ clinicId: UUID
  ├─ sessionId: UUID (optional)
  └─ status: ACTIVE | PAUSED | CLOSED

QueueItem
  ├─ queueNumber: 1, 2, 3, ...
  ├─ position: 1, 2, 3, ...
  ├─ status: WAITING | CALLED | IN_CONSULTATION | COMPLETED | MISSED
  └─ appointmentId: UUID

Payment
  ├─ amount: 500 (in rupees)
  ├─ status: PAID | PENDING | FAILED | REFUNDED
  ├─ razorpayOrderId: "order_xyz"
  └─ paidAt: DateTime
```

---

## ✅ Summary

**ONLINE Appointments:**
- ✓ Pre-scheduled with specific date & time
- ✓ Uses clinic sessions (Morning/Evening)
- ✓ Time slots (15-min intervals)
- ✓ No queue management
- ✓ Exact arrival time known

**OFFLINE Appointments:**
- ✓ Walk-in for today
- ✓ Queue-based (Token #1, #2, #3...)
- ✓ No specific time slot
- ✓ Real-time queue updates
- ✓ Estimated wait time

**Common Features:**
- ✓ Payment required before confirmation
- ✓ Notifications at every step
- ✓ Queue management for walk-ins
- ✓ Session-based scheduling
- ✓ Doctor availability validation

---

**Last Updated:** August 10, 2026  
**Version:** 1.0  
**Related Files:**
- `backend/src/controllers/patient.controller.js` - Booking logic
- `backend/src/controllers/payment.controller.js` - Payment flow
- `backend/src/utils/getOrCreateQueue.js` - Queue management
- `backend/prisma/schema.prisma` - Database schema
