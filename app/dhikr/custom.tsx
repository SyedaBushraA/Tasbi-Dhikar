import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormScreen } from '@/components/dhikr/FormScreen';
import { leaveScreen, returnToCounter } from '@/components/dhikr/navigation';
import { hasUnfinishedRound, useDhikrConfirmations } from '@/components/dhikr/useDhikrConfirmations';
import { AppButton, AppText, Notice, TargetPicker, TextField } from '@/components/ui';
import { MAX_CUSTOM_DHIKR, MAX_DHIKR_NAME_LENGTH } from '@/constants/dhikr';
import { SPACING } from '@/constants/theme';
import { useDhikrList } from '@/hooks/useDhikr';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector } from '@/state';
import { targetChangeRestartsRound } from '@/utils/counter';
import { type DhikrNameError, validateDhikrName } from '@/utils/validation';

export default function CustomDhikrScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && params.id.length > 0 ? params.id : undefined;

  const { t, n } = useTranslation();
  const actions = useAppActions();
  const existing = useAppSelector((state) =>
    id === undefined ? undefined : state.customDhikr.find((dhikr) => dhikr.id === id),
  );
  const counter = useAppSelector((state) => state.counter);
  const defaultTarget = useAppSelector((state) => state.settings.defaultTarget);
  const dhikrList = useDhikrList();
  const { confirmNewRound, confirmDelete } = useDhikrConfirmations();

  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing?.target ?? defaultTarget);
  const [targetValid, setTargetValid] = useState(true);
  const [nameError, setNameError] = useState<DhikrNameError | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  // An id without a Dhikr means it was deleted (here or elsewhere); the form has nothing to edit.
  const missing = id !== undefined && existing === undefined;
  const left = useRef(false);
  useEffect(() => {
    if (missing && !left.current) {
      left.current = true;
      leaveScreen();
    }
  }, [missing]);

  function handleNameChange(text: string) {
    setName(text);
    if (nameError) setNameError(null);
  }

  function commit(andUse: boolean) {
    const result = actions.saveCustomDhikr({ id: existing?.id, name, target });
    if (!result.ok) {
      setNameError(result.nameError ?? null);
      setLimitReached(result.limitReached === true);
      return;
    }
    if (!andUse) {
      leaveScreen();
      return;
    }
    actions.selectDhikr(result.dhikr.id);
    returnToCounter();
  }

  function submit(andUse: boolean) {
    if (!targetValid) return;

    // Checked here as well, so the question below is only asked when saving can go ahead.
    const otherNames = dhikrList
      .filter((dhikr) => dhikr.id !== existing?.id)
      .map((dhikr) => dhikr.name);
    const nameCheck = validateDhikrName(name, otherNames);
    if (!nameCheck.ok) {
      setNameError(nameCheck.error);
      return;
    }

    const isCurrent = existing !== undefined && existing.id === counter.dhikrId;
    const resetsRound = isCurrent
      ? target !== counter.target && targetChangeRestartsRound(counter, target)
      : andUse && hasUnfinishedRound(counter);
    if (resetsRound) confirmNewRound(() => commit(andUse));
    else commit(andUse);
  }

  function handleDelete() {
    if (!existing) return;
    // Leaving happens once the Dhikr is gone, through the effect above.
    confirmDelete(existing, () => actions.deleteCustomDhikr(existing.id));
  }

  if (missing) return null;

  const nameErrorText = nameError
    ? t(`dhikr.errors.${nameError}`, { max: n(MAX_DHIKR_NAME_LENGTH) })
    : null;

  return (
    <>
      <Stack.Screen options={{ title: existing ? t('dhikr.editTitle') : t('dhikr.createTitle') }} />
      <FormScreen testID="dhikr-form-screen">
        <TextField
          label={t('dhikr.nameLabel')}
          value={name}
          onChangeText={handleNameChange}
          placeholder={t('dhikr.namePlaceholder')}
          error={nameErrorText}
          maxLength={MAX_DHIKR_NAME_LENGTH}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          testID="dhikr-name-input"
        />

        <View style={styles.field}>
          <AppText variant="label">{t('dhikr.targetLabel')}</AppText>
          <TargetPicker
            value={target}
            onChange={setTarget}
            onValidityChange={setTargetValid}
            testID="dhikr-target-picker"
          />
        </View>

        {limitReached ? (
          <Notice
            message={t('dhikr.limitReached', { max: n(MAX_CUSTOM_DHIKR) })}
            tone="warning"
            testID="dhikr-form-limit"
          />
        ) : null}

        <View style={styles.buttons}>
          <AppButton
            label={t('dhikr.saveAndUse')}
            icon="checkmark"
            fullWidth
            disabled={!targetValid}
            onPress={() => submit(true)}
            accessibilityHint={t('dhikr.a11y.saveAndUseHint')}
            testID="dhikr-save-use"
          />
          <AppButton
            label={t('common.save')}
            variant="secondary"
            fullWidth
            disabled={!targetValid}
            onPress={() => submit(false)}
            accessibilityHint={t('dhikr.a11y.saveHint')}
            testID="dhikr-save"
          />
          {existing ? (
            <AppButton
              label={t('common.delete')}
              icon="trash-outline"
              variant="danger"
              fullWidth
              onPress={handleDelete}
              accessibilityLabel={t('dhikr.a11y.deleteLabel', { name: existing.name })}
              accessibilityHint={t('dhikr.a11y.deleteHint')}
              style={styles.deleteButton}
              testID="dhikr-delete"
            />
          ) : null}
        </View>
      </FormScreen>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: SPACING.sm },
  buttons: { gap: SPACING.md },
  // Kept apart from the save buttons so it is not pressed by habit.
  deleteButton: { marginTop: SPACING.xl },
});
