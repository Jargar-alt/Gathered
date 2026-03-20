/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  getDocs,
  limit,
  getDocFromCache,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Plus, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ThumbsUp, 
  HandMetal, 
  Hand,
  User as UserIcon,
  Copy,
  Check
} from 'lucide-react';
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
  subMonths 
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_COLORS = [
  'bg-stone-200', 'bg-stone-300', 'bg-stone-400',
  'bg-zinc-200', 'bg-zinc-300', 'bg-zinc-400',
  'bg-neutral-200', 'bg-neutral-300', 'bg-neutral-400',
  'bg-slate-200', 'bg-slate-300', 'bg-slate-400',
];

const REACTIONS = [
  { icon: ThumbsUp, label: '👍' },
  { icon: Heart, label: '❤️' },
  { icon: Hand, label: '🙌' },
  { icon: HandMetal, label: '🙏' },
];

// --- Types ---
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarColor: string;
  initials: string;
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberUids: string[];
}

interface ReadingEntry {
  id: string;
  uid: string;
  groupId: string;
  date: string;
  scripture: string;
  thoughts: string;
  reactions: Record<string, string[]>; // emoji -> [uids]
  createdAt: any;
}

interface PrayerRequest {
  id: string;
  uid: string;
  groupId: string;
  type: 'request' | 'praise';
  content: string;
  reactions: Record<string, string[]>;
  notes: { uid: string; text: string; createdAt: any }[];
  createdAt: any;
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = (this.state.error as any).message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-stone-900 mb-4">Application Error</h2>
            <p className="text-stone-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'prayers' | 'settings'>('calendar');

