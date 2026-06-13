# 🏥 PulseMate Connect

A full-stack healthcare platform for clinic management, patient appointments, live queue tracking, and Firebase-powered OTP authentication.

---

## 📁 Project Structure

```
pulsemateconnect1/
├── backend/          → Node.js + Express + Prisma (PostgreSQL)
├── frontend/         → React + Vite + TailwindCSS (Web Panel)
├── PulseMateApp/     → React Native + Expo (Mobile App)
├── infra/            → Nginx, Postgres, Prometheus configs
├── scripts/          → DB backup & migration scripts
└── docker-compose.yml
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ | https://nodejs.org |
| PostgreSQL | 15+ | https://postgresql.org |
| Git | any | https://git-scm.com |
| Expo Go (phone) | latest | App Store / Play Store |

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Shubham27082/pulsemateconnect21.git
cd pulsemateconnect21
```

---

### 2️⃣ Setup Backend

```bash
cd backend
```

**Copy and configure environment:**
```bash
copy .env.example .env
```

Edit `.env` — minimum required for local dev:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/pulsemate_db"
JWT_ACCESS_SECRET="any-random-32-char-string-here-dev"
JWT_REFRESH_SECRET="another-random-32-char-string-dev"
COOKIE_SECRET="cookie-secret-dev"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Email — use console for local dev (prints to terminal)
EMAIL_PROVIDER=console

# SMS — use mock for local dev (OTP prints to terminal)
SMS_PROVIDER=mock
OTP_PROVIDER=mock
```

**Install dependencies:**
```bash
npm install
```

**Create the database (in PostgreSQL):**
```sql
CREATE DATABASE pulsemate_db;
```

**Run migrations & generate Prisma client:**
```bash
npx prisma generate
npx prisma migrate deploy
```

**Start the backend:**
```bash
npm start
```
Backend runs at: **http://localhost:5000**

---

### 3️⃣ Setup Frontend (Web Panel)

```bash
cd frontend
```

**Copy and configure environment:**
```bash
copy .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api

# Firebase (required for patient OTP login)
VITE_FIREBASE_API_KEY=AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw
VITE_FIREBASE_AUTH_DOMAIN=pulsemateconnect.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pulsemateconnect
VITE_FIREBASE_MESSAGING_SENDER_ID=157620382332
VITE_FIREBASE_APP_ID=1:157620382332:web:e4156f49d8616a4ee6b7f9

# Razorpay (optional — for payments)
VITE_RAZORPAY_KEY_ID=rzp_live_Sz5uowTvIY9Mwv
```

**Install and run:**
```bash
npm install
npm run dev
```
Frontend runs at: **http://localhost:3000**

---

### 4️⃣ Setup Mobile App

```bash
cd PulseMateApp
```

**Install dependencies:**
```bash
npm install
```

**Update API URL** — open `src/api/axios.js` and make sure it points to your machine's IP:
```js
// Use your local machine IP, not localhost (phone can't reach localhost)
const BASE_URL = 'http://192.168.x.x:5000/api';
```

**Start Expo:**
```bash
npx expo start --clear
```

- Scan QR code with **Expo Go** app on your phone
- Or press `a` for Android emulator, `i` for iOS simulator

---

## 🔥 Firebase Setup (Required for OTP)

### Web + Mobile use the same Firebase project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Select project: **`pulsemateconnect`**
3. **Authentication** → **Sign-in method** → Enable **Phone**
4. **Authentication** → **Settings** → **Authorized domains** → Add:
   - `localhost`
   - `127.0.0.1`
   - Your Render URL (for production)

> For local testing, Firebase will send real SMS to real numbers.
> To test without spending SMS quota, add test numbers:
> Firebase Console → Authentication → Phone → **Test phone numbers**

---

## 🗄️ Database Commands

```bash
cd backend

# Run all pending migrations
npx prisma migrate deploy

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset --force

# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration after editing schema.prisma
npx prisma migrate dev --name your_migration_name
```

---

## 🏗️ Architecture Overview

```
Patient (Web/Mobile)
    │
    ▼
