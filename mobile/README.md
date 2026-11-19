# Gathered Mobile (Expo)

Native iOS and Android app for Gathered — Bible reading accountability and prayer requests. Shares the same Firebase backend as the web app.

## Prerequisites

- Node.js 20+
- Apple Developer account ($99/yr) for iOS
- Google Play Developer account ($25 one-time) for Android
- EAS CLI (`npm install -g eas-cli`)

## TestFlight / App Store

```bash
cd mobile
npm install
npm run build:ios
npm run submit:ios
```

- Bundle ID: `com.acuratls.gathered`
- Versions live in [`version.json`](./version.json); `npm run build:ios` bumps `iosBuildNumber` every time
- Enable **Sign In with Apple** on the App ID (builds use `EXPO_NO_CAPABILITY_SYNC=1`)
- After a version is approved on the App Store, run `npm run bump:marketing` before the next iOS build
- Commit `version.json` after store builds

After submit, the build appears in App Store Connect → TestFlight.

See [docs/APP_STORE.md](../docs/APP_STORE.md).

## Google Play

```bash
cd mobile
npm install
npm run build:android
npm run submit:android
```

- Package: `com.acuratls.gathered`
- `npm run build:android` bumps `androidVersionCode` in `version.json`
- Submit profile uploads to the **internal** track as a **draft**
- Commit `version.json` after store builds

Register Android SHA-1 fingerprints for Google Sign-In (`eas credentials -p android`). See [docs/PLAY_STORE.md](../docs/PLAY_STORE.md) and [docs/AUTH_SETUP.md](../docs/AUTH_SETUP.md).

## Local Metro (optional)

Only useful if you already have a matching native binary installed:

```bash
cd mobile
npm start
```

## Bundle identifier / package

`com.acuratls.gathered` — change in `app.config.js` if needed (iOS + Android must stay in sync with store listings and OAuth clients).

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

Email/password, Sign in with Apple (iOS), and Google Sign-In. Same Firebase accounts as the web app — group data syncs automatically.

See [docs/AUTH_SETUP.md](../docs/AUTH_SETUP.md) for Firebase and OAuth configuration.
