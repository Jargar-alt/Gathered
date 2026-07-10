import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import { AVATAR_COLORS, AVATAR_COLOR_MAP } from '@shared/constants';

export default function SettingsScreen() {
  const { profile, group } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor ?? AVATAR_COLORS[0]);
  const [initials, setInitials] = useState(profile?.initials ?? '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#78716c" />
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        avatarColor,
        initials: initials.slice(0, 2).toUpperCase(),
      });
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = async () => {
    await Clipboard.setStringAsync(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>

        <View style={styles.avatarSection}>
          <Avatar profile={{ ...profile, avatarColor, initials }} size="lg" />
          <View style={styles.colorPicker}>
            {AVATAR_COLORS.map((color: string) => (
              <Pressable
                key={color}
                onPress={() => setAvatarColor(color)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: AVATAR_COLOR_MAP[color],
                    borderColor: avatarColor === color ? '#1c1917' : 'transparent',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Initials</Text>
        <TextInput
          style={[styles.input, styles.initialsInput]}
          value={initials}
          onChangeText={(t) => setInitials(t.toUpperCase())}
          maxLength={2}
        />

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.disabled]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group Info</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Group Name</Text>
          <Text style={styles.infoValue}>{group.name}</Text>
        </View>
        <View style={[styles.infoBox, styles.inviteRow]}>
          <View>
            <Text style={styles.infoLabel}>Invite Code</Text>
            <Text style={styles.inviteCode}>{group.inviteCode}</Text>
          </View>
          <Pressable onPress={copyInviteCode} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => signOut(auth)} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917', marginBottom: 4 },
  avatarSection: { alignItems: 'center', gap: 16, marginBottom: 8 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a8a29e',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    fontSize: 15,
  },
  initialsInput: { width: 80, textAlign: 'center', fontWeight: '700' },
  saveBtn: {
    paddingVertical: 14,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
  infoBox: {
    padding: 16,
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a8a29e',
    marginBottom: 4,
  },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1c1917' },
  inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inviteCode: { fontSize: 20, fontWeight: '700', fontFamily: 'monospace', color: '#1c1917' },
  copyBtn: { padding: 8 },
  copyBtnText: { color: '#57534e', fontWeight: '600' },
  signOutBtn: {
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
