import { View } from 'react-native';

import { Notice, RowDivider, Section, ToggleRow } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';

import { StepHeader } from './StepHeader';

export type ReminderNotice = 'denied' | 'failed';

export interface PreferencesStepProps {
  hapticsEnabled: boolean;
  onHapticsChange: (enabled: boolean) => void;
  reminderEnabled: boolean;
  /** Formatted time of the daily reminder, for example "8:00 PM". */
  reminderTime: string;
  /** True while the permission is being requested; the switch waits for the answer. */
  reminderBusy: boolean;
  reminderNotice: ReminderNotice | null;
  onReminderChange: (enabled: boolean) => void;
  focusTitle: boolean;
}

/** Step 3: the two optional comforts. Nothing here is required to start counting. */
export function PreferencesStep({
  hapticsEnabled,
  onHapticsChange,
  reminderEnabled,
  reminderTime,
  reminderBusy,
  reminderNotice,
  onReminderChange,
  focusTitle,
}: PreferencesStepProps) {
  const { t } = useTranslation();

  return (
    <View>
      <StepHeader
        title={t('welcome.preferencesTitle')}
        hint={t('welcome.preferencesHint')}
        focusOnMount={focusTitle}
      />
      <Section>
        <ToggleRow
          title={t('welcome.hapticsTitle')}
          description={t('welcome.hapticsDescription')}
          value={hapticsEnabled}
          onValueChange={onHapticsChange}
          testID="welcome-haptics"
        />
        <RowDivider />
        <ToggleRow
          title={t('welcome.reminderTitle')}
          description={t('welcome.reminderDescription', { time: reminderTime })}
          value={reminderEnabled}
          onValueChange={onReminderChange}
          disabled={reminderBusy}
          testID="welcome-reminder"
        />
      </Section>
      {reminderNotice ? (
        <Notice
          message={t(reminderNotice === 'denied' ? 'welcome.reminderDenied' : 'welcome.reminderFailed')}
          testID="welcome-reminder-notice"
        />
      ) : null}
    </View>
  );
}
