import { Fragment } from 'react';

import { SectionBlock } from '@/components/settings/SectionBlock';
import { AppText, ListRow, RowDivider, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerDay, PrayerName } from '@/types';

import { usePrayerTimeText } from './prayerText';

/** Three times are enough to tell the methods apart: the two twilight times and Asr. */
const PREVIEW_TIMES: readonly PrayerName[] = ['fajr', 'asr', 'isha'];

export interface MethodPreviewProps {
  /** Today with the choice on screen, or null while no location is known. */
  day: PrayerDay | null;
  testID?: string;
}

/** What the chosen method and Asr time mean for today, before anything is saved. */
export function MethodPreview({ day, testID }: MethodPreviewProps) {
  const { t } = useTranslation();
  const timeText = usePrayerTimeText();

  return (
    <Section title={t('prayerSettings.calculation.preview')}>
      {day ? (
        PREVIEW_TIMES.map((name, index) => (
          <Fragment key={name}>
            {index > 0 ? <RowDivider /> : null}
            <ListRow
              title={t(`prayer.names.${name}`)}
              value={timeText(day.times[name])}
              testID={testID ? `${testID}-${name}` : undefined}
            />
          </Fragment>
        ))
      ) : (
        <SectionBlock>
          <AppText variant="body" tone="muted">
            {t('prayerSettings.calculation.previewHint')}
          </AppText>
        </SectionBlock>
      )}
    </Section>
  );
}
