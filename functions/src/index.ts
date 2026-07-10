import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

admin.initializeApp();

const DATABASE_ID = 'ai-studio-8208d2b0-a74a-48ef-b802-330bc39f0036';
const expo = new Expo();

function getDb() {
  return getFirestore(admin.app(), DATABASE_ID);
}

async function getGroupMemberTokens(
  groupId: string,
  excludeUid: string
): Promise<string[]> {
  const groupSnap = await getDb().doc(`groups/${groupId}`).get();
  const memberUids: string[] = groupSnap.data()?.memberUids ?? [];
  const tokens: string[] = [];

  for (const uid of memberUids) {
    if (uid === excludeUid) continue;
    const userSnap = await getDb().doc(`users/${uid}`).get();
    const token = userSnap.data()?.expoPushToken;
    if (token && Expo.isExpoPushToken(token)) {
      tokens.push(token);
    }
  }
  return tokens;
}

async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
) {
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}

export const onPrayerCreated = onDocumentCreated(
  { document: 'prayers/{prayerId}', database: DATABASE_ID },
  async (event) => {
    const prayer = event.data?.data();
    if (!prayer) return;

    const posterSnap = await getDb().doc(`users/${prayer.uid}`).get();
    const poster = posterSnap.data();
    const tokens = await getGroupMemberTokens(prayer.groupId, prayer.uid);
    const label = prayer.type === 'praise' ? 'praise report' : 'prayer request';

    await sendPush(
      tokens,
      'Gathered',
      `${poster?.displayName ?? 'Someone'} posted a ${label}`,
      { prayerId: event.params.prayerId, screen: 'prayers' }
    );
  }
);

export const onPrayerNoteAdded = onDocumentUpdated(
  { document: 'prayers/{prayerId}', database: DATABASE_ID },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const oldNotes = before.notes?.length ?? 0;
    const newNotes = after.notes?.length ?? 0;
    if (newNotes <= oldNotes) return;

    const latestNote = after.notes[newNotes - 1];
    const noteAuthorSnap = await getDb().doc(`users/${latestNote.uid}`).get();
    const noteAuthor = noteAuthorSnap.data();

    const tokens = await getGroupMemberTokens(after.groupId, latestNote.uid);

    await sendPush(
      tokens,
      'Gathered',
      `${noteAuthor?.displayName ?? 'Someone'} responded to a prayer`,
      { prayerId: event.params.prayerId, screen: 'prayers' }
    );
  }
);
