import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { auth } from '@/lib/firebase';
import authConfig from '../auth.config';

type GoogleExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
};

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
  return Boolean(getGoogleConfig().webClientId);
}

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync !== undefined;
}

export async function checkAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithGoogle(): Promise<void> {
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

export type AppleSignInResult = {
  displayName?: string;
};

export async function signInWithApple(): Promise<AppleSignInResult> {
  const available = await checkAppleSignInAvailable();
  if (!available) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce: nonce,
  });
  await signInWithCredential(auth, credential);

  const given = appleCredential.fullName?.givenName ?? '';
  const family = appleCredential.fullName?.familyName ?? '';
  const displayName = [given, family].filter(Boolean).join(' ').trim();

  return { displayName: displayName || undefined };
}

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: string }).code);
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
      return 'Sign-in was cancelled.';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('auth/invalid-credential')) {
      return 'Sign-in failed. Check that Google and Apple are enabled in Firebase Authentication.';
    }
    if (error.message.includes('auth/account-exists-with-different-credential')) {
      return 'An account already exists with this email using a different sign-in method.';
    }
    if (error.message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Try signing in with your original method.';
    }
    if (error.message.includes('auth/wrong-password') || error.message.includes('auth/invalid-email')) {
      return 'Invalid email or password.';
    }
    if (error.message.includes('auth/user-not-found')) {
      return 'No account found with this email.';
    }
    if (error.message.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    return error.message;
  }
  return 'Authentication failed. Please try again.';
}
