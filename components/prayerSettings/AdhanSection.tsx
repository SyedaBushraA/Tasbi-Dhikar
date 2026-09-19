import { Fragment, memo, useMemo, useState } from 'react';

import { SectionBlock } from '@/components/settings/SectionBlock';
import { AppText, Notice, RowDivider, Section, ToggleRow } from '@/components/ui';
import { SALAH_ORDER } from '@/constants/prayer';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { adhanPlaybackAvailable, setAdhanVolume } from '@/services/adhanPlayer';
import { adhanNotificationSounds } from '@/services/prayerNotifications';
import { useAppActions } from '@/state';
import type { PrayerSettings } from '@/types';

import { AdhanTestButtons } from './AdhanTestButtons';
import { VolumeSlider } from './VolumeSlider';

export interface AdhanSectionProps {
  prayer: PrayerSettings;
}

/**
 * The Adhan as the sound of the prayer notifications. The settings are kept
 * even when no recording is bundled, so nothing is lost when one is added.
 */
export const AdhanSection = memo(function AdhanSection({ prayer }: AdhanSectionProps) {
  const { t } = useTranslation();
  const { easyMode } = useTheme();
  const actions = useAppActions();
  const [volume, setVolume] = useState(prayer.adhanVolume);

  // What this build actually carries: in the app, and as a notification sound.
  const playable = useMemo(() => adhanPlaybackAvailable(), []);
  const sounds = useMemo(() => adhanNotificationSounds(), []);

  const canPlay = playable.standard || playable.fajr;
  const bundled = canPlay || sounds.standard || sounds.fajr;
  const hasFajrRecording = playable.fajr || sounds.fajr;
  const locked = !bundled;

  function changeVolume(next: number): void {
    setVolume(next);
    // A test that is running follows the slider straight away.
    setAdhanVolume(next);
  }

  return (
    <Section title={t('prayerSettings.adhanTitle')}>
      {bundled ? null : (
        <>
          <SectionBlock>
            <Notice
              message={t('prayerSettings.adhan.notIncluded')}
              testID="prayer-adhan-not-included"
            />
          </SectionBlock>
          <RowDivider />
        </>
      )}

      <ToggleRow
        title={t('prayerSettings.adhan.master')}
        description={t('prayerSettings.adhan.masterDescription')}
        value={prayer.adhanEnabled}
        disabled={locked}
        onValueChange={(next) => actions.updatePrayerSettings({ adhanEnabled: next })}
        testID="prayer-adhan-enabled"
      />

      {SALAH_ORDER.map((name) => {
        const prayerName = t(`prayer.names.${name}`);
        return (
          <Fragment key={name}>
            <RowDivider />
            <ToggleRow
              title={t('prayerSettings.adhan.forPrayer', { prayer: prayerName })}
              description={
                prayer.notifications[name]
                  ? undefined
                  : t('prayerSettings.adhan.needNotification', { prayer: prayerName })
              }
              value={prayer.adhan[name]}
              disabled={locked || !prayer.adhanEnabled}
              onValueChange={(next) => actions.updatePrayerSettings({ adhan: { [name]: next } })}
              testID={`prayer-adhan-${name}`}
            />
          </Fragment>
        );
      })}

      {hasFajrRecording ? (
        <>
          <RowDivider />
          <ToggleRow
            title={t('prayerSettings.adhan.separateFajr')}
            description={t('prayerSettings.adhan.separateFajrDescription')}
            value={prayer.fajrAdhanSeparate}
            disabled={locked || !prayer.adhanEnabled}
            onValueChange={(next) => actions.updatePrayerSettings({ fajrAdhanSeparate: next })}
            testID="prayer-adhan-separate-fajr"
          />
        </>
      ) : null}

      <RowDivider />
      <SectionBlock>
        <VolumeSlider
          value={volume}
          onChange={changeVolume}
          onCommit={(next) => actions.updatePrayerSettings({ adhanVolume: next })}
          disabled={!canPlay}
          testID="prayer-adhan-volume"
        />
        <AppText variant="caption" tone="muted">
          {t('prayerSettings.adhan.volumeCaption')}
        </AppText>
        <AdhanTestButtons
          volume={volume}
          available={playable}
          showFajr={!easyMode && prayer.fajrAdhanSeparate}
          testID="prayer-adhan-test"
        />
        <AppText variant="caption" tone="muted">
          {t('prayerSettings.adhan.platformNote')}
        </AppText>
      </SectionBlock>
    </Section>
  );
});
