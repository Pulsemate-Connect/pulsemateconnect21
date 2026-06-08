# First Booking Free — Implementation Tasks

## Task 1: Wire Free Booking Status into `BookAppointmentModal`
**File:** `frontend/src/pages/patient/BookAppointmentModal.jsx`

### Subtasks
- [ ] Import `getBookingStatus` from `../../api/payment.api`
- [ ] Add `bookingStatus` state: `const [bookingStatus, setBookingStatus] = useState(null)`
- [ ] In `profile_check` useEffect, fetch booking status in parallel with profile:
  ```js
  const [profileRes, statusRes] = await Promise.all([
    getPatientProfile(),
    getBookingStatus(),
  ]);
  setBookingStatus(statusRes.data.data);
  ```
- [ ] Add fallback: if `getBookingStatus` fails, default `bookingStatus` to `{ freeBookingUsed: false, bookingFee: 0 }`
- [ ] Replace hardcoded payment summary block with conditional:
  - If `!bookingStatus?.freeBookingUsed`: render green "First Booking FREE" banner with ₹0
  - If `bookingStatus?.freeBookingUsed`: render existing ₹10 summary
- [ ] Replace submit button label:
  - Free: `"✅ Confirm Free Booking"` — no ₹ mention
  - Paid: `"💳 Pay ₹10 & Confirm Booking"` (existing)
- [ ] In `handleProceedToPayment`, after `initiatePayment` response, branch on `isFree`:
  ```js
  const { isFree, appointment } = res.data.data;
  if (isFree) {
    setStage('success');
    setSuccessIsFree(true);  // new state flag for success screen message
    setTimeout(() => onSuccess(appointment), 2000);
    return;
  }
  // else: existing Razorpay flow unchanged
  ```
- [ ] Add `successIsFree` state: `const [successIsFree, setSuccessIsFree] = useState(false)`
- [ ] Update success stage render to show different message based on `successIsFree`:
  - Free: title `"🎉 First Booking Free!"`, body `"Your appointment is confirmed at no charge."`
  - Paid: title `"Booking Confirmed!"`, body `"Payment successful. Your appointment is confirmed."`

**Acceptance:** New patient sees ₹0 + green banner → clicks confirm → no Razorpay popup → success screen says "🎉 First Booking Free!"

---

## Task 2: Fix Free Booking Handling in `PaymentPage`
**File:** `frontend/src/pages/patient/PaymentPage.jsx`

### Subtasks
- [ ] After loading `payment`, compute:
  ```js
  const isFreeBooking = payment?.amount === 0 || payment?.razorpayOrderId?.startsWith('free_');
  ```
- [ ] Replace hardcoded `const fee = 10` with:
  ```js
  const fee = isFreeBooking ? 0 : 10;
  ```
- [ ] Update Payment Summary section to show conditionally:
  - If `isFreeBooking && isPaid`: render a green "Free Booking Confirmed" card with 🎉 icon — no pay button
  - If `!isFreeBooking && isPaid`: existing "Payment Completed" card (no change)
  - If `!isFreeBooking && !isPaid`: existing Razorpay pay button
- [ ] In the payment summary breakdown, if `isFreeBooking`:
  - Show `Platform Fee: ~~₹10~~ FREE`
  - Show `Total Payable: ₹0`

**Acceptance:** Navigating to `/patient/payment/:id` for a free booking shows confirmation card, not a ₹10 pay button.

---

## Task 3: Add Free Booking Badge in `MyAppointments`
**File:** `frontend/src/pages/patient/MyAppointments.jsx`

### Subtasks
- [ ] In `AppointmentCard`, add free booking badge after the existing `isPaid` badge:
  ```jsx
  {appt.payment?.amount === 0 && appt.payment?.status === 'PAID' && (
    <span className="badge bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      🎉 Free
    </span>
  )}
  ```
- [ ] Ensure the badge renders correctly alongside the existing `✓ Paid` badge
- [ ] Do NOT show "✓ Paid" badge for free bookings — add guard:
  ```js
  const isPaid = paymentStatus === 'PAID' && appt.payment?.amount > 0;
  const isFreeBooking = paymentStatus === 'PAID' && appt.payment?.amount === 0;
  ```

**Acceptance:** Free booking appointments show "🎉 Free" badge, not "✓ Paid".

---

## Task 4: Render Booking Metrics in `AdminDashboard`
**File:** `frontend/src/pages/admin/AdminDashboard.jsx`

### Subtasks
- [ ] Add `bookingMetrics` state: `const [bookingMetrics, setBookingMetrics] = useState(null)`
- [ ] Update `fetchStats` to also capture `bookingMetrics`:
  ```js
  const res = await getAdminDashboard();
  setStats(res.data.data.stats);
  setBookingMetrics(res.data.data.bookingMetrics);
  ```
