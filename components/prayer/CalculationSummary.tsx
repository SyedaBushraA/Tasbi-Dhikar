import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { PRAYER_ORDER } from '@/constants/prayer';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { AsrMethod, CalculationMethodId, PrayerName } from '@/types';

import { asrMethodKey, methodKey } from './labels';

export interface CalculationSummaryProps {
  method: CalculationMethodId;
  asrMethod: AsrMethod;
  adjustments: Readonly<Record<PrayerName, number>>;
}

/** How today's times were worked out, and the way to change it. */
export const CalculationSummary = memo(function CalculationSummary({
  method,
  asrMethod,
  adjustments,
}: CalculationSummaryProps) {
  const { t } = useTranslation();
  const openSettings = useCallback(() => router.push('/prayer-settings'), []);

  const adjusted = PRAYER_ORDER.some((name) => adjustments[name] !== 0);
  const lines = [
    t('prayer.summary.method', { method: t(methodKey(method)) }),
    t('prayer.summary.asr', { asr: t(asrMethodKey(asrMethod)) }),
  ];
  if (adjusted) lines.push(t('prayer.summary.adjusted'));

  return (
    <View style={styles.summary} testID="prayer-calculation-summary">
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={lines.join(', ')}
        style={styles.lines}
      >
        {lines.map((line) => (
          <AppText key={line} variant="caption" tone="muted">
            {line}
          </AppText>
        ))}
      </View>
      <AppButton
        label={t('prayer.summary.openSettings')}
        icon="settings-outline"
        variant="secondary"
        onPress={openSettings}
        accessibilityHint={t('prayer.summary.openSettingsHint')}
        testID="prayer-open-settings"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  lines: { flex: 1, gap: SPACING.xs },
});
