import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui';
import { ChooseDhikrStep } from '@/components/welcome/ChooseDhikrStep';
import { ChooseTargetStep } from '@/components/welcome/ChooseTargetStep';
import { IntroStep } from '@/components/welcome/IntroStep';
import { PreferencesStep, type ReminderNotice } from '@/components/welcome/PreferencesStep';
import { StepFade } from '@/components/welcome/StepFade';
import { StepProgress } from '@/components/welcome/StepProgress';
import { WelcomeFooter } from '@/components/welcome/WelcomeFooter';
import { useTranslation } from '@/hooks/useTranslation';
import { selectionFeedback } from '@/services/haptics';
import { useAppActions, useAppSelector } from '@/state';
import { formatReminderTime } from '@/utils/date';

/** Steps after the greeting: Dhikr, target, preferences. */
const SETUP_STEPS = 3;

const EDGES = ['top', 'left', 'right', 'bottom'] as const;

/**
 * First launch. Everything here is optional: the way out is on every step and
 * finishing only fills in what the user chose. The root layout leaves this
 * route as soon as onboarding is marked complete.
 */
export default function WelcomeScreen() {
  const actions = useAppActions();
  const { t } = useTranslation();
  const settings = useAppSelector((state) => state.settings);
  const counterDhikrId = useAppSelector((state) => state.counter.dhikrId);

  const [step, setStep] = useState(0);
  // The reader stays where it is on first launch and follows the title from then on.
  const [hasMoved, setHasMoved] = useState(false);
  const [dhikrId, setDhikrId] = useState(counterDhikrId);
  const [target, setTarget] = useState(settings.defaultTarget);
  const [targetValid, setTargetValid] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(settings.hapticsEnabled);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderNotice, setReminderNotice] = useState<ReminderNotice | null>(null);

  const goToStep = useCallback((next: number) => {
    setStep(next);
    setHasMoved(true);
    // The target picker re-opens with the last valid target, so it can be saved again.
    setTargetValid(true);
  }, []);

  useEffect(() => {
    if (step === 0) return undefined;
    // The hardware back button walks back through the steps instead of leaving the app.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goToStep(step - 1);
      return true;
    });
    return () => subscription.remove();
  }, [step, goToStep]);

  const handleHapticsChange = useCallback((enabled: boolean) => {
    setHapticsEnabled(enabled);
    // A small taste of what was just turned on.
    if (enabled) selectionFeedback();
  }, []);

  const updateReminder = useCallback(
    async (enabled: boolean) => {
      setReminderNotice(null);
      if (!enabled) {
        await actions.disableReminder();
        return;
      }
      setReminderBusy(true);
      try {
        const result = await actions.enableReminder();
        if (result !== 'scheduled') setReminderNotice(result);
      } finally {
        setReminderBusy(false);
      }
    },
    [actions],
  );

  const handleReminderChange = useCallback(
    (enabled: boolean) => {
      void updateReminder(enabled);
    },
    [updateReminder],
  );

  const finish = useCallback(() => {
    actions.updateSettings({ defaultTarget: target, hapticsEnabled });
    actions.selectDhikr(dhikrId);
    actions.setTarget(target);
    actions.completeOnboarding();
  }, [actions, dhikrId, hapticsEnabled, target]);

  const skip = useCallback(() => {
    actions.completeOnboarding();
  }, [actions]);

  function renderStep() {
    switch (step) {
      case 1:
        return <ChooseDhikrStep selectedId={dhikrId} onSelect={setDhikrId} focusTitle={hasMoved} />;
      case 2:
        return (
          <ChooseTargetStep
            target={target}
            onChange={setTarget}
            onValidityChange={setTargetValid}
            focusTitle={hasMoved}
          />
        );
      case 3:
        return (
          <PreferencesStep
            hapticsEnabled={hapticsEnabled}
            onHapticsChange={handleHapticsChange}
            reminderEnabled={settings.reminder.enabled}
            reminderTime={formatReminderTime(settings.reminder.hour, settings.reminder.minute)}
            reminderBusy={reminderBusy}
            reminderNotice={reminderNotice}
            onReminderChange={handleReminderChange}
            focusTitle={hasMoved}
          />
        );
      default:
        return <IntroStep focusTitle={hasMoved} />;
    }
  }

  function primaryAction() {
    if (step === 0) {
      return {
        label: t('welcome.getStarted'),
        hint: t('welcome.getStartedHint'),
        onPress: () => goToStep(1),
        disabled: false,
      };
    }
    if (step < SETUP_STEPS) {
      return {
        label: t('common.next'),
        hint: t('welcome.nextHint'),
        onPress: () => goToStep(step + 1),
        disabled: step === 2 && !targetValid,
      };
    }
    return {
      label: t('welcome.startCounting'),
      hint: t('welcome.startCountingHint'),
      onPress: finish,
      disabled: false,
    };
  }

  const primary = primaryAction();

  // A new key per step starts each one at the top of the page, faded in.
  return (
    <Screen key={step} scroll edges={EDGES} testID="welcome-screen">
      <StepFade>
        {step > 0 ? (
          <StepProgress step={step} total={SETUP_STEPS} onBack={() => goToStep(step - 1)} />
        ) : null}
        <View style={[styles.body, step === 0 && styles.centered]}>{renderStep()}</View>
        <WelcomeFooter
          primaryLabel={primary.label}
          primaryHint={primary.hint}
          primaryDisabled={primary.disabled}
          onPrimary={primary.onPress}
          onSkip={skip}
        />
      </StepFade>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1 },
  centered: { justifyContent: 'center' },
});
