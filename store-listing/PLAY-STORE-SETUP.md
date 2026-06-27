# Play Store Setup — Step by Step
## PulseMate Connect (in.pulsemateconnect.app)

Complete these steps in order before triggering an EAS production build.

---

## STEP 1 — Register Android App in Firebase Console

1. Go to https://console.firebase.google.com → Select **pulsemateconnect** project
2. Project Settings (gear icon) → **Your apps** → **Add app** → Android
3. Fill in:
   - Android package name: `in.pulsemateconnect.app`
   - App nickname: `PulseMate Android`
   - SHA-1: (get from Step 2 below)
4. Click **Register app**
5. Download `google-services.json`
6. Place it in `PulseMateApp/` (root, next to `app.json`)
7. Copy the **Android App ID** shown (format: `1:157620382332:android:XXXXXXXX`)
8. Open `src/config/firebase.js` and replace `appId` with the Android App ID

---

## STEP 2 — Get SHA-1 Fingerprint

### For EAS managed keystore (recommended):
```bash
cd PulseMateApp
npx eas credentials --platform android
# Select: "Set up a new keystore" or view existing
# Copy the SHA-1 fingerprint shown
```

### Add SHA-1 to Firebase:
- Firebase Console → Project Settings → Your apps → Android app → Add fingerprint

---

## STEP 3 — Set Up EAS Project ID

```bash
cd PulseMateApp
npx eas login          # log in with your Expo account
npx eas init           # creates project on expo.dev, updates app.json projectId
```

---

## STEP 4 — Restrict Firebase API Key

1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials → Find the key `AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc`
3. Edit → Application restrictions → **Android apps**
4. Add: Package name `in.pulsemateconnect.app` + SHA-1 from Step 2
5. Save

---

## STEP 5 — Build Production AAB

```bash
cd PulseMateApp
npx eas build --platform android --profile production
```

This creates a signed AAB ready for Play Store upload.

---

## STEP 6 — Create Play Console Listing

1. Go to https://play.google.com/console
2. Create app → Android → `in.pulsemateconnect.app`
3. Fill in:
   - **App name**: PulseMate Connect
   - **Short description**: Copy from `store-listing/short-description.txt`
   - **Full description**: Copy from `store-listing/full-description.txt`
   - **Category**: Medical
   - **Content rating**: Complete questionnaire
   - **Privacy policy URL**: `https://www.pulsemateconnect.in/privacy-policy`
4. Upload graphics (see `ASSETS-REQUIRED.md`)
5. Data Safety: Follow `store-listing/data-safety.md`

---

## STEP 7 — Internal Testing Track

1. Upload the AAB from Step 5
2. Create internal testing track
3. Add tester email addresses
4. Submit for review

---

## Checklist

- [ ] `google-services.json` placed in `PulseMateApp/`
- [ ] `firebase.js` updated with Android App ID
- [ ] SHA-1 added to Firebase Console
- [ ] EAS project ID set in `app.json` (run `eas init`)
- [ ] Firebase API key restricted to `in.pulsemateconnect.app`
- [ ] Production AAB built with `eas build`
- [ ] Feature graphic (1024×500 px) created
- [ ] Minimum 2 screenshots captured
- [ ] Play Console listing filled in
- [ ] Data Safety form completed
- [ ] Medical disclaimer verified (appears on first launch)
- [ ] Account deletion tested (Profile → Delete Account)
- [ ] Privacy Policy URL live and accessible
