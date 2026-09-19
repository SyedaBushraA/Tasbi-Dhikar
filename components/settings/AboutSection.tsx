import Constants from 'expo-constants';
import { router } from 'expo-router';
import { memo } from 'react';
import { View } from 'react-native';

import { AppText, ListRow, RowDivider, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';

import { SectionBlock } from './SectionBlock';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Version and the short privacy promise, with a way to read the full one. */
export const AboutSection = memo(function AboutSection() {
  const { t } = useTranslation();

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
      {/* Attribution for the data and the library the prayer times are built on. */}
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
      </SectionBlock>
    </Section>
  );
});
