import { HeaderHeightContext } from 'expo-router/react-navigation';
import { type ReactNode, useContext } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';

import { Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';

export interface FormScreenProps {
  children: ReactNode;
  testID?: string;
}

/** A scrolling screen under a native header whose fields stay above the keyboard. */
export function FormScreen({ children, testID }: FormScreenProps) {
  // The header sits above this view, so the keyboard overlap is measured from below it.
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={styles.fill}
    >
      <Screen
        scroll
        edges={['left', 'right', 'bottom']}
        contentStyle={styles.content}
        testID={testID}
      >
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: SPACING.xl },
});
