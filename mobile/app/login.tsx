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
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import {
  getAuthErrorMessage,
  isGoogleSignInAvailable,
  signInWithGoogle,
} from '@/lib/socialAuth';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const googleAvailable = isGoogleSignInAvailable();

  const handleEmailAuth = async () => {
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

  const handleGoogle = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Gathered</Text>
            <Text style={styles.subtitle}>Where your group reads, prays, and shows up together.</Text>
          </View>

          {googleAvailable && (
            <View style={styles.socialSection}>
              <Pressable
                onPress={handleGoogle}
                disabled={loading || resetting}
                style={[styles.googleBtn, (loading || resetting) && styles.disabled]}
              >
                <Ionicons name="logo-google" size={18} color="#1c1917" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or use email</Text>
                <View style={styles.divider} />
              </View>
            </View>
          )}

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
              editable={!loading && !resetting}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? 'password' : 'new-password'}
              textContentType={isLogin ? 'password' : 'newPassword'}
              editable={!loading && !resetting}
            />

            {isLogin ? (
              <Pressable
                onPress={handleForgotPassword}
                disabled={loading || resetting}
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

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Pressable
              onPress={handleEmailAuth}
              disabled={loading || resetting || !email.trim() || !password}
              style={[
                styles.primaryBtn,
                (loading || resetting || !email.trim() || !password) && styles.disabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isLogin ? 'Sign in with Email' : 'Create Account'}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
              setInfo('');
            }}
            style={styles.switchBtn}
            disabled={loading || resetting}
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
  socialSection: { gap: 12, marginBottom: 8 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    backgroundColor: '#fff',
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1c1917' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#f5f5f4' },
  dividerText: { fontSize: 12, color: '#a8a29e', fontWeight: '500' },
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
  disabled: { opacity: 0.5 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#78716c' },
  switchLink: { fontWeight: '600', color: '#1c1917' },
});
