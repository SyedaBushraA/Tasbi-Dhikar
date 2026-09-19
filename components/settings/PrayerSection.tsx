import { router } from 'expo-router';
import { memo } from 'react';

import { ListRow, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';

/** One door to everything about prayer times: place, method, notifications and Adhan. */
export const PrayerSection = memo(function PrayerSection() {
  const { t } = useTranslation();

  return (
    <Section title={t('settings.prayer.sectionTitle')}>
      <ListRow
        title={t('settings.prayer.title')}
        subtitle={t('settings.prayer.description')}
        showChevron
        onPress={() => router.push('/prayer-settings')}
        accessibilityLabel={t('settings.prayer.title')}
        accessibilityHint={t('settings.prayer.open')}
        testID="settings-prayer"
      />
    </Section>
  );
});
