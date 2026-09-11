import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ReportableContentType = 'prayer' | 'reading' | 'note';

export async function reportContent(input: {
  reporterUid: string;
  targetUid: string;
  groupId: string;
  contentType: ReportableContentType;
  contentId: string;
  reason: string;
}): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    ...input,
    reason: input.reason.slice(0, 500),
    createdAt: serverTimestamp(),
  });
}

export async function blockUser(blockerUid: string, targetUid: string): Promise<void> {
  if (blockerUid === targetUid) {
    throw new Error('You cannot block yourself.');
  }
  await updateDoc(doc(db, 'users', blockerUid), {
    blockedUids: arrayUnion(targetUid),
  });
}

export async function unblockUser(blockerUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', blockerUid), {
    blockedUids: arrayRemove(targetUid),
  });
}

/** Content IDs this user has already flagged (so we can hide them). */
export async function getReportedContentIds(reporterUid: string): Promise<Set<string>> {
  const snap = await getDocs(
    query(collection(db, 'reports'), where('reporterUid', '==', reporterUid))
  );
  return new Set(snap.docs.map((d) => String(d.data().contentId)));
}
