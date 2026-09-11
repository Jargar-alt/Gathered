import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import PrayerCard from '@/components/PrayerCard';
import PrayerForm from '@/components/PrayerForm';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { PrayerRequest, UserProfile } from '@shared/types';
import { getReportedContentIds } from '@/lib/moderation';

export default function PrayersScreen() {
  const { profile, group } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [members, setMembers] = useState<Record<string, UserProfile>>({});
  const [showForm, setShowForm] = useState(false);
  const [hiddenContentIds, setHiddenContentIds] = useState<Set<string>>(new Set());
  const [moderationTick, setModerationTick] = useState(0);
  const blocked = new Set(profile?.blockedUids ?? []);
  const refreshModeration = () => setModerationTick((n) => n + 1);

  useEffect(() => {
    if (!group || !profile?.uid || !group.memberUids.includes(profile.uid)) {
      setPrayers([]);
      return;
    }
    const q = query(collection(db, 'prayers'), where('groupId', '==', group.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sorted = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as PrayerRequest))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setPrayers(sorted);
      },
      (error) => {
        console.error('Prayers listener error:', error);
        setPrayers([]);
      }
    );
    return unsubscribe;
  }, [group?.id, group?.memberUids, profile?.uid]);

  useEffect(() => {
    if (!group || !profile?.uid || !group.memberUids.includes(profile.uid)) return;
    const fetchMembers = async () => {
      const memberData: Record<string, UserProfile> = {};
      for (const uid of group.memberUids) {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          memberData[uid] = docSnap.data() as UserProfile;
        }
      }
      setMembers(memberData);
    };
    fetchMembers();
  }, [group?.memberUids, profile?.uid, moderationTick]);

  useEffect(() => {
    if (!profile?.uid) {
      setHiddenContentIds(new Set());
      return;
    }
    getReportedContentIds(profile.uid)
      .then(setHiddenContentIds)
      .catch(() => setHiddenContentIds(new Set()));
  }, [profile?.uid, moderationTick]);

  if (!profile || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#78716c" />
      </View>
    );
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prayers & Praise</Text>
        <Pressable onPress={() => setShowForm(true)} style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ New Entry</Text>
        </Pressable>
      </View>

      {showForm && (
        <PrayerForm
          group={group}
          profile={profile}
          onClose={() => setShowForm(false)}
        />
      )}

      {prayers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No prayer requests yet.</Text>
        </View>
      ) : (
        prayers
          .filter((prayer) => !blocked.has(prayer.uid) && !hiddenContentIds.has(prayer.id))
          .map((prayer) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            member={members[prayer.uid]}
            members={members}
            profile={profile}
            onModerationChange={refreshModeration}
          />
        ))
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1c1917' },
  newBtn: {
    backgroundColor: '#1c1917',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: {
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: { color: '#a8a29e', fontStyle: 'italic' },
});
