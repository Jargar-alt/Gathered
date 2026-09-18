import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  reauthenticateWithApple,
  reauthenticateWithGoogle,
  revokeGoogleAccess,
} from '@/lib/socialAuth';

export function hasPasswordProvider(): boolean {
  return Boolean(auth.currentUser?.providerData.some((p) => p.providerId === 'password'));
}

export function hasGoogleProvider(): boolean {
  return Boolean(auth.currentUser?.providerData.some((p) => p.providerId === 'google.com'));
}

export function hasAppleProvider(): boolean {
  return Boolean(auth.currentUser?.providerData.some((p) => p.providerId === 'apple.com'));
}

async function deleteOwnedInGroup(collectionName: string, groupId: string, uid: string) {
  const snap = await getDocs(
    query(
      collection(db, collectionName),
      where('groupId', '==', groupId),
      where('uid', '==', uid)
    )
  );
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    for (const d of docs.slice(i, i + 400)) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
}

async function reauthenticate(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }

  if (hasPasswordProvider()) {
    if (!user.email) {
      throw new Error('You must be signed in to delete your account.');
    }
    if (!password) {
      throw new Error('Enter your password to confirm deletion.');
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return;
  }

  if (hasAppleProvider()) {
    await reauthenticateWithApple();
    return;
  }

  if (hasGoogleProvider()) {
    await reauthenticateWithGoogle();
    return;
  }

  throw new Error('Unable to verify this account. Sign out and sign in again, then retry.');
}

/**
 * Permanently deletes the signed-in account and related data.
 * Email/password accounts require the current password.
 * Apple/Google accounts reauthenticate with their provider.
 */
export async function deleteAccount(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }

  await reauthenticate(password);

  const uid = user.uid;
  const googleAccount = hasGoogleProvider();
  const profileRef = doc(db, 'users', uid);
  const profileDoc = await getDoc(profileRef);
  const data = profileDoc.exists() ? profileDoc.data() : null;
  const groupIds: string[] = data?.groupIds?.length
    ? data.groupIds
    : data?.groupId
      ? [data.groupId]
      : [];

  // Delete owned content while still a group member (rules require membership to list)
  for (const groupId of groupIds) {
    await deleteOwnedInGroup('readings', groupId, uid);
    await deleteOwnedInGroup('prayers', groupId, uid);
  }

  for (const groupId of groupIds) {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberUids: arrayRemove(uid),
      });
    } catch {
      // Group may already be gone
    }
  }

  if (profileDoc.exists()) {
    await deleteDoc(profileRef);
  }

  await deleteUser(user);
  if (googleAccount) {
    await revokeGoogleAccess();
  }
}
