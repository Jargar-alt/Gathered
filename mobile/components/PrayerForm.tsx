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

interface PrayerFormProps {
  group: Group;
  profile: UserProfile;
  onClose: () => void;
}

export default function PrayerForm({ group, profile, onClose }: PrayerFormProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'request' | 'praise'>('request');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'prayers'), {
        uid: profile.uid,
        groupId: group.id,
        type,
        content,
        reactions: {},
        notes: [],
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
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
          style={[styles.typeBtn, type === 'request' && styles.typeBtnActive]}
        >
          <Text style={[styles.typeBtnText, type === 'request' && styles.typeBtnTextActive]}>
            Prayer Request
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType('praise')}
          style={[styles.typeBtn, type === 'praise' && styles.typeBtnActive]}
        >
          <Text style={[styles.typeBtnText, type === 'praise' && styles.typeBtnTextActive]}>
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

      <View style={styles.actions}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
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
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#1c1917',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a8a29e',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  textarea: {
    padding: 16,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
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
    backgroundColor: '#1c1917',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#57534e',
    fontWeight: '600',
    fontSize: 15,
  },
  disabled: { opacity: 0.5 },
});
