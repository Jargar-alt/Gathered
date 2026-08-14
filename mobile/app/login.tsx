import { useEffect, useState } from 'react';
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
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/lib/firebase';
import {
  checkAppleSignInAvailable,
  getAuthErrorMessage,
  isGoogleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/socialAuth';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googleAvailable = isGoogleSignInAvailable();

  useEffect(() => {
    checkAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const handleEmailAuth = async () => {
    setError('');
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

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setError('');
    setLoading(true);
    try {
      const { displayName } = await signInWithApple();
      const user = auth.currentUser;
      if (user && displayName) {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName,
          initials: displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        });
      }
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err);
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const showSocial = googleAvailable || appleAvailable;

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

          {showSocial && (
            <View style={styles.socialSection}>
              {appleAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={12}
                  style={styles.appleBtn}
                  onPress={handleApple}
                />
              )}

              {googleAvailable && (
                <Pressable
                  onPress={handleGoogle}
                  disabled={loading}
                  style={[styles.googleBtn, loading && styles.disabled]}
                >
                  <Ionicons name="logo-google" size={18} color="#1c1917" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </Pressable>
              )}

              {!googleAvailable && Platform.OS === 'ios' && (
                <Text style={styles.configHint}>
                  Google Sign-In needs a rebuild with Google client IDs configured.
                </Text>
              )}

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
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? 'password' : 'new-password'}
              textContentType={isLogin ? 'password' : 'newPassword'}
              editable={!loading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleEmailAuth}
              disabled={loading || !email.trim() || !password}
              style={[styles.primaryBtn, (loading || !email.trim() || !password) && styles.disabled]}
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
            }}
            style={styles.switchBtn}
            disabled={loading}
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
    padding: 16,
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
  appleBtn: { width: '100%', height: 48 },
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
  configHint: {
    fontSize: 11,
    color: '#a8a29e',
    textAlign: 'center',
    lineHeight: 16,
  },
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
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#78716c',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 4,
    color: '#1c1917',
  },
  error: { color: '#ef4444', fontSize: 13, lineHeight: 18 },
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
  switchLink: { fontWeight: '700', color: '#1c1917', textDecorationLine: 'underline' },
});
