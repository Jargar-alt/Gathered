import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'choice' | 'join' | 'create';

export default function OnboardingScreen() {
  const { profile, joinGroup, createGroup } = useAuth();
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fafaf9',
  },
  card: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  section: { gap: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1917',
  },
  description: {
    fontSize: 15,
    color: '#78716c',
  },
  option: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
  },
  optionDesc: {
    fontSize: 14,
    color: '#78716c',
    marginTop: 4,
  },
  back: {
    fontSize: 14,
    color: '#a8a29e',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    fontSize: 15,
  },
  error: { color: '#ef4444', fontSize: 12 },
  primaryBtn: {
    paddingVertical: 14,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
