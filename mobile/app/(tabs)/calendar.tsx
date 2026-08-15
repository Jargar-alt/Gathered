import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { parseLocalDate } from '@/lib/dates';
import { ReadingEntry, UserProfile } from '@shared/types';
import { REACTIONS, AVATAR_COLOR_MAP } from '@shared/constants';

export default function CalendarScreen() {
  const { profile, group } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [members, setMembers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!group || !profile?.uid || !group.memberUids.includes(profile.uid)) {
      setEntries([]);
      return;
    }
    const q = query(collection(db, 'readings'), where('groupId', '==', group.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEntries(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReadingEntry)));
      },
      (error) => {
        console.error('Readings listener error:', error);
        setEntries([]);
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
        if (docSnap.exists()) memberData[uid] = docSnap.data() as UserProfile;
      }
      setMembers(memberData);
    };
    fetchMembers();
  }, [group?.memberUids, profile?.uid]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getEntriesForDay = (day: Date) =>
    entries.filter((e) => isSameDay(parseLocalDate(e.date), day));

  if (!profile || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#78716c" />
      </View>
    );
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.monthHeader}>
        <Text style={styles.title}>{format(currentDate, 'MMMM yyyy')}</Text>
        <View style={styles.nav}>
          <Pressable onPress={() => setCurrentDate(subMonths(currentDate, 1))} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Pressable onPress={() => setCurrentDate(addMonths(currentDate, 1))} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const dayEntries = getEntriesForDay(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());

          return (
            <Pressable
              key={format(day, 'yyyy-MM-dd')}
              onPress={() => { setSelectedDay(day); setShowEntryForm(false); }}
              style={[
                styles.dayCell,
                !isSameMonth(day, currentDate) && styles.dayCellMuted,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
              ]}
            >
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                {format(day, 'd')}
              </Text>
              <View style={styles.dots}>
                {dayEntries.map((e) => (
                  <View
                    key={e.id}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: members[e.uid]?.avatarColor
                          ? AVATAR_COLOR_MAP[members[e.uid].avatarColor] ?? '#d6d3d1'
                          : '#d6d3d1',
                      },
                    ]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedDay && (
        <View style={styles.dayPanel}>
          <View style={styles.dayPanelHeader}>
            <Text style={styles.dayPanelTitle}>
              {format(selectedDay, 'EEEE, MMMM do')}
            </Text>
            {!getEntriesForDay(selectedDay).find((e) => e.uid === profile.uid) && (
              <Pressable onPress={() => setShowEntryForm(true)}>
                <Text style={styles.recordBtn}>+ Record Reading</Text>
              </Pressable>
            )}
          </View>

          {showEntryForm ? (
            <ReadingForm
              date={selectedDay}
              group={group}
              profile={profile}
              onClose={() => setShowEntryForm(false)}
            />
          ) : getEntriesForDay(selectedDay).length === 0 ? (
            <Text style={styles.noEntries}>No entries for this day.</Text>
          ) : (
            getEntriesForDay(selectedDay).map((entry) => (
              <ReadingCard
                key={entry.id}
                entry={entry}
                member={members[entry.uid]}
                profile={profile}
              />
            ))
          )}
        </View>
      )}
    </KeyboardScreen>
  );
}

function ReadingForm({
  date,
  group,
  profile,
  onClose,
}: {
  date: Date;
  group: { id: string };
  profile: UserProfile;
  onClose: () => void;
}) {
  const [scripture, setScripture] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!scripture.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'readings'), {
        uid: profile.uid,
        groupId: group.id,
        date: format(date, 'yyyy-MM-dd'),
        scripture,
        thoughts,
        reactions: {},
        createdAt: serverTimestamp(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formLabel}>Scripture Reading</Text>
      <TextInput
        style={styles.formInput}
        placeholder="e.g. John 1:1-14"
        value={scripture}
        onChangeText={setScripture}
      />
      <Text style={styles.formLabel}>Thoughts / Summary</Text>
      <TextInput
        style={[styles.formInput, styles.formTextarea]}
        placeholder="What did you learn today?"
        value={thoughts}
        onChangeText={setThoughts}
        multiline
      />
      <View style={styles.formActions}>
        <Pressable onPress={handleSubmit} disabled={submitting} style={styles.formSubmit}>
          <Text style={styles.formSubmitText}>Save Entry</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.formCancel}>
          <Text style={styles.formCancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReadingCard({
  entry,
  member,
  profile,
}: {
  entry: ReadingEntry;
  member?: UserProfile;
  profile: UserProfile;
}) {
  const handleReaction = async (emoji: string) => {
    const reactions = { ...entry.reactions };
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(profile.uid)) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== profile.uid);
    } else {
      reactions[emoji].push(profile.uid);
    }
    await updateDoc(doc(db, 'readings', entry.id), { reactions });
  };

  return (
    <View style={styles.readingCard}>
      <View style={styles.readingAuthor}>
        <Avatar profile={member} size="sm" />
        <Text style={styles.readingAuthorName}>{member?.displayName}</Text>
      </View>
      <Text style={styles.scripture}>{entry.scripture}</Text>
      <Text style={styles.thoughts}>{entry.thoughts}</Text>
      <View style={styles.reactionsRow}>
        {REACTIONS.map((emoji: string) => {
          const count = entry.reactions[emoji]?.length || 0;
          const hasReacted = entry.reactions[emoji]?.includes(profile.uid);
          return (
            <Pressable
              key={emoji}
              onPress={() => handleReaction(emoji)}
              style={[styles.reactionBtn, hasReacted && styles.reactionActive]}
            >
              <Text>{emoji}</Text>
              {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1c1917' },
  nav: { flexDirection: 'row', gap: 8 },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 20, color: '#57534e' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#a8a29e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingVertical: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f5f5f4',
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dayCellMuted: { opacity: 0.2 },
  dayCellSelected: { backgroundColor: '#1c1917', borderColor: '#1c1917' },
  dayCellToday: { borderColor: '#a8a29e' },
  dayNum: { fontSize: 12, fontWeight: '500', color: '#44403c' },
  dayNumSelected: { color: '#fff' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dayPanel: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  dayPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayPanelTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917' },
  recordBtn: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
  noEntries: { color: '#a8a29e', fontStyle: 'italic', fontSize: 14 },
  form: { gap: 12 },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a8a29e',
  },
  formInput: {
    padding: 12,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    fontSize: 14,
  },
  formTextarea: { minHeight: 80, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 8 },
  formSubmit: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
  },
  formSubmitText: { color: '#fff', fontWeight: '600' },
  formCancel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    justifyContent: 'center',
  },
  formCancelText: { color: '#57534e', fontWeight: '600' },
  readingCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
    paddingBottom: 16,
    marginBottom: 16,
  },
  readingAuthor: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  readingAuthorName: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  scripture: { fontSize: 14, fontWeight: '600', color: '#44403c', marginBottom: 4 },
  thoughts: { fontSize: 14, color: '#78716c', lineHeight: 20, marginBottom: 12 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#fafaf9',
    gap: 4,
  },
  reactionActive: { backgroundColor: '#e7e5e4' },
  reactionCount: { fontSize: 12, fontWeight: '700' },
});
