import { ReactNode, forwardRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  style?: ViewStyle;
} & Pick<ScrollViewProps, 'keyboardShouldPersistTaps'>;

/** Approximate tab stack header height (title bar, not including status bar). */
const HEADER_CONTENT_HEIGHT = 44;

/**
 * Scroll + keyboard avoidance for tab screens.
 */
export const KeyboardScreen = forwardRef<ScrollView, Props>(function KeyboardScreen(
  { children, contentContainerStyle, style, keyboardShouldPersistTaps = 'handled' },
  ref
) {
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset =
    Platform.OS === 'ios' ? insets.top + HEADER_CONTENT_HEIGHT : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        ref={ref}
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
