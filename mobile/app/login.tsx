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
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
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
            <Text style={styles.subtitle}>Matthew 18:20</Text>
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
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleEmailAuth}
              disabled={loading}
              style={[styles.primaryBtn, loading && styles.disabled]}
            >
              <Text style={styles.primaryBtnText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
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
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1c1917',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#78716c',
    fontStyle: 'italic',
    marginTop: 4,
  },
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
  },
  error: { color: '#ef4444', fontSize: 12 },
  primaryBtn: {
    paddingVertical: 14,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#78716c' },
  switchLink: { fontWeight: '700', color: '#1c1917', textDecorationLine: 'underline' },
});
