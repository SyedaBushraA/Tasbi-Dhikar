import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useRef, useState } from 'react';

import { ListRow, RowDivider, Section, ToggleRow } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions } from '@/state';
import { formatReminderTime } from '@/utils/date';

import { ReminderNotice, type ReminderProblem } from './ReminderNotice';
import { SectionBlock } from './SectionBlock';

export interface ReminderSectionProps {
  enabled: boolean;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

/** The daily reminder switch (which asks for the notification permission) and its time. */
export const ReminderSection = memo(function ReminderSection({
  enabled,
  hour,
  minute,
}: ReminderSectionProps) {
  const { t } = useTranslation();
  const actions = useAppActions();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<ReminderProblem | null>(null);
  const busyRef = useRef(false);

  // A stale explanation should not greet the user when they come back later.
  useFocusEffect(
    useCallback(() => {
      return () => setProblem(null);
    }, []),
  );

  async function toggle(next: boolean): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setProblem(null);
    try {
      if (next) {
        const result = await actions.enableReminder();
        if (result !== 'scheduled') setProblem(result);
      } else {
        await actions.disableReminder();
      }
    } catch {
      setProblem('failed');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <Section title={t('settings.reminder.sectionTitle')}>
      <ToggleRow
        title={t('settings.reminder.title')}
        description={t('settings.reminder.description')}
        value={enabled}
        onValueChange={(next) => void toggle(next)}
        disabled={busy}
        testID="settings-reminder"
      />
      <RowDivider />
      <ListRow
        title={t('settings.reminder.timeLabel')}
        value={formatReminderTime(hour, minute)}
        showChevron
        onPress={() => router.push('/reminder-time')}
        accessibilityHint={t('settings.reminder.changeTime')}
        testID="settings-reminder-time"
      />
      {problem ? (
        <>
          <RowDivider />
          <SectionBlock>
            <ReminderNotice problem={problem} testID="settings-reminder-notice" />
          </SectionBlock>
        </>
      ) : null}
    </Section>
  );
});
