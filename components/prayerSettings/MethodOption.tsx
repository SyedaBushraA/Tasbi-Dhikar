import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { CalculationMethodId } from '@/types';

import { SuggestionTag } from './SuggestionTag';
import { methodDetailsText } from './prayerText';

export interface MethodOptionProps {
  method: CalculationMethodId;
  selected: boolean;
  /** Label of the "suggested for this country" tag, or null when there is none. */
  suggestion: string | null;
  onSelect: () => void;
  testID?: string;
}

/** One calculation method with its twilight angles, as a radio option. */
export const MethodOption = memo(function MethodOption({
  method,
  selected,
  suggestion,
  onSelect,
  testID,
}: MethodOptionProps) {
  const theme = useTheme();
  const { t, n } = useTranslation();
  const { colors } = theme;

  const name = t(`prayer.methods.${method}`);
  const details = methodDetailsText(method, t, n);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityLabel={suggestion ? `${name}, ${suggestion}` : name}
      accessibilityHint={details}
      accessibilityState={{ selected, checked: selected }}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { minHeight: theme.touchTarget + SPACING.sm },
        pressed && { backgroundColor: colors.pressedOverlay },
      ]}
    >
      <View style={styles.texts}>
        <AppText variant="body" style={selected ? styles.selectedName : undefined}>
          {name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {details}
        </AppText>
        {suggestion ? <SuggestionTag label={suggestion} /> : null}
      </View>
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={theme.text('body').fontSize + 8}
          color={colors.primary}
        />
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  texts: { flex: 1, gap: SPACING.xs },
  selectedName: { fontWeight: '700' },
});
