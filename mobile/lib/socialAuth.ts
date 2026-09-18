import { Platform, TurboModuleRegistry } from 'react-native';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  reauthenticateWithCredential,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import authConfig from '../auth.config';

export { getAuthErrorMessage } from '@/lib/authErrors';

type GoogleExtra = {
  enableGoogleSignIn?: boolean;
  googleWebClientId?: string;
  googleIosClientId?: string;
};

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

function isGoogleEnabled(): boolean {
  const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;
  if (typeof extra.enableGoogleSignIn === 'boolean') {
    return extra.enableGoogleSignIn;
  }
  return Boolean(authConfig.enableGoogleSignIn);
}

function getGoogleConfig(): { webClientId: string; iosClientId?: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;
  const webClientId =
    extra.googleWebClientId ||
    authConfig.googleWebClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '';
  const iosClientId =
    extra.googleIosClientId ||
    authConfig.googleIosClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    '';
  return {
    webClientId,
    iosClientId: iosClientId || undefined,
  };
}

function hasGoogleNativeModule(): boolean {
  return TurboModuleRegistry.get('RNGoogleSignin') != null;
}

function loadGoogleSignin(): GoogleSignInModule {
  // Lazy: the package calls TurboModuleRegistry.getEnforcing on import.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-google-signin/google-signin');
}

let googleConfigured = false;

function configureGoogleSignIn(GoogleSignin: GoogleSignInModule['GoogleSignin']) {
  if (googleConfigured) return;
  const { webClientId, iosClientId } = getGoogleConfig();
  if (!webClientId) return;

  GoogleSignin.configure({
    webClientId,
    iosClientId,
  });
  googleConfigured = true;
}

export function isGoogleSignInAvailable(): boolean {
  return (
    isGoogleEnabled() &&
    Boolean(getGoogleConfig().webClientId) &&
    hasGoogleNativeModule()
  );
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

async function getGoogleIdToken(): Promise<string> {
  if (!hasGoogleNativeModule()) {
    throw new Error('Google Sign-In requires a new native build. Rebuild the app, then try again.');
  }

  const { webClientId } = getGoogleConfig();
  if (!webClientId) {
    throw new Error(
      'Google Sign-In is not configured. Rebuild with Google client IDs in auth.config.js / EAS env.'
    );
  }

  const { GoogleSignin, isSuccessResponse } = loadGoogleSignin();
  configureGoogleSignIn(GoogleSignin);
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error('Google Sign-In was cancelled.');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token.');
  }
  return idToken;
}

async function getAppleCredential() {
  const available = await isAppleSignInAvailable();
  if (!available) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const apple = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!apple.identityToken) {
    throw new Error('Sign in with Apple did not return an identity token.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: apple.identityToken,
    rawNonce,
  });

  const given = apple.fullName?.givenName?.trim() ?? '';
  const family = apple.fullName?.familyName?.trim() ?? '';
  const displayName = [given, family].filter(Boolean).join(' ');

  return { credential, displayName: displayName || undefined };
}

async function applyAppleDisplayName(displayName?: string) {
  if (!displayName || !auth.currentUser) return;
  if (auth.currentUser.displayName) return;
  try {
    await updateProfile(auth.currentUser, { displayName });
  } catch {
    // Profile sync is best-effort; AuthContext still creates a Firestore profile
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (!isGoogleSignInAvailable()) {
    throw new Error('Google Sign-In is not available in this build.');
  }

  const idToken = await getGoogleIdToken();
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

export async function signInWithApple(): Promise<void> {
  const { credential, displayName } = await getAppleCredential();
  await signInWithCredential(auth, credential);
  await applyAppleDisplayName(displayName);
}

export async function reauthenticateWithGoogle(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }
  const idToken = await getGoogleIdToken();
  const credential = GoogleAuthProvider.credential(idToken);
  await reauthenticateWithCredential(user, credential);
}

export async function reauthenticateWithApple(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }
  const { credential } = await getAppleCredential();
  await reauthenticateWithCredential(user, credential);
}

export async function signOutGoogle(): Promise<void> {
  if (!hasGoogleNativeModule()) return;
  try {
    const { GoogleSignin } = loadGoogleSignin();
    configureGoogleSignIn(GoogleSignin);
    await GoogleSignin.signOut();
  } catch {
    // Already signed out of Google, or native module missing in this binary
  }
}

export async function revokeGoogleAccess(): Promise<void> {
  if (!hasGoogleNativeModule()) return;
  try {
    const { GoogleSignin } = loadGoogleSignin();
    configureGoogleSignIn(GoogleSignin);
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {
    // Ignore — account deletion should still proceed
  }
}
