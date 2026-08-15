/**
 * Google OAuth client IDs (public — safe to ship in the app).
 * Env vars override these when set (EAS eas.json env / .env.local).
 *
 * Prefix 1074128724577 = Gathered Firebase / Google Cloud project.
 */
const DEFAULTS = {
  googleWebClientId:
    '1074128724577-er7cssinjgafqgrl8am8k82laga9n39p.apps.googleusercontent.com',
  googleIosClientId:
    '1074128724577-6qctc3k3uskb48j7vpjs6no1ssi3nca2.apps.googleusercontent.com',
  googleIosUrlScheme:
    'com.googleusercontent.apps.1074128724577-6qctc3k3uskb48j7vpjs6no1ssi3nca2',
};

module.exports = {
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULTS.googleWebClientId,
  googleIosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || DEFAULTS.googleIosClientId,
  googleIosUrlScheme:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || DEFAULTS.googleIosUrlScheme,
};
