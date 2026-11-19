import { ReactNode, forwardRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

type Props = {
  children: ReactNode;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  style?: ViewStyle;
} & Pick<ScrollViewProps, 'keyboardShouldPersistTaps'>;

/**
 * Scroll container for tab screens.
 * Uses ScrollView keyboard insets on iOS (not KeyboardAvoidingView) so note/text
 * fields keep focus while typing.
 */
export const KeyboardScreen = forwardRef<ScrollView, Props>(function KeyboardScreen(
  { children, contentContainerStyle, style, keyboardShouldPersistTaps = 'handled' },
  ref
) {
  return (
    <ScrollView
      ref={ref}
      style={[styles.flex, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
