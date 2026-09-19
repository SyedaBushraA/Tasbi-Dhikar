import { Linking } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { ReminderResult } from '@/services/reminders';

import { AnnouncedNotice } from './AnnouncedNotice';

export type ReminderProblem = Exclude<ReminderResult, 'scheduled'>;

export interface ReminderNoticeProps {
  problem: ReminderProblem;
  testID?: string;
}

function openPhoneSettings(): void {
  // Some phones have no settings page for the app; the notice already says what to do.
  Linking.openSettings().catch(() => undefined);
}

/** Explains why the reminder could not be turned on, and how to fix it. */
export function ReminderNotice({ problem, testID }: ReminderNoticeProps) {
  const { t } = useTranslation();

  if (problem === 'failed') {
    return <AnnouncedNotice tone="warning" message={t('settings.reminder.failed')} testID={testID} />;
  }

  return (
    <AnnouncedNotice tone="warning" message={t('settings.reminder.deniedTitle')} testID={testID}>
      <AppText variant="body">{t('settings.reminder.deniedMessage')}</AppText>
      <AppButton
        variant="secondary"
        icon="settings-outline"
        label={t('settings.reminder.openPhoneSettings')}
        onPress={openPhoneSettings}
        testID={testID ? `${testID}-open-settings` : undefined}
      />
    </AnnouncedNotice>
  );
}
