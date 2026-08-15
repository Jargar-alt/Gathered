# Authentication Setup (Mobile)

Gathered supports **Google** and **email/password** via Firebase Authentication.

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → project `gen-lang-client-0346540522`
2. Go to **Authentication** → **Sign-in method**
3. Enable:
   - **Email/Password**
   - **Google**

### Google
- Enable Google provider on **Gathered** (not another Firebase project)
- Web client ID must start with `1074128724577-` (Gathered project number)
- Create an **iOS** OAuth client in Google Cloud for bundle ID `com.acuratls.gathered`
- App config lives in `mobile/auth.config.js` and `mobile/eas.json`

## 2. Rebuild required

Google Sign-In uses native modules and URL schemes. After changing OAuth client IDs:

```bash
cd mobile
npm run build:dev        # test on device
npm run build:ios        # App Store
```

Email/password works without OAuth env vars.

## App Store note

Apple guideline 4.8: if you offer a third-party login (Google), App Review often requires **Sign in with Apple** as an equivalent option. Re-add Apple before submit if Review asks for it.
