# Play Store Checklist — Gathered

**Package name:** `com.acuratls.gathered`  
**Version:** `1.1.0` (`versionCode` auto-increments via EAS)  
**Privacy URL:** https://jargar-alt.github.io/Gathered/privacy.html  
**Terms URL:** https://jargar-alt.github.io/Gathered/terms.html  

> Build from a store-ready branch (email auth, Google Sign-In, account deletion, UGC safety). Do **not** submit old AABs.

---

## Prerequisites (Google accounts)

1. [Google Play Developer account](https://play.google.com/console) ($25 one-time) if you do not have one.
2. Create the app in Play Console:
   - App name: **Gathered**
   - Default language: English (US)
   - App or game: App
   - Free
   - Declarations as required
3. Firebase Console → project `gen-lang-client-0346540522` → **Add Android app** with package `com.acuratls.gathered`  
   (You do **not** need to commit `google-services.json` for the current Expo Firebase JS setup.)
4. Register signing SHA-1 / SHA-256 for Google Sign-In (see [AUTH_SETUP.md](./AUTH_SETUP.md) § Android).

---

## Play Console store listing (paste these)

### App name
Gathered

### Short description (80 chars max)
Read Scripture and pray together with your small group.

### Full description
Gathered is a simple home for small groups that want to stay faithful together.

Log what you’re reading in the Word. Share prayer requests and praise reports. React, leave notes, and get gentle notifications when your people post—so nothing important gets lost in a group text.

**Designed for groups of 2–5**
Create a private group or join with an invite code. Belong to more than one group and switch between them when you need to.

**Daily reading calendar**
Record scripture references and short reflections. See who in your group showed up that day.

**Prayer & praise**
Post requests or praise reports, react with emoji, and add notes so encouragement stays attached to the prayer.

**Private by design**
Your group’s readings and prayers are only visible to members. Sign in with email and password or Google. Push notifications are optional.

Gathered is for the quiet work of showing up—for Scripture, for prayer, and for one another.

### App category
Lifestyle (or Social)

### Contact email
jrgarber4@gmail.com

### Privacy policy
https://jargar-alt.github.io/Gathered/privacy.html

### Website (optional)
https://ai.studio/apps/8208d2b0-a74a-48ef-b802-330bc39f0036

---

## Data safety (Play Console)

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email | Yes | No | Account |
| Name | Yes | No | Account / profile |
| User-generated content (readings, prayers, notes) | Yes | No | App features |
| Device / other IDs (Expo push token) | Yes (if notifications on) | No | Push notifications |

- **Not** sold
- **No** advertising SDKs
- **No** third-party analytics beyond Firebase Auth / Firestore operations
- Encryption in transit: Yes (HTTPS / Firebase)

---

## Content rating & audience

Complete the IARC questionnaire in Play Console. Expected outcome for a faith small-group app with UGC: low maturity; declare user-generated content and optional messaging-style posts (prayers/notes).

Target age: 13+ (or as your rating requires).

---

## Screenshots (required)

Phone screenshots (at least 2; 16:9 or typical phone portrait):

1. Login (email/password + Google + Terms of Use checkbox)
2. Calendar with readings
3. Day detail / reading form
4. Prayers & praise list
5. Settings / groups

Optional: 7" tablet if you claim tablet support later.

---

## Build & submit commands

```bash
cd mobile
npm run build:android          # production AAB (auto-increments versionCode)
npm run submit:android         # upload to Play internal track as draft
```

Or submit a specific build:

```bash
eas submit --platform android --profile production --id <BUILD_ID>
```

First submit may ask you to link a Google service account or sign in with a Play Console admin account. Prefer a [Play Console API service account](https://expo.fyi/creating-google-service-account) for non-interactive uploads.

EAS `submit.production.android` uses track **`internal`** and **`draft`** release status so you can review before rolling out.

Promote: Play Console → Testing → Internal testing → promote to Production when ready.

---

## Google Sign-In on Android

Email/password works without extra keys. Google Sign-In needs the **upload keystore SHA-1** (and usually SHA-256) registered on the Firebase Android app / Google Cloud OAuth Android client.

```bash
cd mobile
eas credentials -p android
```

Full steps: [AUTH_SETUP.md](./AUTH_SETUP.md) § Google Sign-In → Android.

---

## Pre-submit checklist

- [ ] Play Developer account active
- [ ] App created with package `com.acuratls.gathered`
- [ ] Firebase Android app added
- [ ] SHA-1 / SHA-256 from `eas credentials` added (Google Sign-In)
- [ ] Privacy + terms URLs live on GitHub Pages
- [ ] Store listing copy + screenshots uploaded
- [ ] Data safety form completed
- [ ] Content rating completed
- [ ] Production EAS Android build (`npm run build:android`)
- [ ] `npm run submit:android` (or manual AAB upload) to internal track
- [ ] Internal testers smoke-test email + Google login
- [ ] Promote to Production → Submit for review
