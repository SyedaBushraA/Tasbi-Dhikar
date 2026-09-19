import { useFocusEffect } from 'expo-router';
import { Fragment, memo, useCallback, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { AnnouncedNotice } from '@/components/settings/AnnouncedNotice';
import { SectionBlock } from '@/components/settings/SectionBlock';
import { AppButton, AppText, RowDivider, Section, ToggleRow } from '@/components/ui';
import { PRAYER_SCHEDULE_DAYS, SALAH_ORDER } from '@/constants/prayer';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions } from '@/state';
import type { PrayerAlertResult } from '@/state/prayerActions';
import type { SalahName } from '@/types';

type Problem = 'denied' | 'failed';

export interface PrayerNotificationsSectionProps {
  notifications: Record<SalahName, boolean>;
  hasLocation: boolean;
}

function openPhoneSettings(): void {
  // Some phones have no settings page for the app; the notice already says what to do.
  Linking.openSettings().catch(() => undefined);
}

/** A notification at the time of each prayer, one switch per prayer. */
export const PrayerNotificationsSection = memo(function PrayerNotificationsSection({
  notifications,
  hasLocation,
}: PrayerNotificationsSectionProps) {
  const { t, n } = useTranslation();
  const actions = useAppActions();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const busyRef = useRef(false);

  // A stale explanation should not greet the user when they come back later.
  useFocusEffect(
    useCallback(() => {
      return () => setProblem(null);
    }, []),
  );

  const onCount = SALAH_ORDER.filter((name) => notifications[name]).length;
  const allOn = onCount === SALAH_ORDER.length;
  const anyOn = onCount > 0;

  async function change(
    apply: () => Promise<PrayerAlertResult>,
    turningOn: boolean,
  ): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setProblem(null);

    let result: PrayerAlertResult;
    try {
      result = await apply();
    } catch {
      result = 'failed';
    }
    // Turning a notification off can never fail in a way the user needs to act on.
    if (turningOn && (result === 'denied' || result === 'failed')) setProblem(result);

    busyRef.current = false;
    setBusy(false);
  }

  const locked = busy || !hasLocation;

  return (
    <Section title={t('prayerSettings.notificationsTitle')}>
      <SectionBlock>
        <AppText variant="body" tone="muted">
          {t('prayerSettings.notifications.intro')}
        </AppText>
        {hasLocation ? null : (
          <AppText variant="body">{t('prayerSettings.notifications.needLocation')}</AppText>
        )}
      </SectionBlock>
      <RowDivider />
      <ToggleRow
        title={t('prayerSettings.notifications.all')}
        // Some on, some off: the switch alone would read as simply "off".
        description={
          anyOn && !allOn
            ? t('prayerSettings.notifications.someOn', {
                count: n(onCount),
                total: n(SALAH_ORDER.length),
              })
            : undefined
        }
        value={allOn}
        disabled={locked}
        onValueChange={(next) => void change(() => actions.setAllPrayerNotifications(next), next)}
        testID="prayer-notifications-all"
      />
      {SALAH_ORDER.map((name) => (
        <Fragment key={name}>
          <RowDivider />
          <ToggleRow
            title={t(`prayer.names.${name}`)}
            value={notifications[name]}
            disabled={locked}
            onValueChange={(next) =>
              void change(() => actions.setPrayerNotification(name, next), next)
            }
            testID={`prayer-notifications-${name}`}
          />
        </Fragment>
      ))}
      <RowDivider />
      <SectionBlock>
        <AppText variant="caption" tone="muted">
          {t('prayerSettings.notifications.planNote', { days: n(PRAYER_SCHEDULE_DAYS) })}
        </AppText>
        {Platform.OS === 'android' && anyOn ? (
          <>
            <AppText variant="caption" tone="muted">
              {t('prayerSettings.notifications.exactTip')}
            </AppText>
            <AppButton
              variant="secondary"
              icon="settings-outline"
              label={t('prayerSettings.notifications.openPhoneSettings')}
              onPress={openPhoneSettings}
              testID="prayer-notifications-exact-settings"
            />
          </>
        ) : null}
        {problem === 'failed' ? (
          <AnnouncedNotice
            tone="warning"
            message={t('prayerSettings.notifications.failed')}
            testID="prayer-notifications-notice"
          />
        ) : null}
        {problem === 'denied' ? (
          <AnnouncedNotice
            tone="warning"
            message={t('prayerSettings.notifications.denied')}
            testID="prayer-notifications-notice"
          >
            <AppText variant="body">{t('prayerSettings.notifications.deniedMessage')}</AppText>
            <AppButton
              variant="secondary"
              icon="settings-outline"
              label={t('prayerSettings.notifications.openPhoneSettings')}
              onPress={openPhoneSettings}
              testID="prayer-notifications-open-settings"
            />
          </AnnouncedNotice>
        ) : null}
      </SectionBlock>
    </Section>
  );
});
