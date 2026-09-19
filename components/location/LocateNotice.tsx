import { Linking } from 'react-native';

import { AnnouncedNotice } from '@/components/settings/AnnouncedNotice';
import { AppButton, AppText } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { LocateResult } from '@/state/prayerActions';

/** Why the position could not be used. */
export type LocateProblem = Exclude<LocateResult['status'], 'ok'>;

export interface LocateNoticeProps {
  problem: LocateProblem;
  testID?: string;
}

function openPhoneSettings(): void {
  // Some phones have no settings page for the app; the notice already says what to do.
  Linking.openSettings().catch(() => undefined);
}

/** Explains why the location could not be used, and what the user can do instead. */
export function LocateNotice({ problem, testID }: LocateNoticeProps) {
  const { t } = useTranslation();

  return (
    <AnnouncedNotice tone="warning" message={t(`location.locate.${problem}.title`)} testID={testID}>
      <AppText variant="body">{t(`location.locate.${problem}.message`)}</AppText>
      {problem === 'denied' ? (
        <AppButton
          variant="secondary"
          icon="settings-outline"
          label={t('location.locate.openPhoneSettings')}
          onPress={openPhoneSettings}
          testID={testID ? `${testID}-open-settings` : undefined}
        />
      ) : null}
    </AnnouncedNotice>
  );
}
