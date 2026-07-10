export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarColor: string;
  initials: string;
  groupId?: string;
  expoPushToken?: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberUids: string[];
}

export interface PrayerNote {
  uid: string;
  text: string;
  createdAt: string;
  authorName?: string;
  authorInitials?: string;
}

export interface PrayerRequest {
  id: string;
  uid: string;
  groupId: string;
  type: 'request' | 'praise';
  content: string;
  reactions: Record<string, string[]>;
  notes: PrayerNote[];
  createdAt: { seconds: number; toDate: () => Date } | null;
}

export interface ReadingEntry {
  id: string;
  uid: string;
  groupId: string;
  date: string;
  scripture: string;
  thoughts: string;
  reactions: Record<string, string[]>;
  createdAt: { seconds: number; toDate: () => Date } | null;
}
