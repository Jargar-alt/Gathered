# App Store Review Checklist — Gathered

**Bundle ID:** `com.acuratls.gathered`  
**Version:** `1.0.0`  
**Team:** JACK RILEY GARBER (`P9V25CHLW2`)  
**Privacy URL:** https://jargar-alt.github.io/Gathered/privacy.html  

> Do **not** submit production build #2 (July) — it predates Google OAuth, multi-group, and UX fixes. Use a new `production` EAS build from current `main`.

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
Your group’s readings and prayers are only visible to members. Sign in with email or Google. Push notifications are optional.

Gathered is for the quiet work of showing up—for Scripture, for prayer, and for one another.

### Keywords (100 chars, comma-separated)
bible,prayer,small group,accountability,scripture,faith,reading,church,devotional,praise

### Support URL
mailto:jrgarber4@gmail.com  
(or a simple support page if you prefer)

### Marketing URL (optional)
https://ai.studio/apps/8208d2b0-a74a-48ef-b802-330bc39f0036

### Privacy Policy URL
https://jargar-alt.github.io/Gathered/privacy.html

---

## Age rating / App Privacy (nutrition labels)

Typical answers for Gathered:

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

Demo account:
Email: [CREATE AND PASTE]
Password: [CREATE AND PASTE]

How to test:
1. Sign in with the demo account (email/password).
2. You will already be in a demo group, or create/join with invite code.
3. Calendar → pick today → Record Reading.
4. Prayers → New Entry → post a request; add a note.
5. Settings → Your groups → switch / create another group if desired.

Sign-in options: Email/password and Google.
Privacy policy: https://jargar-alt.github.io/Gathered/privacy.html
```

---

## Guideline 4.8 (important)

The app offers **Google** as a third-party login. Apple often requires **Sign in with Apple** as an equivalent option.

**Safer for review (pick one before submit):**
1. Keep Google + re-add Sign in with Apple, **or**
2. Ship **email/password only** for v1.0 (hide Google button)

Current code: Google + email (Apple removed).

---

## Build & submit commands

```bash
cd mobile
npm run build:ios          # production IPA (auto-increments build number)
npm run submit:ios         # upload to App Store Connect
```

Or submit a specific build:
```bash
eas submit --platform ios --profile production --id <BUILD_ID>
```

---

## Screenshots (required)

Capture on a physical device or Simulator (6.7" iPhone required at minimum):

1. Login  
2. Calendar with readings  
3. Day detail / reading form  
4. Prayers & praise list  
5. Settings / groups  

Save as PNG; App Store Connect accepts drag-and-drop.

---

## Pre-submit checklist

- [ ] New production EAS build from current `main`
- [ ] Decide Google vs Apple Sign-In (guideline 4.8)
- [ ] App Store Connect app record for `com.acuratls.gathered`
- [ ] Paste listing copy + privacy URL
- [ ] Screenshots uploaded
- [ ] Demo account created in Firebase + filled into Review Notes
- [ ] APNs key in `eas credentials` (push)
- [ ] Age rating / privacy nutrition labels completed
- [ ] `eas submit` → select build → Submit for Review
