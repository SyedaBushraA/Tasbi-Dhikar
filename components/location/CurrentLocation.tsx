import { StyleSheet, View } from 'react-native';

import { AppText, Section } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerLocation } from '@/types';
import { formatCoordinate } from '@/utils/prayer';

export interface CurrentLocationProps {
  location: PrayerLocation | null;
  testID?: string;
}

/** The place prayer times are calculated for, and where it came from. */
export function CurrentLocation({ location, testID }: CurrentLocationProps) {
  const { t } = useTranslation();
  const { easyMode } = useTheme();

  if (!location) {
    return (
      <Section title={t('location.current.title')}>
        <View style={styles.block} testID={testID}>
          <AppText variant="body">{t('location.current.none')}</AppText>
          <AppText variant="caption" tone="muted">
            {t('location.current.noneHint')}
          </AppText>
        </View>
      </Section>
    );
  }

  const place = location.region ? `${location.name}, ${location.region}` : location.name;
  const coordinates = `${formatCoordinate(location.latitude, 'latitude')}, ${formatCoordinate(
    location.longitude,
    'longitude',
  )}`;

  return (
    <Section title={t('location.current.title')}>
      <View style={styles.block} testID={testID}>
        <AppText variant="label">{place}</AppText>
        <AppText variant="caption" tone="muted">
          {t(`location.current.source.${location.source}`)}
        </AppText>
        {/* Easy Mode keeps only the name and where it came from. */}
        {!easyMode && place !== coordinates ? (
          <AppText variant="caption" tone="muted">
            {coordinates}
          </AppText>
        ) : null}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
});
