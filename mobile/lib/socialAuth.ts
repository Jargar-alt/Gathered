import { Platform, TurboModuleRegistry } from 'react-native';
import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  signInWithCredential,
  reauthenticateWithCredential,
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

export async function signInWithGoogle(): Promise<void> {
  if (!isGoogleSignInAvailable()) {
    throw new Error('Google Sign-In is not available in this build.');
  }

  const idToken = await getGoogleIdToken();
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
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
