import { useEffect, useState } from 'react';
import { colors } from '@shared/colors';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAuthErrorMessage, isAuthCancelled } from '@/lib/authErrors';
import {
  isAppleSignInAvailable,
  isGoogleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/socialAuth';

const TERMS_URL = 'https://jargar-alt.github.io/Gathered/terms.html';
const PRIVACY_URL = 'https://jargar-alt.github.io/Gathered/privacy.html';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googleAvailable = isGoogleSignInAvailable();
  const socialAvailable = googleAvailable || appleAvailable;
  const busy = loading || googleLoading || appleLoading || resetting;

  useEffect(() => {
    let cancelled = false;
    isAppleSignInAvailable()
      .then((ok) => {
        if (!cancelled) setAppleAvailable(ok);
      })
      .catch(() => {
        if (!cancelled) setAppleAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEmailAuth = async () => {
    if (!acceptedTerms) {
      setError('Agree to the Terms of Use before continuing.');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'email'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email above, then tap Forgot password.');
      setInfo('');
      return;
    }
    setError('');
    setInfo('');
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setInfo('Password reset email sent. Check your inbox (and spam).');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'email'));
    } finally {
      setResetting(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!acceptedTerms) {
      setError('Agree to the Terms of Use before continuing.');
      return;
    }
    setError('');
    setInfo('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      if (!isAuthCancelled(err)) {
        setError(getAuthErrorMessage(err, 'google'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (!acceptedTerms) {
      setError('Agree to the Terms of Use before continuing.');
      return;
    }
    setError('');
    setInfo('');
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch (err: unknown) {
      if (!isAuthCancelled(err)) {
        setError(getAuthErrorMessage(err, 'apple'));
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Gathered logo"
            />
            <Text style={styles.title}>Gathered</Text>
            <Text style={styles.subtitle}>Where your group reads, prays, and shows up together.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!busy}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? 'password' : 'new-password'}
              textContentType={isLogin ? 'password' : 'newPassword'}
              editable={!busy}
            />

            {isLogin ? (
              <Pressable
                onPress={handleForgotPassword}
                disabled={busy}
                style={styles.forgotBtn}
                hitSlop={8}
              >
                {resetting ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Text style={styles.forgotText}>Forgot password?</Text>
                )}
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => setAcceptedTerms((v) => !v)}
              style={styles.termsRow}
              disabled={busy}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL(TERMS_URL)}
                >
                  Terms of Use
                </Text>
                {' '}(no tolerance for objectionable content or abuse) and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL(PRIVACY_URL)}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Pressable
              onPress={handleEmailAuth}
              disabled={busy || !email.trim() || !password || !acceptedTerms}
              style={[
                styles.primaryBtn,
                (busy || !email.trim() || !password || !acceptedTerms) &&
                  styles.disabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            {socialAvailable ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {appleAvailable ? (
                  appleLoading ? (
                    <View style={styles.appleLoading}>
                      <ActivityIndicator color={colors.text} />
                    </View>
                  ) : (
                    <View
                      pointerEvents={busy || !acceptedTerms ? 'none' : 'auto'}
                      style={(busy || !acceptedTerms) && styles.disabled}
                    >
                      <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={12}
                        style={styles.appleBtn}
                        onPress={handleAppleAuth}
                      />
                    </View>
                  )
                ) : null}

                {googleAvailable ? (
                  <Pressable
                    onPress={handleGoogleAuth}
                    disabled={busy || !acceptedTerms}
                    style={[
                      styles.googleBtn,
                      (busy || !acceptedTerms) && styles.disabled,
                    ]}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#4285F4" />
                        <Text style={styles.googleBtnText}>Google</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
              setInfo('');
            }}
            style={styles.switchBtn}
            disabled={busy}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 88, height: 88, marginBottom: 12, borderRadius: 20 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  form: { gap: 12 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 4,
    color: colors.text,
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 4, minHeight: 20 },
  forgotText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  checkmark: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  termsLink: {
    color: colors.text,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  info: { color: colors.success, fontSize: 13, lineHeight: 18 },
  primaryBtn: {
    paddingVertical: 14,
    backgroundColor: colors.text,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 15 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSubtle,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  googleBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  appleBtn: {
    width: '100%',
    height: 48,
    opacity: 1,
  },
  appleLoading: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, color: colors.textMuted },
  switchLink: { fontWeight: '600', color: colors.text },
});
