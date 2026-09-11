import { Alert } from 'react-native';
import { blockUser, reportContent, ReportableContentType } from '@/lib/moderation';

type ModerationTarget = {
  contentType: ReportableContentType;
  contentId: string;
  targetUid: string;
  groupId: string;
  reporterUid: string;
  targetName?: string;
  onBlocked?: () => void;
  onReported?: () => void;
};

export function openModerationMenu(target: ModerationTarget) {
  if (target.targetUid === target.reporterUid) return;

  Alert.alert('Safety', 'Flag this content or block this person.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Flag content',
      onPress: () => confirmFlag(target),
    },
    {
      text: 'Block user',
      style: 'destructive',
      onPress: () => confirmBlock(target),
    },
  ]);
}

function confirmFlag(target: ModerationTarget) {
  Alert.alert(
    'Flag as objectionable?',
    'We’ll hide this for you and review the report. There is no tolerance for abusive or objectionable content.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Flag',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportContent({
              reporterUid: target.reporterUid,
              targetUid: target.targetUid,
              groupId: target.groupId,
              contentType: target.contentType,
              contentId: target.contentId,
              reason: 'Objectionable or abusive content',
            });
            target.onReported?.();
            Alert.alert('Thanks', 'This content was flagged and hidden for you.');
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not flag content.');
          }
        },
      },
    ]
  );
}

function confirmBlock(target: ModerationTarget) {
  const name = target.targetName || 'this user';
  Alert.alert(
    'Block user?',
    `You will no longer see content from ${name}. You can unblock them later in Settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(target.reporterUid, target.targetUid);
            target.onBlocked?.();
            Alert.alert('Blocked', `${name} has been blocked.`);
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not block user.');
          }
        },
      },
    ]
  );
}
