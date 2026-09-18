# Authentication Setup (Mobile)

Gathered supports **email/password** and **Google Sign-In** via Firebase Authentication.

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → project `gen-lang-client-0346540522`
2. **Authentication** → **Sign-in method**
3. Enable:
   - **Email/Password**
   - **Google** (already configured — Web client ID is in `mobile/auth.config.js`)

## 2. Google Sign-In (native)

Google is enabled in `mobile/auth.config.js` (`enableGoogleSignIn: true`). Client IDs are also in `mobile/eas.json`.

This uses a native module, so **JS reload is not enough**. Build a new binary:

```bash
cd mobile
npm run build:dev            # test on device
# or
npm run build:ios            # App Store
```

Login requires the Terms of Use checkbox before email or Google.

## Guideline 4.8 (App Store)

Apple rejected Google-only third-party login once. Email/password does **not** satisfy 4.8. Before the next App Store submission, add **Sign in with Apple** next to Google, or Apple will likely reject the update.

## Guideline 1.2 (UGC)

- Terms of Use must be accepted on login/sign-up: https://jargar-alt.github.io/Gathered/terms.html
- Client-side content filter on new readings, prayers, and notes
- Flag / Block on other members’ posts (`···`)
- Reports stored in Firestore `reports`; `blockedUids` on the user profile
