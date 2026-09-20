import { useFocusEffect } from 'expo-router';
import { Fragment, memo, useCallback, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { AnnouncedNotice } from '@/components/settings/AnnouncedNotice';
import { SectionBlock } from '@/components/settings/SectionBlock';
import {
  AppButton,
  AppText,
  type ChoiceOption,
  ChoiceChips,
  Notice,
  RowDivider,
  Section,
} from '@/components/ui';
import { SALAH_ORDER } from '@/constants/prayer';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { adhanPlaybackAvailable, setAdhanVolume } from '@/services/adhanPlayer';
import { adhanNotificationSounds } from '@/services/prayerNotifications';
import { useAppActions } from '@/state';
import type { PrayerAlertResult } from '@/state/prayerActions';
import type { PrayerSettings, SalahName } from '@/types';

import { AdhanTestButtons } from './AdhanTestButtons';
import { VolumeSlider } from './VolumeSlider';

/** What happens at one prayer time. One question instead of three switches. */
type AlertMode = 'off' | 'notification' | 'adhan';

const MODES: readonly AlertMode[] = ['off', 'notification', 'adhan'];

export interface PrayerAlertsSectionProps {
  prayer: PrayerSettings;
}

function modeOf(prayer: PrayerSettings, name: SalahName): AlertMode {
  if (!prayer.notifications[name]) return 'off';
  return prayer.adhanEnabled && prayer.adhan[name] ? 'adhan' : 'notification';
}

function openPhoneSettings(): void {
  // Some phones have no settings page for the app; the notice already says what to do.
  Linking.openSettings().catch(() => undefined);
}

/**
 * Prayer alerts: for each prayer, nothing, a notification, or the Adhan.
 * The three settings behind it (notification, Adhan, which recording) are set
 * together, so no switch can be on while another one makes it do nothing.
 */
export const PrayerAlertsSection = memo(function PrayerAlertsSection({
  prayer,
}: PrayerAlertsSectionProps) {
  const { t } = useTranslation();
  const { easyMode } = useTheme();
  const actions = useAppActions();

  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<'denied' | 'failed' | null>(null);
  const [volume, setVolume] = useState(prayer.adhanVolume);
  const busyRef = useRef(false);

  // A stale explanation should not greet the user when they come back later.
  useFocusEffect(
    useCallback(() => {
      return () => setProblem(null);
    }, []),
  );

  const playable = adhanPlaybackAvailable();
  const sounds = adhanNotificationSounds();
  const adhanBundled = playable.standard || playable.fajr || sounds.standard || sounds.fajr;
  // Without a notification sound the Adhan cannot be heard while Tasbi is
  // closed, however well it plays inside the app. Saying otherwise is a promise
  // the phone will not keep.
  const adhanWhenClosed = sounds.standard || sounds.fajr;

  const modes = SALAH_ORDER.map((name) => modeOf(prayer, name));
  const firstMode = modes[0];
  const sharedMode = firstMode !== undefined && modes.every((mode) => mode === firstMode) ? firstMode : null;
  const anyAdhan = modes.includes('adhan');
  const anyOn = modes.some((mode) => mode !== 'off');
  const hasLocation = prayer.location !== null;
  const locked = busy || !hasLocation;

  // One row cannot tell the truth about prayers that differ, so the list opens.
  const [showEach, setShowEach] = useState(sharedMode === null);
  // Easy Mode keeps one choice for all five until the user asks for the list.
  const listVisible = !easyMode || showEach;

  /** Chips for one row. Each one names its prayer, which the group name alone does not. */
  function optionsFor(prayerLabel: string): ChoiceOption<AlertMode>[] {
    return MODES.filter((mode) => mode !== 'adhan' || adhanBundled).map((mode) => {
      const label = t(`prayerSettings.alerts.modes.${mode}`);
      return {
        value: mode,
        label,
        accessibilityLabel: t('prayerSettings.alerts.a11y.option', {
          mode: label,
          prayer: prayerLabel,
        }),
      };
    });
  }

  async function apply(names: readonly SalahName[], mode: AlertMode): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setProblem(null);

    // The sound is decided before the notification is scheduled with it, so
    // what it replaces is kept to put back if the choice does not come off.
    const restore = { adhan: { ...prayer.adhan }, adhanEnabled: prayer.adhanEnabled };
    const adhan: Partial<Record<SalahName, boolean>> = {};
    for (const name of names) adhan[name] = mode === 'adhan';
    const adhanAfter = SALAH_ORDER.some((name) =>
      names.includes(name) ? mode === 'adhan' : prayer.adhanEnabled && prayer.adhan[name],
    );
    actions.updatePrayerSettings({ adhan, adhanEnabled: adhanAfter });

    let result: PrayerAlertResult;
    try {
      result =
        names.length === SALAH_ORDER.length
          ? await actions.setAllPrayerNotifications(mode !== 'off')
          : await actions.setPrayerNotification(names[0] as SalahName, mode !== 'off');
    } catch {
      result = 'failed';
    }
    // Turning an alert off can never fail in a way the user needs to act on.
    if (mode !== 'off' && (result === 'denied' || result === 'failed')) {
      // The notification went back by itself; the sound must go back with it,
      // or the chip would show a choice the user never got.
      actions.updatePrayerSettings(restore);
      setProblem(result);
    }

    busyRef.current = false;
    setBusy(false);
  }

  function changeVolume(next: number): void {
    setVolume(next);
    // A test that is running follows the slider straight away.
    setAdhanVolume(next);
  }

  return (
    <Section title={t('prayerSettings.alerts.title')}>
      <SectionBlock>
        <AppText variant="body" tone="muted">
          {t('prayerSettings.alerts.intro')}
        </AppText>
        {hasLocation ? null : (
          <AppText variant="body">{t('prayerSettings.alerts.needLocation')}</AppText>
        )}
        {adhanBundled ? null : <Notice message={t('prayerSettings.adhan.notIncluded')} />}
        {/* The alerts were turned off by the phone, not by the user: say so. */}
        {prayer.alertsBlocked ? (
          <Notice
            tone="warning"
            message={t('prayerSettings.alerts.blocked')}
            testID="prayer-alerts-blocked"
          >
            <AppText variant="body">{t('prayerSettings.alerts.blockedMessage')}</AppText>
            <AppButton
              variant="secondary"
              icon="settings-outline"
              label={t('prayerSettings.notifications.openPhoneSettings')}
              onPress={openPhoneSettings}
              testID="prayer-alerts-blocked-settings"
            />
          </Notice>
        ) : null}
        {/* Next to the choice that failed, not at the foot of the section. */}
        {problem === null ? null : (
          <AnnouncedNotice
            tone="warning"
            message={t(`prayerSettings.notifications.${problem}`)}
            testID="prayer-alerts-notice"
          >
            {problem === 'denied' ? (
              <>
                <AppText variant="body">{t('prayerSettings.notifications.deniedMessage')}</AppText>
                <AppButton
                  variant="secondary"
                  icon="settings-outline"
                  label={t('prayerSettings.notifications.openPhoneSettings')}
                  onPress={openPhoneSettings}
                  testID="prayer-alerts-open-settings"
                />
              </>
            ) : null}
          </AnnouncedNotice>
        )}
      </SectionBlock>

      <RowDivider />
      <View style={styles.row}>
        <AppText variant="label">{t('prayerSettings.alerts.allPrayers')}</AppText>
        {sharedMode === null && listVisible ? (
          <AppText variant="caption" tone="muted">
            {t('prayerSettings.alerts.mixed')}
          </AppText>
        ) : null}
        <ChoiceChips
          options={optionsFor(t('prayerSettings.alerts.allPrayers'))}
          value={sharedMode}
          onChange={(mode) => void apply(SALAH_ORDER, mode)}
          accessibilityLabel={t('prayerSettings.alerts.a11y.allGroup')}
          disabled={locked}
          testID="prayer-alerts-all"
        />
      </View>

      {listVisible ? (
        SALAH_ORDER.map((name) => {
          const prayerLabel = t(`prayer.names.${name}`);
          return (
            <Fragment key={name}>
              <RowDivider />
              <View style={styles.row}>
                <AppText variant="label">{prayerLabel}</AppText>
                <ChoiceChips
                  options={optionsFor(prayerLabel)}
                  value={modeOf(prayer, name)}
                  onChange={(mode) => void apply([name], mode)}
                  accessibilityLabel={t('prayerSettings.alerts.a11y.group', {
                    prayer: prayerLabel,
                  })}
                  disabled={locked}
                  testID={`prayer-alerts-${name}`}
                />
              </View>
            </Fragment>
          );
        })
      ) : (
        /* The list is one button away, so Easy Mode starts with one choice. */
        <>
          <RowDivider />
          <SectionBlock>
            <AppButton
              variant="secondary"
              icon="options-outline"
              label={t('prayerSettings.alerts.setEach')}
              onPress={() => setShowEach(true)}
              fullWidth
              testID="prayer-alerts-show-each"
            />
          </SectionBlock>
        </>
      )}

      {anyAdhan ? (
        <>
          <RowDivider />
          <SectionBlock>
            <VolumeSlider
              value={volume}
              onChange={changeVolume}
              onCommit={(next) => actions.updatePrayerSettings({ adhanVolume: next })}
              disabled={!(playable.standard || playable.fajr)}
              testID="prayer-adhan-volume"
            />
            {/* The slider moves the sound the app plays, not the one the phone plays. */}
            <AppText variant="caption" tone="muted">
              {t('prayerSettings.adhan.volumeCaption')}
            </AppText>
            <AdhanTestButtons
              volume={volume}
              available={playable}
              showFajr={!easyMode}
              testID="prayer-adhan-test"
            />
            <AppText variant="caption" tone="muted" testID="prayer-adhan-platform-note">
              {t(
                adhanWhenClosed
                  ? 'prayerSettings.adhan.platformNote'
                  : 'prayerSettings.adhan.inAppOnlyNote',
              )}
            </AppText>
          </SectionBlock>
        </>
      ) : null}

      {Platform.OS === 'android' && anyOn ? (
        <>
          <RowDivider />
          <SectionBlock>
            <AppText variant="caption" tone="muted">
              {t('prayerSettings.notifications.exactTip')}
            </AppText>
            <AppButton
              variant="secondary"
              icon="settings-outline"
              label={t('prayerSettings.notifications.openPhoneSettings')}
              onPress={openPhoneSettings}
              testID="prayer-alerts-exact-settings"
            />
          </SectionBlock>
        </>
      ) : null}
    </Section>
  );
});

const styles = StyleSheet.create({
  row: { gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
});
