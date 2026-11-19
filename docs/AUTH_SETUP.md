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
4. Register **every** signing SHA used by the app. Missing fingerprints cause `DEVELOPER_ERROR` / code `10` (Google Sign-In fails; email/password still works).

**Upload keystore** (EAS / `mobile/credentials/android/keystore.jks`):

| | Fingerprint |
|---|---|
| SHA-1 | `21:AA:AC:3A:D1:86:AD:B7:99:A8:1D:58:40:44:E2:77:FB:8F:BB:D7` |
| SHA-256 | `45:69:0B:BF:07:FA:83:77:31:B8:B7:9E:2A:30:00:56:7E:BE:66:A3:DC:80:FB:49:D5:6D:D8:43:1D:44:75:96` |

**Play App Signing** (required for Play Store / internal testing downloads):

1. [Play Console](https://play.google.com/console) → Gathered → **Setup → App signing**
2. Copy **App signing key certificate** SHA-1 (and SHA-256)
3. Add those fingerprints too — Play re-signs the AAB, so the upload keystore alone is not enough

Paste all fingerprints into:

- Firebase → Project settings → Android app `com.acuratls.gathered` → **Add fingerprint**
- And/or [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **Android** OAuth client with package `com.acuratls.gathered` + each SHA-1 (same Google Cloud project as Firebase)

To re-print upload fingerprints locally:

```bash
cd mobile
/opt/homebrew/opt/openjdk/bin/keytool -list -v \
  -keystore credentials/android/keystore.jks \
  -alias e6d0da70a0d50473a12ad5f5266dc752
```

Or: `eas credentials -p android` / `npx @react-native-google-signin/config-doctor --package-name com.acuratls.gathered`

Fingerprint changes take effect without a rebuild once Google’s servers pick them up (usually a few minutes). Rebuild only if you also changed client IDs or native config:

```bash
cd mobile
npm run build:android
npm run submit:android
```

Login requires the Terms of Use checkbox before email, Apple, or Google.

## Guideline 4.8 (App Store)

Apple requires **Sign in with Apple** when you offer other third-party logins (e.g. Google). Email/password alone does **not** satisfy 4.8.

## Guideline 1.2 (UGC)

- Terms of Use must be accepted on login/sign-up: https://jargar-alt.github.io/Gathered/terms.html
- Client-side content filter on new readings, prayers, and notes
- Flag / Block on other members’ posts (`···`)
- Reports stored in Firestore `reports`; `blockedUids` on the user profile
