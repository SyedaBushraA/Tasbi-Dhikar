import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CalculationSummary } from '@/components/prayer/CalculationSummary';
import { MethodReviewNotice } from '@/components/prayer/MethodReviewNotice';
import { NextPrayerCard } from '@/components/prayer/NextPrayerCard';
import { PrayerDayHeader } from '@/components/prayer/PrayerDayHeader';
import { PrayerSetup } from '@/components/prayer/PrayerSetup';
import { PrayerTimesList } from '@/components/prayer/PrayerTimesList';
import { TimeZoneNote } from '@/components/prayer/TimeZoneNote';
import { locationLabel } from '@/components/prayer/labels';
import { AppButton, AppText, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSelector } from '@/state';

export default function PrayerScreen() {
  const { location, today, next, now } = usePrayerTimes();
  const prayer = useAppSelector((state) => state.prayer);
  const clockFormat = useAppSelector((state) => state.settings.clockFormat);
  const { easyMode } = useTheme();
  const { t, locale } = useTranslation();
  const [timesShown, setTimesShown] = useState(false);

  const toggleTimes = useCallback(() => setTimesShown((shown) => !shown), []);
  const openSettings = useCallback(() => router.push('/prayer-settings'), []);

  const title = (
    <AppText variant="title" accessibilityRole="header">
      {t('prayer.title')}
    </AppText>
  );

  if (!location || !today) {
    return (
      <Screen scroll contentStyle={styles.content} testID="prayer-screen">
        {title}
        <PrayerSetup />
      </Screen>
    );
  }

  // The method is only a suggestion until the user has looked at it, and times differ by method.
  const methodNotice = prayer.methodConfirmed ? null : (
    <MethodReviewNotice method={prayer.method} />
  );

  if (easyMode) {
    return (
      <Screen scroll contentStyle={styles.content} testID="prayer-screen">
        {title}
        {methodNotice}
        <NextPrayerCard next={next} now={now} clockFormat={clockFormat} />
        <AppText variant="body" tone="muted" align="center">
          {locationLabel(location, locale)}
        </AppText>
        <AppButton
          label={timesShown ? t('prayer.hideAllTimes') : t('prayer.showAllTimes')}
          icon={timesShown ? 'chevron-up' : 'chevron-down'}
          variant="secondary"
          fullWidth
          onPress={toggleTimes}
          accessibilityHint={
            timesShown ? t('prayer.a11y.hideAllTimesHint') : t('prayer.a11y.showAllTimesHint')
          }
          testID="prayer-toggle-times"
        />
        {timesShown ? (
          <PrayerTimesList day={today} next={next} now={now} clockFormat={clockFormat} />
        ) : null}
        {/* Easy Mode leaves out the calculation summary, so settings need their own way in. */}
        <AppButton
          label={t('prayer.summary.openSettings')}
          icon="settings-outline"
          variant="secondary"
          fullWidth
          onPress={openSettings}
          accessibilityHint={t('prayer.summary.openSettingsHint')}
          testID="prayer-open-settings"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content} testID="prayer-screen">
      {title}
      {methodNotice}
      <PrayerDayHeader dayKey={today.dayKey} location={location} />
      <NextPrayerCard next={next} now={now} clockFormat={clockFormat} />
      <PrayerTimesList day={today} next={next} now={now} clockFormat={clockFormat} />
      <TimeZoneNote location={location} />
      <CalculationSummary
        method={prayer.method}
        asrMethod={prayer.asrMethod}
        adjustments={prayer.adjustments}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.lg },
});
