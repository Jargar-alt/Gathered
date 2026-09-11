import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { registerForPushNotifications } from '@/lib/notifications';
import { UserProfile, Group } from '@shared/types';
import { AVATAR_COLORS } from '@shared/constants';

function normalizeMembership(profile: UserProfile): UserProfile {
  const ids = profile.groupIds?.length
    ? profile.groupIds
    : profile.groupId
      ? [profile.groupId]
      : [];
  const active =
    profile.groupId && ids.includes(profile.groupId)
      ? profile.groupId
      : ids[0];
  return {
    ...profile,
    groupIds: ids,
    groupId: active,
  };
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  group: Group | null;
  groups: Group[];
  loading: boolean;
  switchGroup: (groupId: string) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  group: null,
  groups: [],
  loading: true,
  switchGroup: async () => {},
  joinGroup: async () => {},
  createGroup: async () => {},
  leaveGroup: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            let existing = normalizeMembership(docSnap.data() as UserProfile);
            const needsMigrate =
              !docSnap.data().groupIds?.length && Boolean(docSnap.data().groupId);
            if (u.displayName && existing.displayName !== u.displayName) {
              existing = { ...existing, displayName: u.displayName };
            }
            if (needsMigrate || (u.displayName && docSnap.data().displayName !== u.displayName)) {
              await updateDoc(docRef, {
                ...(needsMigrate
                  ? { groupIds: existing.groupIds, groupId: existing.groupId }
                  : {}),
                ...(u.displayName && docSnap.data().displayName !== u.displayName
                  ? { displayName: u.displayName }
                  : {}),
                ...(!docSnap.data().acceptedTermsAt
                  ? { acceptedTermsAt: new Date().toISOString() }
                  : {}),
              });
            } else if (!docSnap.data().acceptedTermsAt) {
              await updateDoc(docRef, { acceptedTermsAt: new Date().toISOString() });
            }
            setProfile(existing);
          } else {
            const initials = u.displayName
              ? u.displayName.split(' ').map((n) => n[0]).join('').toUpperCase()
              : u.email?.[0].toUpperCase() || 'U';
            const newProfile: UserProfile = {
              uid: u.uid,
              displayName: u.displayName || u.email?.split('@')[0] || 'User',
              email: u.email || '',
              avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
              initials: initials.slice(0, 2),
              groupIds: [],
              blockedUids: [],
              acceptedTermsAt: new Date().toISOString(),
            };
            await setDoc(docRef, newProfile, { merge: true });
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      } else {
        setProfile(null);
        setGroup(null);
        setGroups([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Live profile updates (after join/switch/leave from this or another device)
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(normalizeMembership(snap.data() as UserProfile));
        }
      },
      (error) => {
        console.error('Profile listener error:', error);
      }
    );
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!profile?.groupId || !profile.uid) {
      setGroup(null);
      return;
    }

    const activeGroupId = profile.groupId;
    const uid = profile.uid;
    const unsubscribe = onSnapshot(
      doc(db, 'groups', activeGroupId),
      (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : null;
        const memberUids: string[] = data?.memberUids ?? [];
        // Groups are readable by any authenticated user; only expose as
        // active group when the user is actually in memberUids (required by
        // readings/prayers rules). Otherwise heal stale profile fields.
        if (!data || !memberUids.includes(uid)) {
          setGroup(null);
          const remaining = (profile.groupIds ?? []).filter((id) => id !== activeGroupId);
          const userUpdate: Record<string, unknown> = { groupIds: remaining };
          if (remaining[0]) {
            userUpdate.groupId = remaining[0];
          } else {
            userUpdate.groupId = deleteField();
          }
          updateDoc(doc(db, 'users', uid), userUpdate).catch((err) => {
            console.error('Failed to heal stale group membership:', err);
          });
          return;
        }
        setGroup({ id: docSnap.id, ...data } as Group);
      },
      (error) => {
        console.error('Active group listener error:', error);
        setGroup(null);
      }
    );
    return unsubscribe;
  }, [profile?.groupId, profile?.uid, profile?.groupIds?.join(',')]);

  useEffect(() => {
    const ids = profile?.groupIds ?? [];
    const uid = profile?.uid;
    if (ids.length === 0 || !uid) {
      setGroups([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const loaded: Group[] = [];
      const validIds: string[] = [];
      for (const id of ids) {
        const snap = await getDoc(doc(db, 'groups', id));
        if (!snap.exists()) continue;
        const data = snap.data();
        if ((data.memberUids ?? []).includes(uid)) {
          loaded.push({ id: snap.id, ...data } as Group);
          validIds.push(id);
        }
      }
      if (cancelled) return;
      setGroups(loaded);

      // Drop groupIds that no longer include this user (or missing groups)
      if (validIds.length !== ids.length) {
        const nextActive =
          profile.groupId && validIds.includes(profile.groupId)
            ? profile.groupId
            : validIds[0] ?? null;
        const userUpdate: Record<string, unknown> = { groupIds: validIds };
        if (nextActive) {
          userUpdate.groupId = nextActive;
        } else {
          userUpdate.groupId = deleteField();
        }
        await updateDoc(doc(db, 'users', uid), userUpdate);
      }
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [profile?.groupIds?.join(','), profile?.uid]);

  useEffect(() => {
    if (profile?.uid) {
      registerForPushNotifications(profile.uid).catch(console.error);
    }
  }, [profile?.uid]);

  const switchGroup = useCallback(
    async (groupId: string) => {
      if (!profile) return;
      if (!(profile.groupIds ?? []).includes(groupId)) {
        throw new Error('You are not a member of that group.');
      }
      await updateDoc(doc(db, 'users', profile.uid), { groupId });
    },
    [profile]
  );

  const joinGroup = useCallback(
    async (inviteCode: string) => {
      if (!profile) return;
      const q = query(
        collection(db, 'groups'),
        where('inviteCode', '==', inviteCode.trim().toUpperCase()),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Invalid invite code');
      }
      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();
      if (groupData.memberUids.includes(profile.uid)) {
        await updateDoc(doc(db, 'users', profile.uid), {
          groupId: groupDoc.id,
          groupIds: arrayUnion(groupDoc.id),
        });
        return;
      }
      if (groupData.memberUids.length >= 5) {
        throw new Error('Group is full');
      }
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        memberUids: arrayUnion(profile.uid),
      });
      await updateDoc(doc(db, 'users', profile.uid), {
        groupId: groupDoc.id,
        groupIds: arrayUnion(groupDoc.id),
      });
    },
    [profile]
  );

  const createGroup = useCallback(
    async (name: string) => {
      if (!profile || !name.trim()) return;
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: name.trim(),
        inviteCode: generateInviteCode(),
        memberUids: [profile.uid],
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', profile.uid), {
        groupId: groupRef.id,
        groupIds: arrayUnion(groupRef.id),
      });
    },
    [profile]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!profile) return;
      const remaining = (profile.groupIds ?? []).filter((id) => id !== groupId);
      const nextActive =
        profile.groupId === groupId ? remaining[0] ?? null : profile.groupId ?? null;

      // Update the user profile first so calendar/prayers unsubscribe from this
      // groupId before memberUids loses the uid (avoids permission-denied).
      const userUpdate: Record<string, unknown> = {
        groupIds: remaining,
      };
      if (nextActive) {
        userUpdate.groupId = nextActive;
      } else {
        userUpdate.groupId = deleteField();
      }
      if (profile.groupId === groupId) {
        setGroup(null);
      }
      await updateDoc(doc(db, 'users', profile.uid), userUpdate);

      await updateDoc(doc(db, 'groups', groupId), {
        memberUids: arrayRemove(profile.uid),
      });
    },
    [profile]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        group,
        groups,
        loading,
        switchGroup,
        joinGroup,
        createGroup,
        leaveGroup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
