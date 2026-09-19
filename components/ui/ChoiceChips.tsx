import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  accessibilityLabel?: string;
}

export interface ChoiceChipsProps<T extends string | number> {
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Read by screen readers as the name of the group. */
  accessibilityLabel: string;
  testID?: string;
}

/** A single-choice group of large chips. The chosen chip is filled and carries a check mark. */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: ChoiceChipsProps<T>) {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.group}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ selected, checked: selected }}
            testID={testID ? `${testID}-${option.value}` : undefined}
            style={({ pressed }) => [
              styles.chip,
              {
                minHeight: theme.touchTarget,
                minWidth: theme.touchTarget + SPACING.xl,
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            {selected ? (
              <Ionicons
                name="checkmark"
                size={theme.text('label').fontSize + 2}
                color={colors.onPrimary}
              />
            ) : null}
            <AppText variant="label" tone={selected ? 'onPrimary' : 'default'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
});
