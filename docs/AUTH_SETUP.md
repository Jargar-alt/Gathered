# Authentication Setup (Mobile)

## App Store — email / password only

Apple rejected Google-only third-party login (guideline **4.8**). The iOS build is **email/password only**. `enableGoogleSignIn` is hardcoded `false` in `mobile/auth.config.js`. The Google native plugin is not included.

Enable in Firebase Console:

1. Open [Firebase Console](https://console.firebase.google.com/) → project `gen-lang-client-0346540522`
2. **Authentication** → **Sign-in method** → enable **Email/Password**

## Guideline 1.2 (UGC)

- Terms of Use must be accepted on login/sign-up: https://jargar-alt.github.io/Gathered/terms.html
- Client-side content filter on new readings, prayers, and notes
- Flag / Block on other members’ posts (`···`)
- Reports stored in Firestore `reports`; `blockedUids` on the user profile

## Re-enabling Google later

Add **Sign in with Apple** first, then flip Google back on and rebuild.
