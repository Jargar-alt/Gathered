# Gathered Mobile (Expo)

Native iOS app for Gathered — Bible reading accountability and prayer requests. Shares the same Firebase backend as the web app.

## Prerequisites

- Node.js 20+
- Apple Developer account ($99/yr)
- EAS CLI (`npm install -g eas-cli`)

## TestFlight / App Store

```bash
cd mobile
npm install
npm run build:ios
npm run submit:ios
```

- Bundle ID: `com.acuratls.gathered`
- Version: `1.1.0` (build number auto-increments)
- Enable **Sign In with Apple** on the App ID (builds use `EXPO_NO_CAPABILITY_SYNC=1`)

After submit, the build appears in App Store Connect → TestFlight.

## Local Metro (optional)

Only useful if you already have a matching native binary installed:

```bash
cd mobile
npm start
```

## Bundle identifier

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

Email/password, Sign in with Apple, and Google Sign-In. Same Firebase accounts as the web app — group data syncs automatically.

See [docs/AUTH_SETUP.md](../docs/AUTH_SETUP.md) for Firebase and OAuth configuration.
