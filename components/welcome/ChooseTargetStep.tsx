import { View } from 'react-native';

import { TargetPicker } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';

import { StepHeader } from './StepHeader';

export interface ChooseTargetStepProps {
  target: number;
  onChange: (target: number) => void;
  onValidityChange: (valid: boolean) => void;
  focusTitle: boolean;
}

/** Step 2: how many times to count per round. */
export function ChooseTargetStep({
  target,
  onChange,
  onValidityChange,
  focusTitle,
}: ChooseTargetStepProps) {
  const { t } = useTranslation();

  return (
    <View>
      <StepHeader
        title={t('welcome.chooseTargetTitle')}
        hint={t('welcome.chooseTargetHint')}
        focusOnMount={focusTitle}
      />
      <TargetPicker
        value={target}
        onChange={onChange}
        onValidityChange={onValidityChange}
        testID="welcome-target"
      />
    </View>
  );
}
