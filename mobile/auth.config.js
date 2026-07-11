/**
 * OAuth client IDs from Firebase / Google Cloud Console.
 *
 * Setup:
 * 1. Firebase Console → Authentication → Sign-in method → Enable Google & Apple
 * 2. Google: copy Web Client ID from Web SDK configuration
 * 3. Google (iOS): create iOS OAuth client in Google Cloud Console for bundle ID
 *    com.acuratls.gathered — copy the iOS client ID and reversed URL scheme
 * 4. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 *    in EAS secrets or a local .env file for development builds
 */
module.exports = {
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleIosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? '',
};
