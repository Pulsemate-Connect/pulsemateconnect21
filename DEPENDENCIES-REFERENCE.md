# 📦 Dependencies Reference - Dual OTP Authentication

Quick reference for all dependencies needed for the dual OTP authentication system.

---

## Backend Dependencies

### Install Command

```bash
cd backend
npm install firebase-admin axios
```

### package.json (Key Dependencies)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "firebase-admin": "^12.0.0",
    "axios": "^1.6.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "@types/node": "^20.10.5"
  }
}
```

### Version Compatibility

- **Node.js**: 18.x or higher recommended
- **PostgreSQL**: 14.x or higher
- **Prisma**: 5.x
- **Firebase Admin SDK**: 12.x

---

## Frontend Web Dependencies

### Install Command

```bash
cd frontend
npm install firebase zustand axios react-router-dom
```

### package.json (Key Dependencies)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "firebase": "^10.7.1",
    "zustand": "^4.4.7",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
```

### Optional UI Dependencies

```bash
# If you want additional UI components
npm install @headlessui/react @heroicons/react
```

### Version Compatibility

- **React**: 18.x
- **Vite**: 5.x
- **Firebase Web SDK**: 10.x
- **Zustand**: 4.x

---

## Mobile App Dependencies

### Already Installed

The mobile app already has these installed:

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "firebase": "^10.7.0",
    "expo-secure-store": "~12.8.0",
    "axios": "^1.6.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20"
  }
}
```

### If Missing, Install

```bash
npm install expo-secure-store firebase axios
```

### Version Compatibility

- **Expo SDK**: 50.x
- **React Native**: 0.73.x
- **Firebase**: 10.x
- **Expo SecureStore**: 12.x

---

## Development Tools

### Global Tools

```bash
# Prisma CLI (if not in project)
npm install -g prisma

# PM2 for process management (production)
npm install -g pm2

# EAS CLI for Expo builds
npm install -g eas-cli

# Artillery for load testing (optional)
npm install -g artillery
```

### Backend Dev Dependencies

```bash
cd backend
npm install --save-dev \
  nodemon \
  jest \
  supertest \
  @types/jest \
  @types/node \
  eslint \
  prettier
```

### Frontend Dev Dependencies

```bash
cd frontend
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  vitest \
  eslint \
  prettier \
  @types/react \
  @types/react-dom
```

---

## Environment-Specific Dependencies

### Production Only

```bash
# Backend
npm install compression helmet express-rate-limit

# Already included in current setup
```

### Development Only

```bash
# Backend
npm install --save-dev nodemon dotenv-cli

# Frontend
npm install --save-dev vite-plugin-inspect
```

---

## Peer Dependencies

Most peer dependencies are auto-installed, but if you get warnings:

### React Peer Dependencies

```bash
npm install react@18.2.0 react-dom@18.2.0
```

### React Native Peer Dependencies

```bash
npm install react@18.2.0 react-native@0.73.0
```

---

## Optional Performance Dependencies

### Redis (for session storage)

```bash
cd backend
npm install redis connect-redis
```

Update twofactor.service.js to use Redis instead of in-memory storage.

### Compression

```bash
cd backend
npm install compression
```

Add to server.js:
```javascript
const compression = require('compression');
app.use(compression());
```

---

## Security Dependencies

### Additional Security (Optional)

```bash
cd backend
npm install \
  express-mongo-sanitize \
  express-validator \
  hpp \
  xss-clean
```

---

## Installation Scripts

### Complete Backend Setup

```bash
#!/bin/bash
cd backend
npm install
npm install firebase-admin axios
npm install --save-dev nodemon jest supertest
npx prisma generate
npm run dev
```

### Complete Frontend Setup

```bash
#!/bin/bash
cd frontend
npm install
npm install firebase zustand axios react-router-dom
npm run dev
```

### Complete Mobile Setup

```bash
#!/bin/bash
npm install
npm install expo-secure-store firebase axios
npm start
```

---

## Verification Commands

### Check Installed Versions

```bash
# Backend
cd backend
npm list firebase-admin axios jsonwebtoken

# Frontend
cd frontend
npm list firebase zustand axios react-router-dom

# Mobile
npm list firebase expo-secure-store axios
```

### Check for Outdated Packages

```bash
npm outdated
```

### Update Packages

```bash
# Update to latest compatible versions
npm update

# Update to latest (may have breaking changes)
npm install firebase@latest
```

---

## Package Lock Files

### Important Notes

1. **Backend**: Uses `package-lock.json` (npm)
2. **Frontend**: Uses `package-lock.json` (npm)
3. **Mobile**: Can use `package-lock.json` or `yarn.lock`

### Clean Install

If you encounter dependency issues:

```bash
# Delete lock file and node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Or use clean install
npm ci
```

---

## Dependency Audit

### Check for Vulnerabilities

```bash
npm audit

# Auto-fix (safe updates only)
npm audit fix

# Fix including breaking changes (careful!)
npm audit fix --force
```

---

## Alternative Package Managers

### Using Yarn

```bash
# Backend
cd backend
yarn add firebase-admin axios

# Frontend
cd frontend
yarn add firebase zustand axios react-router-dom
```

### Using pnpm

```bash
# Backend
cd backend
pnpm add firebase-admin axios

# Frontend
cd frontend
pnpm add firebase zustand axios react-router-dom
```

---

## Docker Dependencies

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "src/server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Troubleshooting Dependencies

### Common Issues

#### Issue: "Cannot find module 'firebase-admin'"

```bash
cd backend
npm install firebase-admin
```

#### Issue: "Module parse failed" (frontend)

```bash
cd frontend
npm install --save-dev @vitejs/plugin-react
```

#### Issue: Peer dependency warnings

```bash
# Install peer dependencies
npm install --legacy-peer-deps
```

#### Issue: Version conflicts

```bash
# Check versions
npm ls <package-name>

# Force specific version
npm install package-name@specific-version
```

---

## Minimum Required Versions

| Package | Minimum Version | Recommended |
|---------|----------------|-------------|
| Node.js | 18.0.0 | 18.19.0 |
| npm | 9.0.0 | 10.2.0 |
| Firebase Admin SDK | 11.0.0 | 12.0.0 |
| Firebase Web SDK | 9.0.0 | 10.7.0 |
| Zustand | 4.0.0 | 4.4.7 |
| Axios | 1.0.0 | 1.6.2 |
| React | 18.0.0 | 18.2.0 |
| Expo SDK | 49.0.0 | 50.0.0 |

---

## Quick Copy-Paste Commands

### All-in-One Backend

```bash
cd backend && npm install firebase-admin axios && npm run dev
```

### All-in-One Frontend

```bash
cd frontend && npm install firebase zustand axios react-router-dom && npm run dev
```

### All-in-One Mobile

```bash
npm install expo-secure-store firebase axios && npm start
```

---

**Last Updated**: 2026-07-27  
**Status**: ✅ Verified Working
