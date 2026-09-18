# Gathered Mobile (Expo)

Native iOS app for Gathered — Bible reading accountability and prayer requests. Shares the same Firebase backend as the web app.

## Prerequisites

- Node.js 20+
- Apple Developer account ($99/yr) for device testing and App Store
- EAS CLI (`npm install -g eas-cli`)
- Mac and iPhone on the same Wi-Fi network

> **Note:** This project uses **Expo SDK 57**, which is newer than App Store Expo Go supports. Use a **development build** on your iPhone (instructions below), not Expo Go.

## Quick Start (Development Build on iPhone)

### One-time: build and install the dev client

```bash
cd mobile
npm install
npm run build:dev
```

When the build finishes, EAS gives you a link/QR code — open it on your iPhone to install **Gathered (Dev)**.

EAS may ask you to register your device UDID the first time. Follow the prompts.

### Daily dev workflow

```bash
cd mobile
npm start
```

1. Open the **Gathered** dev client app on your iPhone (not Expo Go)
2. Scan the QR code from the terminal, or enter the URL manually
3. Your JS changes hot-reload as usual

If the phone can't reach your Mac, use tunnel mode:

```bash
npx expo start --dev-client --tunnel
```

### iOS Simulator (optional)

```bash
npm run build:dev:simulator   # one-time EAS build for simulator
npm run ios                   # opens simulator + connects dev client
```

## App Store Build (EAS)

### One-time setup

1. Log in to Expo: `eas login`
2. Configure Apple credentials: `eas credentials`
   - Distribution certificate
   - Provisioning profile
   - **APNs key** (required for push notifications)

### Build for App Store

```bash
cd mobile
npm run build:ios
```

Submit when ready:

```bash
npm run submit:ios
```

### Build profiles (`eas.json`)

| Profile | Use |
|---------|-----|
| `development` | Dev client for physical iPhone |
| `development-simulator` | Dev client for iOS Simulator |
| `preview` | Internal TestFlight / ad-hoc testing |
| `production` | App Store release (auto-increments build number) |

### Bundle identifier

`com.acuratls.gathered` — change in `app.config.js` if needed.

## Features

- **Calendar** — daily Bible reading logs with reactions
- **Prayers & Praise** — prayer requests with emoji reactions and notes
- **Settings** — profile, avatar color, group invite code
- **Push notifications** — alerts when group members post prayers or respond

## Firebase Setup

Config is in `firebase-config.json`. Deploy Cloud Functions from repo root for push:

```bash
cd functions && npm install && npm run build
cd .. && firebase deploy --only functions,firestore:rules
```

Push tokens are saved to `users/{uid}.expoPushToken` in Firestore.

## Auth

Email/password and Google Sign-In. Same Firebase accounts as the web app — group data syncs automatically.

Google is a native module: after turning it on, make a **new EAS build** (not Expo Go / not JS-only).

See [docs/AUTH_SETUP.md](../docs/AUTH_SETUP.md) for Firebase and OAuth configuration.
