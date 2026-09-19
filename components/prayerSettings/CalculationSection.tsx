import { router } from 'expo-router';
import { memo } from 'react';

import { ListRow, RowDivider, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerSettings } from '@/types';

import { adjustmentsSummary } from './prayerText';

export interface CalculationSectionProps {
  prayer: PrayerSettings;
}

function openMethod(): void {
  router.push('/prayer-method');
}

/** Method, Asr time and manual adjustments: what the times are built from. */
export const CalculationSection = memo(function CalculationSection({
  prayer,
}: CalculationSectionProps) {
  const { t, n } = useTranslation();

  const methodName = t(`prayer.methods.${prayer.method}`);
  const asrName = t(`prayer.asrMethods.${prayer.asrMethod}`);
  const adjustments = adjustmentsSummary(prayer.adjustments, t, n);
  const methodTitle = t('prayerSettings.methodTitle');
  const asrTitle = t('prayerSettings.asrTitle');
  const adjustmentsTitle = t('prayerSettings.adjustmentsTitle');

  return (
    <Section title={t('prayerSettings.calculation.title')}>
      <ListRow
        title={methodTitle}
        subtitle={
          // The method is never assumed silently: an unconfirmed one says so.
          prayer.methodConfirmed
            ? methodName
            : `${methodName} · ${t('prayerSettings.calculation.unconfirmed')}`
        }
        showChevron
        onPress={openMethod}
        accessibilityLabel={`${methodTitle}, ${methodName}`}
        accessibilityHint={t('prayerSettings.calculation.methodHint')}
        testID="prayer-settings-method"
      />
      <RowDivider />
      <ListRow
        title={asrTitle}
        subtitle={asrName}
        showChevron
        onPress={openMethod}
        accessibilityLabel={`${asrTitle}, ${asrName}`}
        accessibilityHint={t('prayerSettings.calculation.asrHint')}
        testID="prayer-settings-asr"
      />
      <RowDivider />
      <ListRow
        title={adjustmentsTitle}
        subtitle={adjustments}
        showChevron
        onPress={() => router.push('/prayer-adjustments')}
        accessibilityLabel={`${adjustmentsTitle}, ${adjustments}`}
        accessibilityHint={t('prayerSettings.calculation.adjustmentsHint')}
        testID="prayer-settings-adjustments"
      />
    </Section>
  );
});
