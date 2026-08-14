/**
 * Google OAuth client IDs (public — safe to ship in the app).
 * Env vars override these when set (EAS eas.json env / .env.local).
 */
const DEFAULTS = {
  googleWebClientId:
    '422740563122-rq72cm5pbagtrrsci8k8jn9ipoen7m3u.apps.googleusercontent.com',
  googleIosClientId:
    '422740563122-4ft8miaq8k280qcb52spp0rbetftmrhk.apps.googleusercontent.com',
  googleIosUrlScheme:
    'com.googleusercontent.apps.422740563122-4ft8miaq8k280qcb52spp0rbetftmrhk',
};

module.exports = {
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULTS.googleWebClientId,
  googleIosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || DEFAULTS.googleIosClientId,
  googleIosUrlScheme:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || DEFAULTS.googleIosUrlScheme,
};
