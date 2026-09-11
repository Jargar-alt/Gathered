import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { auth } from '@/lib/firebase';
import authConfig from '../auth.config';

export { getAuthErrorMessage } from '@/lib/authErrors';

type GoogleExtra = {
  enableGoogleSignIn?: boolean;
  googleWebClientId?: string;
  googleIosClientId?: string;
};

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

let googleConfigured = false;

function configureGoogleSignIn() {
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
  return isGoogleEnabled() && Boolean(getGoogleConfig().webClientId);
}

export async function signInWithGoogle(): Promise<void> {
  if (!isGoogleSignInAvailable()) {
    throw new Error('Google Sign-In is not available in this build.');
  }

  const { webClientId } = getGoogleConfig();
  if (!webClientId) {
    throw new Error(
      'Google Sign-In is not configured. Rebuild with Google client IDs in auth.config.js / EAS env.'
    );
  }

  configureGoogleSignIn();
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

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}
