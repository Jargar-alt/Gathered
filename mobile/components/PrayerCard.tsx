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
import { format } from 'date-fns';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Avatar from '@/components/Avatar';
import { PrayerNote, PrayerRequest, UserProfile } from '@shared/types';
import { REACTIONS } from '@shared/constants';
import { assertAllowedContent } from '@/lib/contentFilter';
import { openModerationMenu } from '@/lib/moderationMenu';

interface PrayerCardProps {
  prayer: PrayerRequest;
  member?: UserProfile;
  members: Record<string, UserProfile>;
  profile: UserProfile;
  onModerationChange?: () => void;
}

function formatNoteDate(createdAt: string) {
  try {
    return format(new Date(createdAt), 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

function getNoteAuthor(note: PrayerNote, members: Record<string, UserProfile>) {
  const member = members[note.uid];
  return {
    displayName: note.authorName ?? member?.displayName ?? 'Unknown',
    initials: note.authorInitials ?? member?.initials ?? '?',
    avatarColor: member?.avatarColor,
  };
}

function noteKey(note: PrayerNote, index: number) {
  return `${note.uid}-${note.createdAt}-${index}`;
}

export default function PrayerCard({ prayer, member, members, profile, onModerationChange }: PrayerCardProps) {
  const notes = prayer.notes ?? [];
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    // Keep edit draft in sync if the live note list changes under us
    if (!editingKey) return;
    const stillThere = notes.some((note, index) => noteKey(note, index) === editingKey);
    if (!stillThere) {
      setEditingKey(null);
      setShowNoteForm(false);
      setNoteText('');
    }
  }, [notes, editingKey]);

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

  const openNewNote = () => {
    setNoteError('');
    if (editingKey) {
      setEditingKey(null);
      setNoteText('');
      setShowNoteForm(true);
      return;
    }
    if (showNoteForm) {
      cancelNoteForm();
      return;
    }
    setNoteText('');
    setShowNoteForm(true);
  };

  const startEditNote = (note: PrayerNote, index: number) => {
    setEditingKey(noteKey(note, index));
    setNoteText(note.text);
    setNoteError('');
    setShowNoteForm(true);
  };

  const cancelNoteForm = () => {
    setShowNoteForm(false);
    setEditingKey(null);
    setNoteText('');
    setNoteError('');
  };

  const handleSaveNote = async () => {
    const text = noteText.trim();
    if (!text || savingNote) return;
    setNoteError('');
    setSavingNote(true);
    try {
      assertAllowedContent(text);

      if (editingKey) {
        const nextNotes = notes.map((note, index) =>
          noteKey(note, index) === editingKey
            ? {
                ...note,
                text,
                authorName: profile.displayName,
                authorInitials: profile.initials,
              }
            : note
        );
        await updateDoc(doc(db, 'prayers', prayer.id), { notes: nextNotes });
      } else {
        await updateDoc(doc(db, 'prayers', prayer.id), {
          notes: arrayUnion({
            uid: profile.uid,
            text,
            createdAt: new Date().toISOString(),
            authorName: profile.displayName,
            authorInitials: profile.initials,
          }),
        });
      }

      cancelNoteForm();
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Could not save note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = (note: PrayerNote, index: number) => {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const key = noteKey(note, index);
            const nextNotes = notes.filter((_, i) => noteKey(notes[i], i) !== key);
            await updateDoc(doc(db, 'prayers', prayer.id), { notes: nextNotes });
            if (editingKey === key) cancelNoteForm();
          } catch (err) {
            setNoteError(err instanceof Error ? err.message : 'Could not delete note.');
          }
        },
      },
    ]);
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
        {prayer.uid !== profile.uid ? (
          <Pressable
            onPress={() =>
              openModerationMenu({
                contentType: 'prayer',
                contentId: prayer.id,
                targetUid: prayer.uid,
                groupId: prayer.groupId,
                reporterUid: profile.uid,
                targetName: member?.displayName,
                onBlocked: onModerationChange,
                onReported: onModerationChange,
              })
            }
            hitSlop={8}
            style={styles.moreBtn}
          >
            <Text style={styles.moreBtnText}>···</Text>
          </Pressable>
        ) : null}
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
        <Pressable onPress={openNewNote} style={styles.noteBtn}>
          <Text style={styles.noteBtnText}>{showNoteForm && !editingKey ? 'Cancel' : 'Note'}</Text>
        </Pressable>
      </View>

      {showNoteForm && (
        <View style={styles.noteForm}>
          <TextInput
            style={styles.noteInput}
            placeholder={editingKey ? 'Edit your note...' : 'Write a short note...'}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            textAlignVertical="top"
            autoFocus
            editable={!savingNote}
            blurOnSubmit={false}
          />
          <View style={styles.noteFormActions}>
            {editingKey ? (
              <Pressable onPress={cancelNoteForm} style={styles.noteCancelBtn} disabled={savingNote}>
                <Text style={styles.noteCancelText}>Cancel</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleSaveNote}
              style={[styles.sendBtn, (!noteText.trim() || savingNote) && styles.sendBtnDisabled]}
              disabled={!noteText.trim() || savingNote}
            >
              {savingNote ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>{editingKey ? 'Save' : 'Send'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
      {noteError ? <Text style={styles.noteError}>{noteError}</Text> : null}

      {notes.length > 0 && (
        <View style={styles.notesSection}>
          <Text style={styles.notesHeading}>
            {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
          </Text>
          {notes.map((note, index) => {
            const author = getNoteAuthor(note, members);
            const isOwnNote = note.uid === profile.uid;
            const key = noteKey(note, index);
            return (
              <View
                key={key}
                style={[styles.noteItem, isOwnNote && styles.noteItemOwn]}
              >
                <Avatar
                  profile={{
                    uid: note.uid,
                    displayName: author.displayName,
                    email: '',
                    avatarColor: author.avatarColor ?? 'bg-stone-200',
                    initials: author.initials,
                  }}
                  size="sm"
                />
                <View style={styles.noteContent}>
                  <View style={styles.noteMeta}>
                    <Text style={styles.noteAuthor}>{author.displayName}</Text>
                    {isOwnNote && <Text style={styles.noteYouBadge}>You</Text>}
                    <Text style={styles.noteDot}>·</Text>
                    <Text style={styles.noteTime}>{formatNoteDate(note.createdAt)}</Text>
                  </View>
                  <Text style={styles.noteText}>{note.text}</Text>
                  {isOwnNote ? (
                    <View style={styles.noteActions}>
                      <Pressable
                        onPress={() => startEditNote(note, index)}
                        hitSlop={8}
                        disabled={savingNote}
                      >
                        <Text style={styles.noteActionText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteNote(note, index)}
                        hitSlop={8}
                        disabled={savingNote}
                      >
                        <Text style={[styles.noteActionText, styles.noteDeleteText]}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : null}
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
  moreBtn: { paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
  moreBtnText: { fontSize: 18, color: '#a8a29e', fontWeight: '700' },
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
    gap: 8,
  },
  noteInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 8,
    fontSize: 14,
    minHeight: 72,
    color: '#1c1917',
  },
  noteFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  noteCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f4',
    justifyContent: 'center',
  },
  noteCancelText: { color: '#57534e', fontSize: 14, fontWeight: '600' },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1c1917',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 64,
    alignItems: 'center',
    minHeight: 36,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  noteError: { color: '#ef4444', fontSize: 13 },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingTop: 12,
    gap: 10,
  },
  notesHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a8a29e',
  },
  noteItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteItemOwn: {
    opacity: 1,
  },
  noteContent: {
    flex: 1,
    backgroundColor: '#fafaf9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1917',
  },
  noteYouBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#57534e',
    backgroundColor: '#e7e5e4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  noteDot: {
    fontSize: 12,
    color: '#d6d3d1',
  },
  noteTime: {
    fontSize: 11,
    color: '#a8a29e',
  },
  noteText: {
    fontSize: 14,
    color: '#44403c',
    lineHeight: 20,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  noteActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534e',
  },
  noteDeleteText: {
    color: '#dc2626',
  },
});