- [ ] Add four new SVG icons to the `StatIcon` object:
  - `Gift` — for Free Bookings
  - `CreditCard` — for Paid Bookings
  - `TrendingUp` — for Conversion Rate
  - `Currency` — for Total Revenue
- [ ] Add a new "Booking Metrics" section between the clinic stats grid and Quick Actions:
  ```jsx
  <div className="mb-3">
    <SectionLabel>Booking Metrics</SectionLabel>
  </div>
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
    <StatCard label="Free Bookings"   value={bookingMetrics?.freeBookings}  icon={StatIcon.Gift}      colorScheme="green"  loading={isLoading} />
    <StatCard label="Paid Bookings"   value={bookingMetrics?.paidBookings}  icon={StatIcon.CreditCard} colorScheme="blue"   loading={isLoading} />
    <StatCard label="Conversion Rate" value={`${bookingMetrics?.conversionRate ?? 0}%`} icon={StatIcon.TrendingUp} colorScheme="indigo" loading={isLoading} />
    <StatCard label="Total Revenue"   value={`₹${bookingMetrics?.totalRevenue ?? 0}`}   icon={StatIcon.Currency}   colorScheme="teal"   loading={isLoading} />
  </div>
  ```

**Acceptance:** Admin dashboard shows a "Booking Metrics" row with 4 stat cards after the clinic overview section.

---

## Task 5: Add Free Booking Offer to Smart Notifications
**File:** `backend/src/controllers/notification.controller.js`

### Subtasks
- [ ] In `getMyNotifications`, update the `user` select to include `freeBookingUsed`:
  ```js
  prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, name: true, freeBookingUsed: true },
  }),
  ```
- [ ] After all appointment notifications are pushed, add the free offer notification conditionally:
  ```js
  if (user && !user.freeBookingUsed) {
    notifications.push({
      id: 'free_booking_offer',
      type: 'OFFER',
      category: 'Offers',
      title: '🎉 Your First Booking is FREE!',
      body: 'Book your first appointment on PulseMate at no charge. No payment required!',
      sub: 'Tap to find a doctor near you',
      time: new Date(user.createdAt),
      read: readSet.has('free_booking_offer'),
      icon: 'gift',
      color: '#10B981',
      bg: '#ECFDF5',
    });
  }
  ```
- [ ] In `markAllNotificationsRead`, add `'free_booking_offer'` to the `ids` array:
  ```js
  ids.push('offer_checkup', 'welcome', 'free_booking_offer');
  ```

**Acceptance:** Patient with no prior booking sees "🎉 Your First Booking is FREE!" in their notification list. Patient who has used free booking does not see it.

---

## Task 6: Backend Tests
**File:** `backend/src/__tests__/payment.test.js` (create if not exists)

### Subtasks
- [ ] Set up test DB seeding helpers: create test user, doctor, clinic, doctorClinic
- [ ] T1 — First booking free:
  - Seed user with `freeBookingUsed: false`
  - Call `POST /api/payments/initiate`
  - Assert response: `isFree=true`, `amount=0`
  - Assert DB: `appointment.status='BOOKED'`, `payment.amount=0`, `payment.status='PAID'`, `user.freeBookingUsed=true`
- [ ] T2 — Second booking paid:
  - Seed user with `freeBookingUsed: true`
  - Call `POST /api/payments/initiate`
  - Assert response: `isFree=false`, `order` present
  - Assert DB: `appointment.status='PENDING_PAYMENT'`, `payment.amount=10`, `payment.status='PENDING'`
- [ ] T3 — Cancel free booking, next booking is still paid:
  - Seed user with `freeBookingUsed: true`, cancelled appointment
  - Call `POST /api/payments/initiate`
  - Assert response: `isFree=false` (benefit consumed, non-reversible)
- [ ] T4 — Concurrent requests race condition:
  - Seed user with `freeBookingUsed: false`
  - Fire two simultaneous `initiatePayment` requests
  - Assert exactly one succeeds as free, one as paid
  - Assert `user.freeBookingUsed=true`
- [ ] T5 — Failed payment:
  - Create appointment + pending payment
  - Call `POST /api/payments/verify` with invalid signature
  - Assert `payment.status='FAILED'`, `appointment.status='CANCELLED'`
- [ ] T6 — `getBookingStatus` before first booking:
  - `GET /api/payments/booking-status` for user with `freeBookingUsed=false`
  - Assert `{ freeBookingUsed: false, bookingFee: 0 }`
- [ ] T7 — `getBookingStatus` after first booking:
  - `GET /api/payments/booking-status` for user with `freeBookingUsed=true`
  - Assert `{ freeBookingUsed: true, bookingFee: 10 }`
- [ ] T8 — Admin dashboard metrics:
  - Seed 3 free payments + 5 paid payments
  - `GET /api/admin/dashboard`
  - Assert `bookingMetrics.freeBookings=3`, `paidBookings=5`, `conversionRate=63`, `totalRevenue=50`

**Acceptance:** All 8 test cases pass with `npm test` in the backend directory.
