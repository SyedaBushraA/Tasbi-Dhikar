import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { FormScreen } from '@/components/dhikr/FormScreen';
import { leaveScreen } from '@/components/dhikr/navigation';
import { useDhikrConfirmations } from '@/components/dhikr/useDhikrConfirmations';
import { AppButton, AppText, TargetPicker } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector } from '@/state';
import { targetChangeRestartsRound } from '@/utils/counter';

export default function TargetScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editsDefault = mode === 'default';

  const { t } = useTranslation();
  const actions = useAppActions();
  const counter = useAppSelector((state) => state.counter);
  const defaultTarget = useAppSelector((state) => state.settings.defaultTarget);
  const { confirmNewRound } = useDhikrConfirmations();

  const [target, setTarget] = useState(editsDefault ? defaultTarget : counter.target);
  const [valid, setValid] = useState(true);

  function handleSave() {
    if (!valid) return;

    if (editsDefault) {
      actions.updateSettings({ defaultTarget: target });
      leaveScreen();
      return;
    }

    const apply = () => {
      actions.setTarget(target);
      leaveScreen();
    };
    // A target the count has already reached starts a new round.
    if (target !== counter.target && targetChangeRestartsRound(counter, target)) {
      confirmNewRound(apply);
    } else {
      apply();
    }
  }

  return (
    <>
      {editsDefault ? <Stack.Screen options={{ title: t('settings.defaultTarget.title') }} /> : null}
      <FormScreen testID="target-screen">
        <AppText tone="muted">
          {editsDefault ? t('settings.defaultTarget.description') : t('dhikr.targetDescription')}
        </AppText>

        <TargetPicker
          value={target}
          onChange={setTarget}
          onValidityChange={setValid}
          testID="target-picker"
        />

        <AppButton
          label={t('common.save')}
          icon="checkmark"
          fullWidth
          disabled={!valid}
          onPress={handleSave}
          accessibilityHint={t('dhikr.a11y.saveTargetHint')}
          testID="target-save"
        />
      </FormScreen>
    </>
  );
}
