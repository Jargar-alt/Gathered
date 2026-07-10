import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Avatar from '@/components/Avatar';
import { PrayerRequest, UserProfile } from '@shared/types';
import { REACTIONS } from '@shared/constants';

interface PrayerCardProps {
  prayer: PrayerRequest;
  member?: UserProfile;
  members: Record<string, UserProfile>;
  profile: UserProfile;
}

function formatNoteDate(createdAt: string) {
  try {
    return format(new Date(createdAt), 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

export default function PrayerCard({ prayer, member, members, profile }: PrayerCardProps) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleReaction = async (emoji: string) => {
    const reactions = { ...prayer.reactions };
    if (!reactions[emoji]) reactions[emoji] = [];

    if (reactions[emoji].includes(profile.uid)) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== profile.uid);
    } else {
      reactions[emoji].push(profile.uid);
    }

    await updateDoc(doc(db, 'prayers', prayer.id), { reactions });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    await updateDoc(doc(db, 'prayers', prayer.id), {
      notes: arrayUnion({
        uid: profile.uid,
        text: noteText,
        createdAt: new Date().toISOString(),
      }),
    });
    setNoteText('');
    setShowNoteForm(false);
  };

  const createdAtLabel = prayer.createdAt
    ? format(prayer.createdAt.toDate(), 'MMM d, h:mm a')
    : 'Just now';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Avatar profile={member} size="md" />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{member?.displayName ?? 'Unknown'}</Text>
            <Text style={styles.timestamp}>{createdAtLabel}</Text>
          </View>
        </View>
        <View
          style={[
            styles.typeBadge,
            prayer.type === 'request' ? styles.requestBadge : styles.praiseBadge,
          ]}
        >
          <Text
            style={[
              styles.typeText,
              prayer.type === 'request' ? styles.requestText : styles.praiseText,
            ]}
          >
            {prayer.type}
          </Text>
        </View>
      </View>

      <Text style={styles.content}>{prayer.content}</Text>

      <View style={styles.reactionsRow}>
        {REACTIONS.map((emoji) => {
          const count = prayer.reactions[emoji]?.length || 0;
          const hasReacted = prayer.reactions[emoji]?.includes(profile.uid);
          return (
            <Pressable
              key={emoji}
              onPress={() => handleReaction(emoji)}
              style={[styles.reactionBtn, hasReacted && styles.reactionActive]}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setShowNoteForm(!showNoteForm)}
          style={styles.noteBtn}
        >
          <Text style={styles.noteBtnText}>Note</Text>
        </Pressable>
      </View>

      {showNoteForm && (
        <View style={styles.noteForm}>
          <TextInput
            style={styles.noteInput}
            placeholder="Write a short note..."
            value={noteText}
            onChangeText={setNoteText}
            autoFocus
          />
          <Pressable onPress={handleAddNote} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Send</Text>
          </Pressable>
        </View>
      )}

      {prayer.notes.length > 0 && (
        <View style={styles.notesSection}>
          {prayer.notes.map((note) => {
            const noteAuthor = members[note.uid];
            return (
              <View key={`${note.uid}-${note.createdAt}`} style={styles.noteItem}>
                <Avatar profile={noteAuthor} size="sm" />
                <View style={styles.noteContent}>
                  <Text style={styles.noteAuthor}>
                    {noteAuthor?.displayName ?? 'Unknown'}
                  </Text>
                  <Text style={styles.noteTime}>{formatNoteDate(note.createdAt)}</Text>
                  <Text style={styles.noteText}>{note.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    marginBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  timestamp: {
    fontSize: 10,
    color: '#a8a29e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requestBadge: { backgroundColor: '#fffbeb' },
  praiseBadge: { backgroundColor: '#ecfdf5' },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  requestText: { color: '#b45309' },
  praiseText: { color: '#047857' },
  content: {
    fontSize: 15,
    color: '#44403c',
    lineHeight: 22,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#fafaf9',
    gap: 4,
  },
  reactionActive: {
    backgroundColor: '#e7e5e4',
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, fontWeight: '700', color: '#1c1917' },
  noteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#fafaf9',
  },
  noteBtnText: { fontSize: 12, color: '#78716c' },
  noteForm: {
    flexDirection: 'row',
    gap: 8,
  },
  noteInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 8,
    fontSize: 14,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1c1917',
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#fafaf9',
    paddingTop: 12,
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    gap: 8,
  },
  noteContent: {
    flex: 1,
    backgroundColor: '#fafaf9',
    padding: 12,
    borderRadius: 12,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1917',
  },
  noteTime: {
    fontSize: 10,
    color: '#a8a29e',
    marginTop: 2,
  },
  noteText: {
    fontSize: 12,
    color: '#57534e',
    lineHeight: 18,
    marginTop: 4,
  },
});
