import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

export interface NoticeProps {
  message: string;
  tone?: 'info' | 'warning';
  /** Optional action below the message, for example a button. */
  children?: ReactNode;
  testID?: string;
}

/** A calm inline message. Used instead of pop-ups for things the user should know about. */
export function Notice({ message, tone = 'info', children, testID }: NoticeProps) {
  const theme = useTheme();
  const { colors } = theme;
  const color = tone === 'warning' ? colors.danger : colors.primary;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={testID}
      style={[styles.notice, { backgroundColor: colors.surfaceMuted, borderColor: color }]}
    >
      <View style={styles.row}>
        <Ionicons
          name={tone === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'}
          size={theme.text('body').fontSize + 5}
          color={color}
        />
        <AppText variant="body" style={styles.message}>
          {message}
        </AppText>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: RADIUS.md,
    borderStartWidth: 4,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  row: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  message: { flex: 1 },
});
