/**
 * Auth / OAuth config.
 *
 * Google Sign-In is OFF for App Store (guideline 4.8 rejection).
 * Email/password only until Sign in with Apple is added alongside Google.
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
  enableGoogleSignIn: false,
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULTS.googleWebClientId,
  googleIosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || DEFAULTS.googleIosClientId,
  googleIosUrlScheme:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || DEFAULTS.googleIosUrlScheme,
};
