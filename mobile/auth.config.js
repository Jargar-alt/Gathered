/**
 * Auth / OAuth config.
 *
 * Google + Sign in with Apple (App Store guideline 4.8).
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
  enableGoogleSignIn: true,
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULTS.googleWebClientId,
  googleIosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || DEFAULTS.googleIosClientId,
  googleIosUrlScheme:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || DEFAULTS.googleIosUrlScheme,
};
