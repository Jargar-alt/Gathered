import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { registerForPushNotifications } from '@/lib/notifications';
import { UserProfile, Group } from '@shared/types';
import { AVATAR_COLORS } from '@shared/constants';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  group: Group | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  group: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
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
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      } else {
        setProfile(null);
        setGroup(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (profile?.groupId) {
      const unsubscribe = onSnapshot(doc(db, 'groups', profile.groupId), (docSnap) => {
        if (docSnap.exists()) {
          setGroup({ id: docSnap.id, ...docSnap.data() } as Group);
        } else {
          setGroup(null);
        }
      });
      return unsubscribe;
    } else {
      setGroup(null);
    }
  }, [profile?.groupId]);

  useEffect(() => {
    if (profile?.uid) {
      registerForPushNotifications(profile.uid).catch(console.error);
    }
  }, [profile?.uid]);

  return (
    <AuthContext.Provider value={{ user, profile, group, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
