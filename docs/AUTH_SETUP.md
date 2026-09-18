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

### Firebase Apple provider

1. Authentication → Sign-in method → **Apple** → Enable
2. For native iOS only, Firebase often works with just the App ID / bundle ID
3. If Firebase asks for OAuth code flow fields, create an Apple **Services ID**, set the Firebase callback URL, and paste Team ID / Key ID / `.p8`

### App code

- `ios.usesAppleSignIn: true` and `expo-apple-authentication` in `mobile/app.config.js`
- Login shows the system Apple button on supported iOS devices
- Requires a **new native build** after first enabling

## 3. Google Sign-In (native)

Google is enabled in `mobile/auth.config.js` (`enableGoogleSignIn: true`). Client IDs are also in `mobile/eas.json`.

```bash
cd mobile
npm run build:dev            # test on device
# or
npm run build:ios            # App Store
```

Login requires the Terms of Use checkbox before email, Apple, or Google.

## Guideline 4.8 (App Store)

Apple requires **Sign in with Apple** when you offer other third-party logins (e.g. Google). Email/password alone does **not** satisfy 4.8.

## Guideline 1.2 (UGC)

- Terms of Use must be accepted on login/sign-up: https://jargar-alt.github.io/Gathered/terms.html
- Client-side content filter on new readings, prayers, and notes
- Flag / Block on other members’ posts (`···`)
- Reports stored in Firestore `reports`; `blockedUids` on the user profile
