import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdjustmentStepper } from '@/components/prayerSettings/AdjustmentStepper';
import { usePrayerTimeText } from '@/components/prayerSettings/prayerText';
import { AppButton, AppText, Screen } from '@/components/ui';
import { PRAYER_ORDER } from '@/constants/prayer';
import { SPACING } from '@/constants/theme';
import { useToday } from '@/hooks/useToday';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector } from '@/state';
import type { PrayerName } from '@/types';
import { calculatePrayerDay } from '@/utils/prayer';

/** Moving single times by a few minutes, to match the local mosque. */
export default function PrayerAdjustmentsScreen() {
  const prayer = useAppSelector((state) => state.prayer);
  const actions = useAppActions();
  const { t } = useTranslation();
  const today = useToday();
  const timeText = usePrayerTimeText();

  // The calculated day already carries the adjustments, so the preview follows every press.
  const day = useMemo(() => {
    const location = prayer.location;
    return location ? calculatePrayerDay(prayer, location, today) : null;
  }, [prayer, today]);

  const adjusted = PRAYER_ORDER.some((name) => prayer.adjustments[name] !== 0);

  function change(name: PrayerName, minutes: number): void {
    actions.updatePrayerSettings({ adjustments: { [name]: minutes } });
  }

  function resetAll(): void {
    const cleared: Partial<Record<PrayerName, number>> = {};
    for (const name of PRAYER_ORDER) cleared[name] = 0;
    actions.updatePrayerSettings({ adjustments: cleared });
  }

  function confirmReset(): void {
    Alert.alert(
      t('prayerSettings.adjustments.resetTitle'),
      t('prayerSettings.adjustments.resetMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('prayerSettings.adjustments.resetAction'),
          style: 'destructive',
          onPress: resetAll,
        },
      ],
      { cancelable: true },
    );
  }

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} testID="prayer-adjustments-screen">
      <AppText variant="body" tone="muted">
        {t('prayerSettings.adjustments.intro')}
      </AppText>
      {day ? null : (
        <AppText variant="body" style={styles.note}>
          {t('prayerSettings.adjustments.noLocation')}
        </AppText>
      )}

      <View style={styles.list}>
        {PRAYER_ORDER.map((name) => (
          <AdjustmentStepper
            key={name}
            prayer={name}
            minutes={prayer.adjustments[name]}
            timeText={day ? timeText(day.times[name]) : null}
            onChange={(minutes) => change(name, minutes)}
            testID={`prayer-adjustment-${name}`}
          />
        ))}
      </View>

      <AppButton
        variant="secondary"
        icon="refresh"
        label={t('prayerSettings.adjustments.resetAll')}
        onPress={confirmReset}
        disabled={!adjusted}
        fullWidth
        testID="prayer-adjustments-reset"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: SPACING.md },
  list: { marginVertical: SPACING.xl, gap: SPACING.xl },
});
