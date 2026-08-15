<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8208d2b0-a74a-48ef-b802-330bc39f0036

> **Important:** This GitHub repo (`Jargar-alt/Gathered`) is the source of truth for the **mobile app**, Firebase functions/rules, and privacy docs. Do **not** enable AI Studio “push to GitHub” / sync that overwrites `main` — a prior AI Studio sync deleted the entire `mobile/` tree. Treat AI Studio as a separate copy of the web UI only, or pull *from* GitHub into AI Studio—not the other way around.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mobile App (Expo)

An iOS app lives in [`mobile/`](mobile/). See [mobile/README.md](mobile/README.md) for setup and App Store build instructions.

```bash
cd mobile
npm install
npx expo start   # scan QR with Expo Go on your iPhone
```

### App Store (EAS)

```bash
cd mobile
npm install -g eas-cli
eas login
eas init          # one-time: links project + sets push notification projectId
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Push notifications require deploying Cloud Functions (see mobile README) and uploading an APNs key via `eas credentials`.

## Privacy Policy

The privacy policy lives in [`docs/privacy.html`](docs/privacy.html).

To host for App Store Connect, enable **GitHub Pages** on this repo:
1. GitHub → **Settings** → **Pages** → Source: `main` branch, `/docs` folder
2. Use URL: `https://jargar-alt.github.io/Gathered/privacy.html`

## Mobile authentication

See [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md) for Google and email/password setup.
