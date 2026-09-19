import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

export interface StepperControlProps {
  label: string;
  valueText: string;
  /** Read by screen readers instead of the visible "Earlier" / "Later". */
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
  testID?: string;
}

/** One value with two large, labelled buttons to move it down or up. */
export function StepperControl({
  label,
  valueText,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
  testID,
}: StepperControlProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.stepper} testID={testID}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${label}, ${valueText}`}
        style={styles.header}
      >
        <AppText variant="heading">{label}</AppText>
        <AppText variant="title" style={styles.value}>
          {valueText}
        </AppText>
      </View>
      <View style={styles.buttons}>
        <AppButton
          variant="secondary"
          icon="remove"
          label={t('settings.reminder.decrease')}
          accessibilityLabel={decreaseLabel}
          onPress={onDecrease}
          style={styles.button}
          testID={testID ? `${testID}-decrease` : undefined}
        />
        <AppButton
          variant="secondary"
          icon="add"
          label={t('settings.reminder.increase')}
          accessibilityLabel={increaseLabel}
          onPress={onIncrease}
          style={styles.button}
          testID={testID ? `${testID}-increase` : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { gap: SPACING.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  value: { fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', gap: SPACING.md },
  button: { flex: 1 },
});
