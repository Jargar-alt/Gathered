# Authentication Setup (Mobile)

Gathered supports **email/password**, **Sign in with Apple**, and **Google Sign-In** via Firebase Authentication.

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → project `gen-lang-client-0346540522`
2. **Authentication** → **Sign-in method**
3. Enable:
   - **Email/Password**
   - **Google** (Web client ID is in `mobile/auth.config.js`)
   - **Apple** (see below)

## 2. Sign in with Apple

### Apple Developer

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **`com.acuratls.gathered`**
2. Enable **Sign In with Apple** → Save
3. Create a **Key** with **Sign In with Apple** enabled → download the `.p8` (once)
4. Note: **Team ID** (`P9V25CHLW2`), **Key ID**, and the `.p8` contents

Builds use `EXPO_NO_CAPABILITY_SYNC=1`, so enable the capability on the App ID yourself (EAS will not sync it for you).

### Firebase Apple provider (required for native)

1. Authentication → Sign-in method → **Apple** → Enable
2. **Services ID:** use the App ID / bundle ID `com.acuratls.gathered`  
   (For native iOS this is often the App ID, not a separate Services ID.)
3. **OAuth code flow:** Team ID `P9V25CHLW2`, Key ID, and the `.p8` private key contents
4. Save

If Apple Sign-In shows a vague failure, check the on-screen message — after the latest app update it should name audience / provider issues instead of “Incorrect password.”

### App code

- `ios.usesAppleSignIn: true` and `expo-apple-authentication` in `mobile/app.config.js`
- Login shows the system Apple button on supported iOS devices
- Requires a **new native build** after first enabling

## 3. Google Sign-In (native)

Google is enabled in `mobile/auth.config.js` (`enableGoogleSignIn: true`). Client IDs are also in `mobile/eas.json`. The SDK uses the **Web client ID** as `webClientId` on both iOS and Android.

### iOS

```bash
cd mobile
npm run build:ios
npm run submit:ios
```

### Android (Play Store)

1. Firebase Console → project `gen-lang-client-0346540522` → **Add app** → **Android**
2. Package name: **`com.acuratls.gathered`** (must match `mobile/app.config.js`)
3. You do **not** need to commit `google-services.json` for the current Expo Firebase JS config
4. After Android credentials exist on EAS, get fingerprints:

```bash
cd mobile
eas credentials -p android
```

5. Copy **SHA-1** and **SHA-256** into:
   - Firebase → Project settings → your Android app → **Add fingerprint**
   - And/or [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → create an **Android** OAuth client with package `com.acuratls.gathered` and that SHA-1 (same Google Cloud project as Firebase)
6. Rebuild if you already shipped an AAB before fingerprints were registered:

```bash
cd mobile
npm run build:android
npm run submit:android
```

Without the correct SHA-1, Google Sign-In fails on Android even though email/password still works.

Login requires the Terms of Use checkbox before email, Apple, or Google.

## Guideline 4.8 (App Store)

Apple requires **Sign in with Apple** when you offer other third-party logins (e.g. Google). Email/password alone does **not** satisfy 4.8.

## Guideline 1.2 (UGC)

- Terms of Use must be accepted on login/sign-up: https://jargar-alt.github.io/Gathered/terms.html
- Client-side content filter on new readings, prayers, and notes
- Flag / Block on other members’ posts (`···`)
- Reports stored in Firestore `reports`; `blockedUids` on the user profile
