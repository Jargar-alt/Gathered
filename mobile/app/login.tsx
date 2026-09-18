import { useState } from 'react';
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
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAuthErrorMessage, isAuthCancelled } from '@/lib/authErrors';
import {
  isGoogleSignInAvailable,
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
  const [resetting, setResetting] = useState(false);
  const googleAvailable = isGoogleSignInAvailable();
  const busy = loading || googleLoading || resetting;

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
      setError(getAuthErrorMessage(err));
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
      setError(getAuthErrorMessage(err));
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
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
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
                  <ActivityIndicator size="small" color="#78716c" />
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            {googleAvailable ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  onPress={handleGoogleAuth}
                  disabled={busy || !acceptedTerms}
                  style={[
                    styles.googleBtn,
                    (busy || !acceptedTerms) && styles.disabled,
                  ]}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#1c1917" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={18} color="#4285F4" />
                      <Text style={styles.googleBtnText}>Google</Text>
                    </>
                  )}
                </Pressable>
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
  container: { flex: 1, backgroundColor: '#fafaf9' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 88, height: 88, marginBottom: 12, borderRadius: 20 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1c1917',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#78716c',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  form: { gap: 12 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716c',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 4,
    color: '#1c1917',
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 4, minHeight: 20 },
  forgotText: { fontSize: 13, fontWeight: '500', color: '#78716c' },
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
    borderColor: '#d6d3d1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#1c1917',
    borderColor: '#1c1917',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#57534e',
    lineHeight: 19,
  },
  termsLink: {
    color: '#1c1917',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  error: { color: '#ef4444', fontSize: 13, lineHeight: 18 },
  info: { color: '#15803d', fontSize: 13, lineHeight: 18 },
  primaryBtn: {
    paddingVertical: 14,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e7e5e4' },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a8a29e',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    minHeight: 48,
  },
  googleBtnText: { color: '#1c1917', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#78716c' },
  switchLink: { fontWeight: '600', color: '#1c1917' },
});
