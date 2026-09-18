/** @type {import('expo/config').ExpoConfig} */
const IS_DEV_CLIENT =
  process.env.EAS_BUILD_PROFILE === 'development' ||
  process.env.EAS_BUILD_PROFILE === 'development-simulator';

const authConfig = require('./auth.config');

// Bake Google Sign-In into the native binary when enabled.
const googleSignInPlugin = authConfig.enableGoogleSignIn
  ? [
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: authConfig.googleIosUrlScheme },
      ],
    ]
  : [];

module.exports = {
  name: 'Gathered',
  slug: 'gathered',
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gathered',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.acuratls.gathered',
    usesAppleSignIn: true,
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#fafaf9',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: 'com.acuratls.gathered',
    versionCode: 1,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    ...(IS_DEV_CLIENT ? ['expo-dev-client'] : []),
    [
      'expo-build-properties',
      {
        ios: {
          extraPods: [
            { name: 'GoogleUtilities', modular_headers: true },
            { name: 'RecaptchaInterop', modular_headers: true },
          ],
        },
      },
    ],
    ...googleSignInPlugin,
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#fafaf9',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#1c1917',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '6080dfab-8433-4115-9d43-57f1e9b2b685',
    },
    enableGoogleSignIn: authConfig.enableGoogleSignIn,
    ...(authConfig.enableGoogleSignIn
      ? {
          googleWebClientId: authConfig.googleWebClientId,
          googleIosClientId: authConfig.googleIosClientId,
          googleIosUrlScheme: authConfig.googleIosUrlScheme,
        }
      : {}),
  },
};
