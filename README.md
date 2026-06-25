# PulseMate Connect

A full-stack healthcare platform for booking appointments, tracking live queues, and connecting patients with doctors and clinics.

---

## Project Structure

```
pulsemateconnect21/
├── backend/          # Node.js + Express + Prisma API (deployed on Render)
└── PulseMateApp/     # React Native + Expo mobile app
```

---

## Quick Start for Team Members

### 1. Clone the repo

```bash
git clone https://github.com/Shubham27082/pulsemateconnect21.git
cd pulsemateconnect21
```

---

### 2. Mobile App Setup (PulseMateApp)

```bash
cd PulseMateApp
npm install
```

#### Firebase credentials (ask team lead for this file)

The app needs `google-services.json` in the `PulseMateApp/` root for Firebase Phone Auth (OTP login).

- An example is at `PulseMateApp/google-services.json.example`
- Ask **Sahil / Shubham** for the actual `google-services.json` file
- Place it at `PulseMateApp/google-services.json`

The app API URL is already configured to point to the live Render backend:
```
https://api.pulsemateconnect.in/api
```
No additional configuration needed to run the app against the live backend.

#### Run the app

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your Android/iOS device.

---

### 3. Backend Setup (Local Development)

> Skip this if you only want to run the mobile app — it already uses the live Render backend.

```bash
cd backend
npm install
```

#### Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your local values. Minimum required for local dev:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pulsemate_db"
JWT_ACCESS_SECRET="any-random-32-char-string"
JWT_REFRESH_SECRET="any-random-32-char-string"
PORT=5000
NODE_ENV=development
SMS_PROVIDER=mock
EMAIL_PROVIDER=console
```

#### Set up local database

```bash
# Make sure PostgreSQL is running, then:
npx prisma migrate deploy
npx prisma generate
```

#### Run the backend

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

To use your local backend in the app, update `PulseMateApp/app.json`:
```json
"extra": {
  "apiUrl": "http://YOUR_LOCAL_IP:5000/api"
}
```

---

## Live Environment (Render)

| Service | URL |
|---|---|
| Backend API | https://api.pulsemateconnect.in/api |
| Admin Dashboard | https://admin.pulsemateconnect.in |
| Database | PostgreSQL on Render (Singapore) |

---

## DB Fix Scripts (run against Render DB when needed)

These scripts are in `backend/prisma/` for fixing data issues:

```bash
# Fix clinic/doctor visibility flags
DATABASE_URL="<render-db-url>" node prisma/fix-clinic-visibility.js

# Check and fix doctor-clinic links
DATABASE_URL="<render-db-url>" node prisma/check-and-link.js

# Check clinic coordinates
DATABASE_URL="<render-db-url>" node prisma/check-clinic-coords.js
```

> Ask Sahil for the Render DATABASE_URL.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native, Expo, Expo Go |
| Auth | Firebase Phone Auth (OTP) |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Hosting | Render (backend + DB) |
| Payments | Razorpay |
| Storage | Cloudinary |
| Push Notifications | Firebase FCM |

---

## Credentials Needed (ask team lead)

| File | Where to place | What it's for |
|---|---|---|
| `google-services.json` | `PulseMateApp/` | Firebase OTP login on Android |
| `backend/.env` | `backend/` | DB, JWT, Firebase Admin, Razorpay keys |

> These files are in `.gitignore` and must never be committed to GitHub.
