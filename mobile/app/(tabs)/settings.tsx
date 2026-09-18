import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { deleteAccount, hasAppleProvider, hasGoogleProvider, hasPasswordProvider } from '@/lib/deleteAccount';
import { getAuthErrorMessage, isAuthCancelled } from '@/lib/authErrors';
import { signOutGoogle } from '@/lib/socialAuth';
import { unblockUser } from '@/lib/moderation';
import { AVATAR_COLORS, AVATAR_COLOR_MAP } from '@shared/constants';
import { colors } from '@shared/colors';
import { UserProfile } from '@shared/types';

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
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [blockedProfiles, setBlockedProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setAvatarColor(profile.avatarColor);
    setInitials(profile.initials);
  }, [profile]);

  useEffect(() => {
    const ids = profile?.blockedUids ?? [];
    if (!ids.length) {
      setBlockedProfiles({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, UserProfile> = {};
      for (const uid of ids) {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) next[uid] = snap.data() as UserProfile;
      }
      if (!cancelled) setBlockedProfiles(next);
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [profile?.blockedUids?.join(',')]);

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.textMuted} />
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
    if (!group) return;
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account permanently?',
      'This removes your profile, your readings and prayers, and signs you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setDeleteError('');
            setDeletePassword('');
            setShowDelete(true);
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteAccount(hasPasswordProvider() ? deletePassword : undefined);
    } catch (err) {
      if (isAuthCancelled(err)) {
        setDeleting(false);
        return;
      }
      setDeleteError(getAuthErrorMessage(err));
      setDeleting(false);
    }
  };

  const previewProfile = { ...profile, displayName, avatarColor, initials };

  return (
    <KeyboardScreen contentContainerStyle={styles.content} style={styles.container}>
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
                    borderColor: selected ? colors.text : colors.border,
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
            placeholderTextColor={colors.textSubtle}
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
            placeholderTextColor={colors.textSubtle}
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
        {group ? (
          <Text style={styles.sectionHint}>Tap a group to make it active for calendar and prayers</Text>
        ) : (
          <Text style={styles.sectionHint}>
            Join or create a group to use calendar and prayers.
          </Text>
        )}

        {groups.map((g) => {
          const active = Boolean(group && g.id === group.id);
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
                    color={colors.textSecondary}
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
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
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

        {group ? (
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
                color={copied ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextSuccess]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {groupAction === 'idle' && (
          <View style={styles.groupActions}>
            <Pressable
              onPress={() => {
                setGroupError('');
                setGroupAction('join');
              }}
              style={styles.secondaryBtn}
            >
              <Ionicons name="enter-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryBtnText}>
                {group ? 'Join another group' : 'Join a group'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setGroupError('');
                setGroupAction('create');
              }}
              style={styles.secondaryBtn}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryBtnText}>
                {group ? 'Create another group' : 'Create a group'}
              </Text>
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
              placeholderTextColor={colors.textSubtle}
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
              placeholderTextColor={colors.textSubtle}
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

      {(profile.blockedUids?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Blocked users</Text>
          <Text style={styles.sectionHint}>You won’t see their readings or prayers.</Text>
          {profile.blockedUids!.map((uid) => (
            <View key={uid} style={styles.blockedRow}>
              <Text style={styles.blockedName} numberOfLines={1}>
                {blockedProfiles[uid]?.displayName || 'Blocked member'}
              </Text>
              <Pressable
                onPress={() => {
                  unblockUser(profile.uid, uid).catch((err) => {
                    Alert.alert('Error', err instanceof Error ? err.message : 'Could not unblock');
                  });
                }}
              >
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={async () => {
          await signOutGoogle();
          await signOut(auth);
        }}
        style={styles.signOutBtn}
        disabled={deleting}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <View style={styles.dangerSection}>
        <Text style={styles.sectionLabel}>Account</Text>
        {!showDelete ? (
          <Pressable onPress={handleDeleteAccount} style={styles.deleteBtn} disabled={deleting}>
            <Text style={styles.deleteBtnText}>Delete account</Text>
          </Pressable>
        ) : (
          <View style={styles.deleteForm}>
            {hasPasswordProvider() ? (
              <>
                <Text style={styles.sectionHint}>
                  Enter your password to permanently delete your Gathered account.
                </Text>
                <TextInput
                  style={styles.input}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Password"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  editable={!deleting}
                />
              </>
            ) : (
              <Text style={styles.sectionHint}>
                {hasAppleProvider()
                  ? 'Sign in with Apple again to confirm and permanently delete your Gathered account.'
                  : hasGoogleProvider()
                    ? 'Sign in with Google again to confirm and permanently delete your Gathered account.'
                    : 'Confirm to permanently delete your Gathered account.'}
              </Text>
            )}
            {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => {
                  setShowDelete(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                style={styles.cancelBtn}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteAccount}
                style={[
                  styles.deleteConfirmBtn,
                  ((hasPasswordProvider() && !deletePassword) || deleting) && styles.saveBtnDisabled,
                ]}
                disabled={(hasPasswordProvider() && !deletePassword) || deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {hasPasswordProvider()
                      ? 'Delete forever'
                      : hasAppleProvider()
                        ? 'Continue with Apple'
                        : hasGoogleProvider()
                          ? 'Continue with Google'
                          : 'Delete forever'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: {
    backgroundColor: colors.surface,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  heroEmail: {
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.textSubtle,
  },
  sectionHint: {
    fontSize: 14,
    color: colors.textMuted,
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
    color: colors.textSecondary,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
  },
  initialsInput: {
    width: 88,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 2,
  },
  saveBtn: {
    paddingVertical: 14,
    backgroundColor: colors.text,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 15 },
  groupListRow: {
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  groupListRowActive: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
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
    color: colors.text,
  },
  groupMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  leaveBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  leaveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  inviteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    gap: 12,
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSubtle,
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 3,
    color: colors.text,
  },
  inviteHint: {
    fontSize: 12,
    color: colors.textSubtle,
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
    color: colors.textSecondary,
  },
  copyBtnTextSuccess: {
    color: colors.success,
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
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.textMuted,
  },
  error: { color: colors.danger, fontSize: 13 },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  blockedName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, marginRight: 12 },
  unblockText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    borderRadius: 14,
  },
  signOutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
  dangerSection: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    gap: 12,
  },
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },
  deleteBtnText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
  deleteForm: { gap: 10 },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.danger,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
