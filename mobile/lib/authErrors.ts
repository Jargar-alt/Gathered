export function isAuthCancelled(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: string }).code);
    if (
      code === 'ERR_REQUEST_CANCELED' ||
      code === 'ERR_CANCELED' ||
      code === 'SIGN_IN_CANCELLED'
    ) {
      return true;
    }
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('cancelled') || msg.includes('canceled');
  }
  return false;
}

function getErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return '';
}

export type AuthErrorMethod = 'email' | 'apple' | 'google' | 'other';

/**
 * Map Firebase / native auth errors to user-facing copy.
 * Pass `method` so OAuth failures are not shown as "Incorrect password".
 */
export function getAuthErrorMessage(
  error: unknown,
  method: AuthErrorMethod = 'other'
): string {
  const code = getErrorCode(error);
  const raw = getErrorMessage(error);
  const lower = raw.toLowerCase();

  if (
    code === 'ERR_REQUEST_CANCELED' ||
    code === 'ERR_CANCELED' ||
    code === 'SIGN_IN_CANCELLED'
  ) {
    return 'Sign-in was cancelled.';
  }

  if (code === 'auth/requires-recent-login') {
    return 'For security, confirm your account again to delete it.';
  }

  if (code === 'auth/operation-not-allowed') {
    if (method === 'apple') {
      return 'Sign in with Apple is not enabled in Firebase. Enable Apple under Authentication → Sign-in method.';
    }
    if (method === 'google') {
      return 'Google Sign-In is not enabled in Firebase. Enable Google under Authentication → Sign-in method.';
    }
    return 'This sign-in method is not enabled.';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method. Sign in with that method first.';
  }

  if (code === 'auth/missing-or-invalid-nonce') {
    return 'Apple Sign-In failed (invalid nonce). Try again.';
  }

  // OAuth / Apple / Google often fail with invalid-credential — never call that a password error.
  if (code === 'auth/invalid-credential' || lower.includes('auth/invalid-credential')) {
    if (method === 'apple') {
      if (lower.includes('audience')) {
        return 'Apple Sign-In audience mismatch. In Firebase → Authentication → Apple, set Services ID to com.acuratls.gathered (your App ID / bundle ID).';
      }
      return (
        'Apple Sign-In was rejected by Firebase. Confirm Apple is enabled, Sign In with Apple is on for com.acuratls.gathered, and Services ID is the bundle ID.'
      );
    }
    if (method === 'google') {
      return 'Google Sign-In was rejected by Firebase. Confirm Google is enabled and this build has the correct client IDs.';
    }
    return 'Invalid email or password.';
  }

  if (code === 'auth/wrong-password') {
    return 'Incorrect password. Try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a bit and try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Try signing in.';
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (code === 'auth/user-not-found') {
    return 'No account found with this email.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.';
  }

  if (raw) {
    // Prefer Firebase's own detail over a blank generic when we didn't match above.
    const cleaned = raw.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/[^)]+\)\.?\s*$/i, '').trim();
    return cleaned || raw;
  }

  return 'Authentication failed. Please try again.';
}
