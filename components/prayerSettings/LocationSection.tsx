import { router } from 'expo-router';
import { memo } from 'react';

import { SectionBlock } from '@/components/settings/SectionBlock';
import { AppButton, AppText, ListRow, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerLocation } from '@/types';
import { formatCoordinate } from '@/utils/prayer';

import { countryLabel } from './prayerText';

export interface LocationSectionProps {
  location: PrayerLocation | null;
}

function openLocation(): void {
  router.push('/prayer-location');
}

/** The place prayer times are calculated for. */
export const LocationSection = memo(function LocationSection({ location }: LocationSectionProps) {
  const { t, locale } = useTranslation();
  const title = t('prayerSettings.location.title');

  if (!location) {
    return (
      <Section title={title}>
        <SectionBlock>
          <AppText variant="body" tone="muted">
            {t('prayerSettings.location.none')}
          </AppText>
          <AppButton
            icon="location-outline"
            label={t('prayerSettings.location.set')}
            onPress={openLocation}
            fullWidth
            testID="prayer-settings-set-location"
          />
        </SectionBlock>
      </Section>
    );
  }

  const country = countryLabel(location.countryCode, locale);
  const place = [location.region, country].filter(Boolean).join(', ');
  // A place entered as coordinates has no region or country to show.
  const detail =
    place.length > 0
      ? place
      : `${formatCoordinate(location.latitude, 'latitude')}, ${formatCoordinate(location.longitude, 'longitude')}`;

  return (
    <Section title={title}>
      <ListRow
        title={location.name}
        subtitle={detail}
        showChevron
        onPress={openLocation}
        accessibilityLabel={`${location.name}, ${detail}`}
        accessibilityHint={t('prayerSettings.location.change')}
        testID="prayer-settings-location"
      />
    </Section>
  );
});
