import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Group, UserProfile } from '@shared/types';
import { colors } from '@shared/colors';

import { assertAllowedContent } from '@/lib/contentFilter';

interface PrayerFormProps {
  group: Group;
  profile: UserProfile;
  onClose: () => void;
}

export default function PrayerForm({ group, profile, onClose }: PrayerFormProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'request' | 'praise'>('request');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      assertAllowedContent(content);
      await addDoc(collection(db, 'prayers'), {
        uid: profile.uid,
        groupId: group.id,
        type,
        content: content.trim(),
        reactions: {},
        notes: [],
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prayer');
      console.error('Failed to create prayer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.typeToggle}>
        <Pressable
          onPress={() => setType('request')}
          style={[styles.typeBtn, type === 'request' && styles.typeBtnRequest]}
        >
          <Text style={[styles.typeBtnText, type === 'request' && styles.typeBtnTextOnAccent]}>
            Prayer Request
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType('praise')}
          style={[styles.typeBtn, type === 'praise' && styles.typeBtnPraise]}
        >
          <Text style={[styles.typeBtnText, type === 'praise' && styles.typeBtnTextOnMist]}>
            Praise Report
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder={
          type === 'request'
            ? 'How can we pray for you?'
            : 'What are you praising God for?'
        }
        value={content}
        onChangeText={setContent}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.submitText}>Post</Text>
          )}
        </Pressable>
        <Pressable onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  typeBtnRequest: {
    backgroundColor: colors.pray,
  },
  typeBtnPraise: {
    backgroundColor: colors.rejoice,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSubtle,
  },
  typeBtnTextOnAccent: {
    color: colors.text,
  },
  typeBtnTextOnMist: {
    color: colors.text,
  },
  textarea: {
    padding: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.pray,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13 },
  disabled: { opacity: 0.5 },
});
