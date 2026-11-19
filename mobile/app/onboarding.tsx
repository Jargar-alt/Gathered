import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { signOutGoogle } from '@/lib/socialAuth';

type Mode = 'choice' | 'join' | 'create';

export default function OnboardingScreen() {
  const { profile, joinGroup, createGroup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleJoin = async () => {
    if (!profile || !inviteCode.trim()) return;
    setError('');
    setBusy(true);
    try {
      await joinGroup(inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!profile || !groupName.trim()) return;
    setError('');
    setBusy(true);
    try {
      await createGroup(groupName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    await signOut(auth);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.card}>
          {mode === 'choice' && (
            <View style={styles.section}>
              <Text style={styles.title}>Welcome to Gathered</Text>
              <Text style={styles.description}>
                To get started, join or create a group.
              </Text>
              <Pressable onPress={() => setMode('join')} style={styles.option}>
                <Text style={styles.optionTitle}>Join a Group</Text>
                <Text style={styles.optionDesc}>Enter an invite code from a friend.</Text>
              </Pressable>
              <Pressable onPress={() => setMode('create')} style={styles.option}>
                <Text style={styles.optionTitle}>Create a Group</Text>
                <Text style={styles.optionDesc}>
                  Start a new accountability group for 2-5 people.
                </Text>
              </Pressable>

              <View style={styles.accountActions}>
                <Pressable
                  onPress={() => router.push('/(tabs)/settings')}
                  style={styles.accountBtn}
                  disabled={busy}
                >
                  <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.accountBtnText}>Account settings</Text>
                </Pressable>
                <Pressable onPress={handleSignOut} style={styles.signOutBtn} disabled={busy}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                  <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'join' && (
            <View style={styles.section}>
              <Pressable onPress={() => setMode('choice')}>
                <Text style={styles.back}>← Back</Text>
              </Pressable>
              <Text style={styles.title}>Join Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Invite Code (e.g. AB12CD)"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                editable={!busy}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                onPress={handleJoin}
                style={[styles.primaryBtn, busy && styles.disabled]}
                disabled={busy}
              >
                <Text style={styles.primaryBtnText}>{busy ? 'Joining…' : 'Join Group'}</Text>
              </Pressable>
            </View>
          )}

          {mode === 'create' && (
            <View style={styles.section}>
              <Pressable onPress={() => setMode('choice')}>
                <Text style={styles.back}>← Back</Text>
              </Pressable>
              <Text style={styles.title}>Create Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                editable={!busy}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                onPress={handleCreate}
                style={[styles.primaryBtn, busy && styles.disabled]}
                disabled={busy}
              >
                <Text style={styles.primaryBtnText}>{busy ? 'Creating…' : 'Create Group'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { gap: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.brand,
  },
  description: {
    fontSize: 15,
    color: colors.textMuted,
  },
  option: {
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  accountActions: {
    marginTop: 8,
    gap: 10,
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  accountBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  back: {
    fontSize: 14,
    color: colors.textSubtle,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 12 },
  primaryBtn: {
    paddingVertical: 14,
    backgroundColor: colors.text,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
