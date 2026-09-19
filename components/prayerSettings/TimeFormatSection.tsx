import { memo, useMemo } from 'react';

import { SectionBlock } from '@/components/settings/SectionBlock';
import { ChoiceChips, type ChoiceOption, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions } from '@/state';
import type { ClockFormat } from '@/types';

export interface TimeFormatSectionProps {
  clockFormat: ClockFormat;
}

/** How clock times are written, here and in the prayer notifications. */
export const TimeFormatSection = memo(function TimeFormatSection({
  clockFormat,
}: TimeFormatSectionProps) {
  const { t } = useTranslation();
  const actions = useAppActions();

  const options = useMemo<ChoiceOption<ClockFormat>[]>(
    () => [
      { value: '12h', label: t('prayerSettings.timeFormat.twelveHour') },
      { value: '24h', label: t('prayerSettings.timeFormat.twentyFourHour') },
    ],
    [t],
  );

  return (
    <Section title={t('prayerSettings.timeFormat.title')}>
      <SectionBlock>
        <ChoiceChips
          options={options}
          value={clockFormat}
          onChange={(next) => actions.updateSettings({ clockFormat: next })}
          accessibilityLabel={t('prayerSettings.timeFormat.title')}
          testID="prayer-settings-clock-format"
        />
      </SectionBlock>
    </Section>
  );
});
