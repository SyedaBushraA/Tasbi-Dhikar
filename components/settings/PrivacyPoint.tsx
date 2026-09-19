import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText, type IconName } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface PrivacyPointProps {
  /** Decorative only; the text carries the meaning. */
  icon: IconName;
  text: string;
}

/** One paragraph of the privacy page, with a small icon on its first line. */
export function PrivacyPoint({ icon, text }: PrivacyPointProps) {
  const theme = useTheme();
  const body = theme.text('body');

  return (
    <View style={styles.point}>
      <View style={[styles.icon, { height: body.lineHeight }]}>
        <Ionicons
          name={icon}
          size={body.fontSize + 5}
          color={theme.colors.primary}
          accessible={false}
          importantForAccessibility="no"
        />
      </View>
      <AppText variant="body" style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  icon: { justifyContent: 'center' },
  text: { flex: 1 },
});