  // Auth Listener
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
            // Initial profile creation
            const initials = u.displayName ? u.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : u.email?.[0].toUpperCase() || 'U';
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
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
        setGroup(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Group Listener
  useEffect(() => {
    if (profile?.groupId) {
      const unsubscribe = onSnapshot(doc(db, 'groups', profile.groupId), (docSnap) => {
        if (docSnap.exists()) {
          setGroup({ id: docSnap.id, ...docSnap.data() } as Group);
        } else {
          setGroup(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `groups/${profile.groupId}`);
      });
      return unsubscribe;
    } else {
      setGroup(null);
    }
  }, [profile?.groupId]);

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile?.groupId) {
    return <OnboardingScreen profile={profile} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-stone-600", profile.avatarColor)}>
            {profile.initials}
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Gathered</h1>
        </div>
        <nav className="flex items-center gap-1">
          <button 
            onClick={() => setView('calendar')}
            className={cn("p-2 rounded-lg transition-colors", view === 'calendar' ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-600")}
          >
            <CalendarIcon size={20} />
          </button>
          <button 
            onClick={() => setView('prayers')}
            className={cn("p-2 rounded-lg transition-colors", view === 'prayers' ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-600")}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setView('settings')}
            className={cn("p-2 rounded-lg transition-colors", view === 'settings' ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-600")}
          >
            <Settings size={20} />
          </button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {group ? (
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'calendar' && <CalendarView group={group} profile={profile!} />}
              {view === 'prayers' && <PrayerView group={group} profile={profile!} />}
              {view === 'settings' && <SettingsView profile={profile!} group={group} />}
            </motion.div>
          ) : (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Auth Screen ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-stone-200"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-stone-900 mb-2">Gathered</h1>
          <p className="text-stone-500 italic">Matthew 18:20</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button 
            type="submit"
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Google
        </button>

        <p className="mt-6 text-center text-sm text-stone-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-stone-900 font-semibold underline underline-offset-4">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// --- Onboarding Screen ---
function OnboardingScreen({ profile }: { profile: UserProfile | null }) {
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'choice' | 'join' | 'create'>('choice');

  const handleJoin = async () => {
    setError('');
    try {
      const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode.toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Invalid invite code');
        return;
      }
      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();
      if (groupData.memberUids.length >= 5) {
        setError('Group is full');
        return;
      }
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        memberUids: arrayUnion(profile!.uid)
      });
      await updateDoc(doc(db, 'users', profile!.uid), {
        groupId: groupDoc.id
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `groups/${inviteCode}`);
    }
  };

  const handleCreate = async () => {
    setError('');
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName,
        inviteCode: code,
        memberUids: [profile!.uid],
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', profile!.uid), {
        groupId: groupRef.id
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'groups/users');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-stone-200"
      >
        {mode === 'choice' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Welcome to Gathered</h2>
              <p className="text-stone-500">To get started, you'll need to join or create a group.</p>
            </div>
            <div className="grid gap-4">
              <button 
                onClick={() => setMode('join')}
                className="p-6 border border-stone-200 rounded-2xl text-left hover:bg-stone-50 transition-colors group"
              >
                <h3 className="font-bold text-stone-900 group-hover:underline">Join a Group</h3>
                <p className="text-sm text-stone-500">Enter an invite code from a friend.</p>
              </button>
              <button 
                onClick={() => setMode('create')}
                className="p-6 border border-stone-200 rounded-2xl text-left hover:bg-stone-50 transition-colors group"
              >
                <h3 className="font-bold text-stone-900 group-hover:underline">Create a Group</h3>
                <p className="text-sm text-stone-500">Start a new accountability group for 2-5 people.</p>
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-6">
            <button onClick={() => setMode('choice')} className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-stone-900">Join Group</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Invite Code (e.g. AB12CD)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 uppercase"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button 
                onClick={handleJoin}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                Join Group
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-6">
            <button onClick={() => setMode('choice')} className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-stone-900">Create Group</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button 
                onClick={handleCreate}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// --- Calendar View ---
function CalendarView({ group, profile }: { group: Group, profile: UserProfile }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [members, setMembers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const q = query(collection(db, 'readings'), where('groupId', '==', group.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingEntry)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'readings');
    });
    return unsubscribe;
  }, [group.id]);

  useEffect(() => {
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
  }, [group.memberUids]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getEntriesForDay = (day: Date) => {
    return entries.filter(e => isSameDay(new Date(e.date), day));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-stone-900">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-stone-100 rounded-lg"><ChevronLeft size={20} /></button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-stone-100 rounded-lg"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-stone-400 font-bold py-2">{d}</div>
        ))}
        {days.map(day => {
          const dayEntries = getEntriesForDay(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          
          return (
            <button 
              key={day.toString()}
              onClick={() => {
                setSelectedDay(day);
                setShowEntryForm(false);
              }}
              className={cn(
                "aspect-square p-1 border border-stone-100 rounded-xl flex flex-col items-center justify-between transition-all",
                !isSameMonth(day, currentDate) && "opacity-20",
                isSelected ? "bg-stone-900 border-stone-900" : "bg-white hover:border-stone-300",
                isToday && !isSelected && "border-stone-400"
              )}
            >
              <span className={cn("text-xs font-medium", isSelected ? "text-white" : "text-stone-700")}>
                {format(day, 'd')}
              </span>
              <div className="flex flex-wrap justify-center gap-0.5 max-w-full">
                {dayEntries.map(e => (
                  <div 
                    key={e.id} 
                    className={cn("w-1.5 h-1.5 rounded-full", members[e.uid]?.avatarColor || "bg-stone-300")} 
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-900">{format(selectedDay, 'EEEE, MMMM do')}</h3>
            {!getEntriesForDay(selectedDay).find(e => e.uid === profile.uid) && (
              <button 
                onClick={() => setShowEntryForm(true)}
                className="flex items-center gap-1 text-sm font-semibold text-stone-900 hover:underline"
              >
                <Plus size={16} /> Record Reading
              </button>
            )}
          </div>

          <div className="space-y-6">
            {showEntryForm ? (
              <ReadingForm 
                date={selectedDay} 
                group={group} 
                profile={profile} 
                onClose={() => setShowEntryForm(false)} 
              />
            ) : (
              <div className="space-y-4">
                {getEntriesForDay(selectedDay).length === 0 ? (
                  <p className="text-stone-400 text-sm italic py-4">No entries for this day.</p>
                ) : (
                  getEntriesForDay(selectedDay).map(entry => (
                    <ReadingCard key={entry.id} entry={entry} member={members[entry.uid]} profile={profile} />
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ReadingForm({ date, group, profile, onClose }: { date: Date, group: Group, profile: UserProfile, onClose: () => void }) {
  const [scripture, setScripture] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'readings'), {
        uid: profile.uid,
        groupId: group.id,
        date: format(date, 'yyyy-MM-dd'),
        scripture,
        thoughts,
        reactions: {},
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'readings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Scripture Reading</label>
        <input 
          type="text" 
          placeholder="e.g. John 1:1-14"
          value={scripture}
          onChange={(e) => setScripture(e.target.value)}
          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
          required
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Thoughts / Summary</label>
        <textarea 
          rows={3}
          placeholder="What did you learn today?"
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={submitting}
          className="flex-1 py-2 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          Save Entry
        </button>
        <button 
          type="button" 
          onClick={onClose}
          className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReadingCard({ entry, member, profile }: { entry: ReadingEntry, member: UserProfile, profile: UserProfile, key?: string }) {
  const handleReaction = async (emoji: string) => {
    const reactions = { ...entry.reactions };
    if (!reactions[emoji]) reactions[emoji] = [];
    
    if (reactions[emoji].includes(profile.uid)) {
      reactions[emoji] = reactions[emoji].filter(id => id !== profile.uid);
    } else {
      reactions[emoji].push(profile.uid);
    }
    
    await updateDoc(doc(db, 'readings', entry.id), { reactions }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `readings/${entry.id}`));
  };

  return (
    <div className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-600", member?.avatarColor)}>
          {member?.initials}
        </div>
        <span className="text-sm font-bold text-stone-900">{member?.displayName}</span>
      </div>
      <div className="pl-8">
        <p className="text-sm font-semibold text-stone-700 mb-1">{entry.scripture}</p>
        <p className="text-sm text-stone-500 leading-relaxed mb-3">{entry.thoughts}</p>
        
        <div className="flex flex-wrap gap-2">
          {REACTIONS.map(({ label }) => {
            const count = entry.reactions[label]?.length || 0;
            const hasReacted = entry.reactions[label]?.includes(profile.uid);
            return (
              <button 
                key={label}
                onClick={() => handleReaction(label)}
                className={cn(
                  "px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors",
                  hasReacted ? "bg-stone-200 text-stone-900" : "bg-stone-50 text-stone-400 hover:bg-stone-100"
                )}
              >
                <span>{label}</span>
                {count > 0 && <span className="font-bold">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Prayer View ---
function PrayerView({ group, profile }: { group: Group, profile: UserProfile }) {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const q = query(collection(db, 'prayers'), where('groupId', '==', group.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as PrayerRequest))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPrayers(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prayers');
    });
    return unsubscribe;
  }, [group.id]);

  useEffect(() => {
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
  }, [group.memberUids]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900">Prayers & Praise</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors"
        >
          <Plus size={16} /> New Entry
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <PrayerForm group={group} profile={profile} onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {prayers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 border-dashed">
            <p className="text-stone-400 italic">No prayer requests yet.</p>
          </div>
        ) : (
          prayers.map(prayer => (
            <PrayerCard key={prayer.id} prayer={prayer} member={members[prayer.uid]} profile={profile} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function PrayerForm({ group, profile, onClose }: { group: Group, profile: UserProfile, onClose: () => void }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'request' | 'praise'>('request');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'prayers'), {
        uid: profile.uid,
        groupId: group.id,
        type,
        content,
        reactions: {},
        notes: [],
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'prayers');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
      <div className="flex gap-2">
        <button 
          type="button"
          onClick={() => setType('request')}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors", type === 'request' ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400")}
        >
          Prayer Request
        </button>
        <button 
          type="button"
          onClick={() => setType('praise')}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors", type === 'praise' ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400")}
        >
          Praise Report
        </button>
      </div>
      <textarea 
        rows={4}
        placeholder={type === 'request' ? "How can we pray for you?" : "What are you praising God for?"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 resize-none"
        required
      />
      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={submitting}
          className="flex-1 py-2 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          Post
        </button>
        <button 
          type="button" 
          onClick={onClose}
          className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PrayerCard({ prayer, member, profile }: { prayer: PrayerRequest, member: UserProfile, profile: UserProfile, key?: string }) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleReaction = async (emoji: string) => {
    const reactions = { ...prayer.reactions };
    if (!reactions[emoji]) reactions[emoji] = [];
    
    if (reactions[emoji].includes(profile.uid)) {
      reactions[emoji] = reactions[emoji].filter(id => id !== profile.uid);
    } else {
      reactions[emoji].push(profile.uid);
    }
    
    await updateDoc(doc(db, 'prayers', prayer.id), { reactions }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `prayers/${prayer.id}`));
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    await updateDoc(doc(db, 'prayers', prayer.id), {
      notes: arrayUnion({
        uid: profile.uid,
        text: noteText,
        createdAt: new Date().toISOString()
      })
    }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `prayers/${prayer.id}`));
    setNoteText('');
    setShowNoteForm(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-stone-600", member?.avatarColor)}>
            {member?.initials}
          </div>
          <div>
            <p className="text-sm font-bold text-stone-900">{member?.displayName}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest">
              {prayer.createdAt ? format(prayer.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
            </p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
          prayer.type === 'request' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
        )}>
          {prayer.type}
        </span>
      </div>

      <p className="text-stone-700 leading-relaxed">{prayer.content}</p>

      <div className="flex flex-wrap gap-2 pt-2">
        {REACTIONS.map(({ label }) => {
          const count = prayer.reactions[label]?.length || 0;
          const hasReacted = prayer.reactions[label]?.includes(profile.uid);
          return (
            <button 
              key={label}
              onClick={() => handleReaction(label)}
              className={cn(
                "px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors",
                hasReacted ? "bg-stone-200 text-stone-900" : "bg-stone-50 text-stone-400 hover:bg-stone-100"
              )}
            >
              <span>{label}</span>
              {count > 0 && <span className="font-bold">{count}</span>}
            </button>
          );
        })}
        <button 
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="px-3 py-1 rounded-full text-xs bg-stone-50 text-stone-500 hover:bg-stone-100 transition-colors flex items-center gap-1"
        >
          <MessageSquare size={12} />
          <span>Note</span>
        </button>
      </div>

      {showNoteForm && (
        <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
          <input 
            type="text"
            placeholder="Write a short note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none"
            autoFocus
          />
          <button type="submit" className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium">Send</button>
        </form>
      )}

      {prayer.notes.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-50">
          {prayer.notes.map((note, idx) => (
            <div key={idx} className="flex gap-2">
              <div className="flex-1 bg-stone-50 p-3 rounded-xl">
                <p className="text-xs text-stone-600 leading-relaxed">{note.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Settings View ---
function SettingsView({ profile, group }: { profile: UserProfile, group: Group }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [initials, setInitials] = useState(profile.initials);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        avatarColor,
        initials: initials.slice(0, 2).toUpperCase()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-stone-900">Profile Settings</h3>
        
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-stone-600 shadow-inner", avatarColor)}>
            {initials}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {AVATAR_COLORS.map(color => (
              <button 
                key={color}
                onClick={() => setAvatarColor(color)}
                className={cn("w-6 h-6 rounded-full border-2 transition-transform", avatarColor === color ? "border-stone-900 scale-110" : "border-transparent", color)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Initials</label>
            <input 
              type="text" 
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-20 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 text-center font-bold"
            />
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-stone-900">Group Info</h3>
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Group Name</p>
          <p className="text-stone-900 font-semibold">{group.name}</p>
        </div>
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Invite Code</p>
            <p className="text-stone-900 font-mono font-bold text-lg">{group.inviteCode}</p>
          </div>
          <button 
            onClick={copyInviteCode}
            className="p-2 hover:bg-stone-200 rounded-lg transition-colors text-stone-500"
          >
            {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
          </button>
        </div>
      </section>

      <button 
        onClick={() => signOut(auth)}
        className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </motion.div>
  );
}
