import { router } from 'expo-router';
import { memo } from 'react';

import { ListRow, RowDivider, Section, ToggleRow } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { selectionFeedback } from '@/services/haptics';
import { playTick } from '@/services/sound';
import { useAppActions } from '@/state';

export interface CountingSectionProps {
  defaultTarget: number;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

/** Everything that shapes a counting round: the default target and the feedback per count. */
export const CountingSection = memo(function CountingSection({
  defaultTarget,
  hapticsEnabled,
  soundEnabled,
}: CountingSectionProps) {
  const { t, tCount, n } = useTranslation();
  const actions = useAppActions();

  function handleHaptics(next: boolean) {
    actions.updateSettings({ hapticsEnabled: next });
    // One sample, so the user knows what they just turned on.
    if (next) selectionFeedback();
  }

  function handleSound(next: boolean) {
    actions.updateSettings({ soundEnabled: next });
    if (next) playTick();
  }

  // "33 times" says more than the bare number on its own.
  const targetLabel = `${t('settings.defaultTarget.title')}, ${tCount('common.targetPicker.times', defaultTarget)}`;

  return (
    <Section title={t('settings.counting.title')}>
      <ListRow
        title={t('settings.defaultTarget.title')}
        subtitle={t('settings.defaultTarget.description')}
        value={n(defaultTarget)}
        showChevron
        onPress={() => router.push({ pathname: '/target', params: { mode: 'default' } })}
        accessibilityLabel={targetLabel}
        accessibilityHint={t('settings.defaultTarget.change')}
        testID="settings-default-target"
      />
      <RowDivider />
      <ToggleRow
        title={t('settings.haptics.title')}
        description={t('settings.haptics.description')}
        value={hapticsEnabled}
        onValueChange={handleHaptics}
        testID="settings-haptics"
      />
      <RowDivider />
      <ToggleRow
        title={t('settings.sound.title')}
        description={t('settings.sound.description')}
        value={soundEnabled}
        onValueChange={handleSound}
        testID="settings-sound"
      />
    </Section>
  );
});
