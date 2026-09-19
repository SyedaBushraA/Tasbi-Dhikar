import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ReminderNotice, type ReminderProblem } from '@/components/settings/ReminderNotice';
import { TimeStepper } from '@/components/settings/TimeStepper';
import { AppButton, AppText, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { ReminderResult } from '@/services/reminders';
import { useAppActions, useAppSelector } from '@/state';

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function ReminderTimeScreen() {
  const reminder = useAppSelector((state) => state.settings.reminder);
  const actions = useAppActions();
  const { t } = useTranslation();
  const [time, setTime] = useState({ hour: reminder.hour, minute: reminder.minute });
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<ReminderProblem | null>(null);
  const savingRef = useRef(false);

  async function save(): Promise<void> {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setProblem(null);

    let result: ReminderResult | 'saved';
    try {
      result = await actions.setReminderTime(time.hour, time.minute);
    } catch {
      result = 'failed';
    }

    // The button stays disabled while the screen is on its way out.
    if (result === 'saved' || result === 'scheduled') {
      goBack();
      return;
    }
    setProblem(result);
    savingRef.current = false;
    setSaving(false);
  }

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} testID="reminder-time-screen">
      <TimeStepper
        hour={time.hour}
        minute={time.minute}
        onChange={(hour, minute) => setTime({ hour, minute })}
        testID="reminder-time-stepper"
      />
      <View style={styles.footer}>
        {problem ? <ReminderNotice problem={problem} testID="reminder-time-notice" /> : null}
        {!problem && !reminder.enabled ? (
          <AppText variant="caption" tone="muted" align="center">
            {t('settings.reminder.offHint')}
          </AppText>
        ) : null}
        <AppButton
          icon="checkmark"
          label={t('settings.reminder.saveTime')}
          onPress={() => void save()}
          disabled={saving}
          fullWidth
          testID="reminder-time-save"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: SPACING.xxl, gap: SPACING.lg },
});
