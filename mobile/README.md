# Gathered Mobile (Expo)

Native iOS app for Gathered — Bible reading accountability and prayer requests. Shares the same Firebase backend as the web app.

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your iPhone
- Mac and iPhone on the same Wi-Fi network

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with your iPhone camera to open in Expo Go.

## Features

- **Calendar** — daily Bible reading logs with reactions
- **Prayers & Praise** — prayer requests with emoji reactions and notes (with author names)
- **Settings** — profile, avatar color, group invite code
- **Push notifications** — alerts when group members post prayers or respond with notes (requires Cloud Functions deployment)

## Firebase Setup

The app uses the same Firebase project as the web app. Config is in `firebase-config.json` (copied from the repo root).

### Push Notifications

1. Upgrade Firebase to **Blaze plan** (required for Cloud Functions)
2. Deploy functions from the repo root:
   ```bash
   cd functions && npm install && npm run build
   cd .. && firebase deploy --only functions,firestore:rules
   ```
3. Grant notification permission when prompted on your iPhone

Push tokens are saved to `users/{uid}.expoPushToken` in Firestore.

## Auth

Email/password sign-in works out of the box. Use the same account as the web app — your group data syncs automatically.

Google Sign-In is not yet implemented on mobile (web only for now).

## App Store (later)

Expo Go is for development. For TestFlight / App Store:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
```

Requires an Apple Developer account ($99/yr) and APNs key uploaded to EAS.
