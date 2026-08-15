import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import { AVATAR_COLORS, AVATAR_COLOR_MAP } from '@shared/constants';

type GroupAction = 'idle' | 'join' | 'create';

export default function SettingsScreen() {
  const {
    profile,
    group,
    groups,
    switchGroup,
    joinGroup,
    createGroup,
    leaveGroup,
  } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor ?? AVATAR_COLORS[0]);
  const [initials, setInitials] = useState(profile?.initials ?? '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [groupAction, setGroupAction] = useState<GroupAction>('idle');
  const [inviteCode, setInviteCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const [groupBusy, setGroupBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setAvatarColor(profile.avatarColor);
    setInitials(profile.initials);
  }, [profile]);

  if (!profile || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#78716c" />
      </View>
    );
  }

  const hasChanges =
    displayName !== profile.displayName ||
    avatarColor !== profile.avatarColor ||
    initials !== profile.initials;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        avatarColor,
        initials: initials.slice(0, 2).toUpperCase(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = async () => {
    await Clipboard.setStringAsync(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinAnother = async () => {
    setGroupError('');
    setGroupBusy(true);
    try {
      await joinGroup(inviteCode);
      setInviteCode('');
      setGroupAction('idle');
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setGroupBusy(false);
    }
  };

  const handleCreateAnother = async () => {
    setGroupError('');
    setGroupBusy(true);
    try {
      await createGroup(newGroupName);
      setNewGroupName('');
      setGroupAction('idle');
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setGroupBusy(false);
    }
  };

  const confirmLeave = (groupId: string, name: string) => {
    Alert.alert(
      'Leave group?',
      `You will leave “${name}”. You can rejoin later with an invite code.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveGroup(groupId).catch((err) => {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to leave');
            });
          },
        },
      ]
    );
  };

  const previewProfile = { ...profile, displayName, avatarColor, initials };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Avatar profile={previewProfile} size="lg" />
        <Text style={styles.heroName}>{displayName || 'Your Name'}</Text>
        <Text style={styles.heroEmail}>{profile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <Text style={styles.sectionHint}>Choose a color for your avatar</Text>
        <View style={styles.colorPicker}>
          {AVATAR_COLORS.map((color: string) => {
            const selected = avatarColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => setAvatarColor(color)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: AVATAR_COLOR_MAP[color],
                    borderColor: selected ? '#1c1917' : '#e7e5e4',
                  },
                  selected && styles.colorSwatchSelected,
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How your group sees you"
            placeholderTextColor="#a8a29e"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Initials</Text>
          <TextInput
            style={[styles.input, styles.initialsInput]}
            value={initials}
            onChangeText={(t) => setInitials(t.toUpperCase())}
            maxLength={2}
            placeholder="JG"
            placeholderTextColor="#a8a29e"
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving || !hasChanges}
          style={[styles.saveBtn, (saving || !hasChanges) && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your groups</Text>
        <Text style={styles.sectionHint}>Tap a group to make it active for calendar and prayers</Text>

        {groups.map((g) => {
          const active = g.id === group.id;
          return (
            <View key={g.id} style={[styles.groupListRow, active && styles.groupListRowActive]}>
              <Pressable
                style={styles.groupListMain}
                onPress={() => {
                  if (!active) switchGroup(g.id).catch(console.error);
                }}
              >
                <View style={styles.groupIcon}>
                  <Ionicons
                    name={active ? 'people' : 'people-outline'}
                    size={20}
                    color="#57534e"
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.groupMeta}>
                    {g.memberUids.length}{' '}
                    {g.memberUids.length === 1 ? 'member' : 'members'}
                    {active ? ' · Active' : ''}
                  </Text>
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={22} color="#047857" />
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => confirmLeave(g.id, g.name)}
                style={styles.leaveBtn}
                hitSlop={8}
              >
                <Text style={styles.leaveBtnText}>Leave</Text>
              </Pressable>
            </View>
          );
        })}

        <View style={styles.inviteCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteLabel}>Active invite code</Text>
            <Text style={styles.inviteCode}>{group.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share to invite friends to {group.name}</Text>
          </View>
          <Pressable onPress={copyInviteCode} style={styles.copyBtn}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copied ? '#047857' : '#57534e'}
            />
            <Text style={[styles.copyBtnText, copied && styles.copyBtnTextSuccess]}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>
        </View>

        {groupAction === 'idle' && (
          <View style={styles.groupActions}>
            <Pressable
              onPress={() => {
                setGroupError('');
                setGroupAction('join');
              }}
              style={styles.secondaryBtn}
            >
              <Ionicons name="enter-outline" size={18} color="#1c1917" />
              <Text style={styles.secondaryBtnText}>Join another group</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setGroupError('');
                setGroupAction('create');
              }}
              style={styles.secondaryBtn}
            >
              <Ionicons name="add-circle-outline" size={18} color="#1c1917" />
              <Text style={styles.secondaryBtnText}>Create another group</Text>
            </Pressable>
          </View>
        )}

        {groupAction === 'join' && (
          <View style={styles.inlineForm}>
            <Text style={styles.label}>Invite code</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              placeholder="AB12CD"
              placeholderTextColor="#a8a29e"
              editable={!groupBusy}
            />
            {groupError ? <Text style={styles.error}>{groupError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => setGroupAction('idle')}
                style={styles.cancelBtn}
                disabled={groupBusy}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleJoinAnother}
                style={[styles.saveBtn, styles.inlinePrimary, groupBusy && styles.saveBtnDisabled]}
                disabled={groupBusy || !inviteCode.trim()}
              >
                <Text style={styles.saveBtnText}>{groupBusy ? 'Joining…' : 'Join'}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {groupAction === 'create' && (
          <View style={styles.inlineForm}>
            <Text style={styles.label}>Group name</Text>
            <TextInput
              style={styles.input}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="e.g. Wednesday Bible Study"
              placeholderTextColor="#a8a29e"
              editable={!groupBusy}
            />
            {groupError ? <Text style={styles.error}>{groupError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => setGroupAction('idle')}
                style={styles.cancelBtn}
                disabled={groupBusy}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateAnother}
                style={[styles.saveBtn, styles.inlinePrimary, groupBusy && styles.saveBtnDisabled]}
                disabled={groupBusy || !newGroupName.trim()}
              >
                <Text style={styles.saveBtnText}>{groupBusy ? 'Creating…' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Pressable onPress={() => signOut(auth)} style={styles.signOutBtn}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: {
    backgroundColor: '#fff',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1917',
    marginTop: 8,
  },
  heroEmail: {
    fontSize: 14,
    color: '#78716c',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    gap: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#a8a29e',
  },
  sectionHint: {
    fontSize: 14,
    color: '#78716c',
    marginTop: -6,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  colorSwatchSelected: {
    transform: [{ scale: 1.08 }],
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#57534e',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    fontSize: 16,
    color: '#1c1917',
  },
  initialsInput: {
    width: 88,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 2,
  },
  saveBtn: {
    paddingVertical: 14,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  groupListRow: {
    borderWidth: 1,
    borderColor: '#f5f5f4',
    borderRadius: 14,
    backgroundColor: '#fafaf9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  groupListRowActive: {
    borderColor: '#d6d3d1',
    backgroundColor: '#fff',
  },
  groupListMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1917',
  },
  groupMeta: {
    fontSize: 13,
    color: '#78716c',
  },
  leaveBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  leaveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  inviteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafaf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f5f5f4',
    gap: 12,
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a8a29e',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 3,
    color: '#1c1917',
  },
  inviteHint: {
    fontSize: 12,
    color: '#a8a29e',
    marginTop: 4,
  },
  copyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    minWidth: 56,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534e',
  },
  copyBtnTextSuccess: {
    color: '#047857',
  },
  groupActions: { gap: 8 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1917',
  },
  inlineForm: { gap: 10 },
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inlinePrimary: {
    flex: 1,
    marginTop: 0,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#78716c',
  },
  error: { color: '#ef4444', fontSize: 13 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
  },
  signOutText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
});
