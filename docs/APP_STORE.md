# App Store Review Checklist — Gathered

**Bundle ID:** `com.acuratls.gathered`  
**Version:** `1.1.0`  
**Team:** JACK RILEY GARBER (`P9V25CHLW2`)  
**Privacy URL:** https://jargar-alt.github.io/Gathered/privacy.html  

> Build from a branch that includes: email-only auth, password reset, account deletion, logo, and `EXPO_NO_CAPABILITY_SYNC`. Do **not** submit older production builds.

---

## App Store Connect listing (paste these)

### Name
Gathered

### Subtitle (30 chars max)
Read and pray together

### Promotional text (170 chars)
Stay close to Scripture and to each other. Log daily readings, share prayer and praise, and show up for your small group—all in one quiet place.

### Description
Gathered is a simple home for small groups that want to stay faithful together.

Log what you’re reading in the Word. Share prayer requests and praise reports. React, leave notes, and get gentle notifications when your people post—so nothing important gets lost in a group text.

**Designed for groups of 2–5**
Create a private group or join with an invite code. Belong to more than one group and switch between them when you need to.

**Daily reading calendar**
Record scripture references and short reflections. See who in your group showed up that day.

**Prayer & praise**
Post requests or praise reports, react with emoji, and add notes so encouragement stays attached to the prayer.

**Private by design**
Your group’s readings and prayers are only visible to members. Sign in with email and password, Apple, or Google. Push notifications are optional.

Gathered is for the quiet work of showing up—for Scripture, for prayer, and for one another.

### Keywords (100 chars, comma-separated)
bible,prayer,small group,accountability,scripture,faith,reading,church,devotional,praise

### Support URL
mailto:jrgarber4@gmail.com

### Marketing URL (optional)
https://ai.studio/apps/8208d2b0-a74a-48ef-b802-330bc39f0036

### Privacy Policy URL
https://jargar-alt.github.io/Gathered/privacy.html

### Terms of Use URL
https://jargar-alt.github.io/Gathered/terms.html

---

## Age rating / App Privacy (nutrition labels)

| Data | Collected | Linked to user | Used for tracking |
|------|-----------|----------------|-------------------|
| Email / name | Yes (account) | Yes | No |
| User content (readings, prayers, notes) | Yes | Yes | No |
| Device ID / push token | Yes (if notifications on) | Yes | No |
| Product interaction | No analytics SDK beyond Firebase Auth/Firestore ops | — | No |

**Does not sell data. No third-party advertising.**

Encryption: export compliance already set (`ITSAppUsesNonExemptEncryption: false`).

---

## Review notes (App Store Connect)

```
Gathered is a private small-group Bible reading and prayer app.

This build addresses 1.2 (UGC) and 4.8 (Sign in with Apple alongside Google):
- Sign-in options: email/password, Sign in with Apple, and Google.
- Users must accept Terms of Use (EULA) on the login/sign-up screen before continuing. Terms state zero tolerance for objectionable content and abusive users: https://jargar-alt.github.io/Gathered/terms.html
- New posts are filtered for common objectionable language.
- On any other member’s reading or prayer, tap ··· to Flag content or Block user. Flagged posts are hidden for the reporter. Blocked users’ content is hidden. Unblock is in Settings.

Demo account:
Email: [CREATE AND PASTE]
Password: [CREATE AND PASTE]

How to test:
1. On login, open Terms of Use, check the agreement box, then sign in.
2. Calendar / Prayers: open another member’s post → ··· → Flag content or Block user.
3. Settings → Blocked users to unblock.

Screen recording of Terms + Flag + Block is attached in App Review Information notes.
```

---

## Auth

Email/password, **Sign in with Apple**, and **Google Sign-In**.

Rebuild native (`npm run build:ios`) — Apple/Google are not OTA/JS-only changes. Enable **Sign In with Apple** on App ID `com.acuratls.gathered` (builds use `EXPO_NO_CAPABILITY_SYNC=1`).

---

## Build & submit commands

```bash
cd mobile
npm run build:ios          # production IPA (skips Apple capability sync; auto-increments build)
npm run submit:ios         # upload to App Store Connect
```

Or submit a specific build:

```bash
eas submit --platform ios --profile production --id <BUILD_ID>
```

---

## Screenshots (required)

Capture on a physical device or Simulator (6.7" iPhone required at minimum):

1. Login (email/password + Apple + Google + Terms of Use checkbox)
2. Calendar with readings (··· safety menu visible on another member’s post)
3. Day detail / reading form
4. Prayers & praise list
5. Settings / groups

Save as PNG; App Store Connect accepts drag-and-drop.

---

## Pre-submit checklist

- [ ] Merge latest store-ready branch (email-only, password reset, delete account, logo)
- [ ] Deploy Firestore rules (user profile `delete` allowed)
- [ ] Privacy page updated on GitHub Pages
- [ ] New production EAS build
- [ ] App Store Connect app record for `com.acuratls.gathered`
- [ ] Paste listing copy + privacy URL
- [ ] Screenshots uploaded
- [ ] Demo account created in Firebase + filled into Review Notes
- [ ] APNs key in `eas credentials` (push)
- [ ] Age rating / privacy nutrition labels completed
- [ ] `eas submit` → select build → Submit for Review