Firebase Phone Auth ──── SMS OTP ──► User's Phone
    │
    │ Firebase ID Token
    ▼
Backend API (Express)
    │
    ├── Verify Firebase Token (firebase-admin)
    ├── Find or Create Patient in DB
    ├── Issue JWT access + refresh tokens
    │
    ▼
PostgreSQL (via Prisma ORM)
```

### Auth Flow

| User Type | Login Method | Route |
|-----------|-------------|-------|
| Patient (Web) | Firebase Phone OTP | `POST /auth/patient/firebase-phone-login` |
| Patient (Mobile) | Firebase Phone OTP | `POST /auth/patient/firebase-phone-login` |
| Clinic Owner | Password | `POST /auth/login-password` |
| Doctor | Password | `POST /auth/login-password` |
| Receptionist | Password | `POST /auth/login-password` |
| Super Admin | Password | `POST /auth/login-password` |

---

## 🌐 API Endpoints Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/patient/firebase-phone-login` | Patient login via Firebase OTP |
| POST | `/api/auth/login-password` | Staff password login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Get current user |

### Clinic Owner Registration
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/clinic-owner/verify-firebase-phone` | Verify phone via Firebase |
| POST | `/api/auth/clinic-owner/send-email-verification` | Send email OTP |
| POST | `/api/auth/clinic-owner/verify-email-otp` | Verify email OTP |
| POST | `/api/auth/clinic-owner/register` | Register clinic + owner |

### Appointments
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Book appointment |
| PATCH | `/api/appointments/:id/status` | Update status |

### Health Check
```
GET /health  →  { status: "ok", uptime: 123 }
```

---

## 🚀 Production Deployment (Render)

### Backend (Web Service)
- **Root Directory:** `backend`
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command:** `node src/server.js`

### Required Environment Variables on Render
```env
DATABASE_URL              = <Render PostgreSQL external URL>
NODE_ENV                  = production
PORT                      = 5000
JWT_ACCESS_SECRET         = <strong random string>
JWT_REFRESH_SECRET        = <strong random string>
COOKIE_SECRET             = <strong random string>
FRONTEND_URL              = https://your-frontend.onrender.com
EMAIL_PROVIDER            = resend
RESEND_API_KEY            = <your resend key>
RESEND_FROM_EMAIL         = onboarding@resend.dev
SMS_PROVIDER              = mock
FIREBASE_SERVICE_ACCOUNT_JSON = <minified JSON from Firebase service account>
RAZORPAY_KEY_ID           = <your key>
RAZORPAY_KEY_SECRET       = <your secret>
```

### Frontend (Static Site)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Redirect Rule:** `/* → /index.html` (Rewrite) — required for React Router

---

## 🧪 Testing OTP Locally

Since `SMS_PROVIDER=mock`, OTPs print to the backend terminal:

```
──────────────────────────────────────────────────
  📱 DEV OTP  →  +917022818878
  Code: 123456
──────────────────────────────────────────────────
```

For **Firebase OTP** on web/mobile, the SMS goes directly to the phone via Firebase — the backend is not involved until after the user enters the OTP.

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `PATIENT` | Book appointments, view queue, manage profile |
| `RECEPTIONIST` | Manage walk-ins, update queue, view schedule |
| `DOCTOR` | View appointments, mark complete |
| `CLINIC_OWNER` | Full clinic management, staff, analytics |
| `SUPER_ADMIN` | Approve clinics, manage all users |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | Firebase Phone Auth + JWT |
| Frontend | React 18, Vite, TailwindCSS |
| Mobile | React Native, Expo |
| Email | Resend API |
| Payments | Razorpay |
| Push Notifications | Firebase FCM |
| Real-time | Socket.IO |

---

## 📞 Support

- Firebase Console: https://console.firebase.google.com
- Render Dashboard: https://dashboard.render.com
- Prisma Docs: https://prisma.io/docs
- Expo Docs: https://docs.expo.dev
