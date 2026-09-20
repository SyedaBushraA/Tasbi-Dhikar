import Constants from 'expo-constants';
import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { AppText, ListRow, RowDivider, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { adhanPlaybackAvailable } from '@/services/adhanPlayer';
import { adhanNotificationSounds } from '@/services/prayerNotifications';

import { SectionBlock } from './SectionBlock';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Version and the short privacy promise, with a way to read the full one. */
export const AboutSection = memo(function AboutSection() {
  const { t } = useTranslation();

  // Thanks are only due for what this build actually carries: a build without
  // a recording must not credit one.
  const adhanBundled = useMemo(() => {
    const playable = adhanPlaybackAvailable();
    const sounds = adhanNotificationSounds();
    return playable.standard || playable.fajr || sounds.standard || sounds.fajr;
  }, []);

  return (
    <Section title={t('settings.about.title')}>
      {/* Read as one item, so the number is not separated from its meaning. */}
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${t('settings.about.version')}, ${APP_VERSION}`}
      >
        <ListRow title={t('settings.about.version')} value={APP_VERSION} testID="settings-version" />
      </View>
      <RowDivider />
      <SectionBlock>
        <AppText variant="body" tone="muted">
          {t('settings.about.privacySummary')}
        </AppText>
      </SectionBlock>
      <ListRow
        title={t('settings.about.readPrivacy')}
        showChevron
        onPress={() => router.push('/privacy')}
        testID="settings-privacy"
      />
      <RowDivider />
      {/* Attribution for the data, the library and the recording the app ships with. */}
      <SectionBlock testID="settings-credits">
        <AppText variant="label" tone="muted" accessibilityRole="header">
          {t('settings.about.credits')}
        </AppText>
        <AppText variant="body" tone="muted">
          {t('settings.about.cityData')}
        </AppText>
        <AppText variant="body" tone="muted">
          {t('settings.about.prayerLibrary')}
        </AppText>
        {adhanBundled ? (
          <AppText variant="body" tone="muted" testID="settings-credits-adhan">
            {t('settings.about.adhanAudio')}
          </AppText>
        ) : null}
      </SectionBlock>
    </Section>
  );
});
