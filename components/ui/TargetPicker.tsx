import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MAX_TARGET, MIN_TARGET, PRESET_TARGETS } from '@/constants/targets';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { validateTarget } from '@/utils/validation';

import { ChoiceChips, type ChoiceOption } from './ChoiceChips';
import { TextField } from './TextField';

const CUSTOM = 'custom';
type Choice = number | typeof CUSTOM;

export interface TargetPickerProps {
  /** The current valid target. */
  value: number;
  /** Called with every new valid target. */
  onChange: (target: number) => void;
  /** Tells the parent whether what is on screen can be saved (false while a custom number is invalid). */
  onValidityChange?: (valid: boolean) => void;
  testID?: string;
}

/** The common targets as large chips, plus "Custom" for any other whole number. */
export function TargetPicker({ value, onChange, onValidityChange, testID }: TargetPickerProps) {
  const { t, tCount, n } = useTranslation();
  const [customMode, setCustomMode] = useState(() => !PRESET_TARGETS.includes(value));
  const [customText, setCustomText] = useState(() =>
    PRESET_TARGETS.includes(value) ? '' : String(value),
  );
  const [touched, setTouched] = useState(false);

  const validation = validateTarget(customText);
  const error =
    customMode && touched && !validation.ok
      ? t(`common.targetPicker.errors.${validation.error}`, { min: MIN_TARGET, max: n(MAX_TARGET) })
      : null;

  const options: ChoiceOption<Choice>[] = [
    ...PRESET_TARGETS.map((target) => ({
      value: target,
      label: n(target),
      accessibilityLabel: tCount('common.targetPicker.times', target),
    })),
    { value: CUSTOM, label: t('common.targetPicker.custom') },
  ];

  function handleChoice(choice: Choice) {
    if (choice === CUSTOM) {
      setCustomMode(true);
      setTouched(false);
      onValidityChange?.(validateTarget(customText).ok);
      const current = validateTarget(customText);
      if (current.ok) onChange(current.value);
      return;
    }
    setCustomMode(false);
    onValidityChange?.(true);
    onChange(choice);
  }

  function handleCustomText(text: string) {
    const digits = text.replace(/[^\d]/g, '').slice(0, String(MAX_TARGET).length);
    setCustomText(digits);
    setTouched(true);
    const next = validateTarget(digits);
    onValidityChange?.(next.ok);
    if (next.ok) onChange(next.value);
  }

  return (
    <View style={styles.picker} testID={testID}>
      <ChoiceChips
        options={options}
        value={customMode ? CUSTOM : value}
        onChange={handleChoice}
        accessibilityLabel={t('common.targetPicker.label')}
        testID={testID ? `${testID}-chips` : undefined}
      />
      {customMode ? (
        <TextField
          label={t('common.targetPicker.customLabel')}
          value={customText}
          onChangeText={handleCustomText}
          onBlur={() => setTouched(true)}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          maxLength={String(MAX_TARGET).length}
          placeholder={t('common.targetPicker.customPlaceholder')}
          hint={t('common.targetPicker.customHint')}
          error={error}
          testID={testID ? `${testID}-custom-input` : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { gap: SPACING.lg },
});
