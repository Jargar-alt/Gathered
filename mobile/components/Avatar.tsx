import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '@shared/types';
import { AVATAR_COLOR_MAP } from '@shared/constants';
import { colors } from '@shared/colors';

interface AvatarProps {
  profile?: UserProfile | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 24, md: 32, lg: 80 };
const FONT_SIZES = { sm: 10, md: 12, lg: 24 };

export default function Avatar({ profile, size = 'md' }: AvatarProps) {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const bgColor = profile?.avatarColor
    ? AVATAR_COLOR_MAP[profile.avatarColor] ?? colors.border
    : colors.border;

  return (
    <View
      style={[
        styles.avatar,
        { width: dimension, height: dimension, borderRadius: dimension / 2, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>
        {profile?.initials ?? '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
