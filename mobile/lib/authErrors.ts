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

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: string }).code);
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED' || code === 'SIGN_IN_CANCELLED') {
      return 'Sign-in was cancelled.';
    }
    if (code === 'auth/requires-recent-login') {
      return 'For security, confirm your account again to delete it.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
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
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in method is not enabled.';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('auth/invalid-credential') || error.message.includes('auth/wrong-password')) {
      return 'Invalid email or password.';
    }
    if (error.message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Try signing in.';
    }
    if (error.message.includes('auth/invalid-email')) {
      return 'Enter a valid email address.';
    }
    if (error.message.includes('auth/user-not-found')) {
      return 'No account found with this email.';
    }
    if (error.message.includes('auth/too-many-requests')) {
      return 'Too many attempts. Wait a bit and try again.';
    }
    if (error.message.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (error.message.includes('auth/requires-recent-login')) {
      return 'For security, confirm your account again to delete it.';
    }
    return error.message;
  }
  return 'Authentication failed. Please try again.';
}
