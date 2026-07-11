# Authentication Setup (Mobile)

Gathered supports **Sign in with Apple**, **Google**, and **email/password** via Firebase Authentication.

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → project `gen-lang-client-0346540522`
2. Go to **Authentication** → **Sign-in method**
3. Enable:
   - **Email/Password**
   - **Google**
   - **Apple**

### Google
- Enable Google provider
- Copy the **Web client ID** (ends in `.apps.googleusercontent.com`)
- Set as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in EAS or `mobile/.env.local`

### Apple
- Enable Apple provider
- In [Apple Developer](https://developer.apple.com/account) → **Identifiers** → `com.acuratls.gathered`:
  - Enable **Sign in with Apple** capability
- In Firebase Apple setup, configure your Apple Team ID (`P9V25CHLW2`) and Key ID / private key if prompted

## 2. Google Cloud (iOS)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create **OAuth client ID** → **iOS**
3. Bundle ID: `com.acuratls.gathered`
4. Copy:
   - **iOS client ID** → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - **iOS URL scheme** (reversed client ID) → `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`

## 3. Environment variables

For local dev, copy `mobile/.env.example` to `mobile/.env.local`.

For EAS builds, add secrets:

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_WEB_CLIENT_ID"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "YOUR_IOS_CLIENT_ID"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME --value "com.googleusercontent.apps.XXXX"
```

Or set in [expo.dev](https://expo.dev) → Project → Environment variables → **production**.

## 4. Rebuild required

Google and Apple sign-in use native modules. After configuring env vars, create a **new development or production build**:

```bash
npm run build:dev        # dev client
npm run build:ios        # App Store
```

Email/password works without OAuth env vars.
