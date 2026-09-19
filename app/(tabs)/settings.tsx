import { StyleSheet } from 'react-native';

import { AboutSection } from '@/components/settings/AboutSection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { CountingSection } from '@/components/settings/CountingSection';
import { DataSection } from '@/components/settings/DataSection';
import { LanguageSection } from '@/components/settings/LanguageSection';
import { PrayerSection } from '@/components/settings/PrayerSection';
import { ReminderSection } from '@/components/settings/ReminderSection';
import { AppText, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSelector } from '@/state';

export default function SettingsScreen() {
  const settings = useAppSelector((state) => state.settings);
  const { t } = useTranslation();

  return (
    <Screen scroll testID="settings-screen">
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {t('settings.title')}
      </AppText>
      <AppearanceSection
        preference={settings.theme}
        easyMode={settings.easyMode}
        clockFormat={settings.clockFormat}
      />
      <CountingSection
        defaultTarget={settings.defaultTarget}
        hapticsEnabled={settings.hapticsEnabled}
        soundEnabled={settings.soundEnabled}
      />
      <ReminderSection
        enabled={settings.reminder.enabled}
        hour={settings.reminder.hour}
        minute={settings.reminder.minute}
      />
      <PrayerSection />
      <LanguageSection language={settings.language} />
      <DataSection />
      <AboutSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: SPACING.xl },
});
