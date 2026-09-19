import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface SuggestionTagProps {
  label: string;
  testID?: string;
}

/**
 * Marks what is usually chosen in the user's country. Always a written label,
 * never only a colour, and never a choice made for the user.
 */
export function SuggestionTag({ label, testID }: SuggestionTagProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.tag, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
      testID={testID}
    >
      <AppText variant="caption" tone="primary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
});
