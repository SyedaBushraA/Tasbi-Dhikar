import { memo, useMemo } from 'react';

import {
  AppText,
  ChoiceChips,
  type ChoiceOption,
  RowDivider,
  Section,
  ToggleRow,
} from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions } from '@/state';
import type { ClockFormat, ThemePreference } from '@/types';

import { SectionBlock } from './SectionBlock';

export interface AppearanceSectionProps {
  preference: ThemePreference;
  easyMode: boolean;
  clockFormat: ClockFormat;
}

/** Theme choice, Easy Mode and how clock times are written. */
export const AppearanceSection = memo(function AppearanceSection({
  preference,
  easyMode,
  clockFormat,
}: AppearanceSectionProps) {
  const { t } = useTranslation();
  const actions = useAppActions();

  const options = useMemo<ChoiceOption<ThemePreference>[]>(
    () => [
      { value: 'light', label: t('settings.appearance.light') },
      { value: 'dark', label: t('settings.appearance.dark') },
      { value: 'system', label: t('settings.appearance.system') },
    ],
    [t],
  );

  const clockOptions = useMemo<ChoiceOption<ClockFormat>[]>(
    () => [
      { value: '12h', label: t('settings.clockFormat.twelveHour') },
      { value: '24h', label: t('settings.clockFormat.twentyFourHour') },
    ],
    [t],
  );

  return (
    <Section title={t('settings.appearance.title')}>
      <SectionBlock>
        <ChoiceChips
          options={options}
          value={preference}
          onChange={(theme) => actions.updateSettings({ theme })}
          accessibilityLabel={t('settings.appearance.title')}
          testID="settings-theme"
        />
        <AppText variant="caption" tone="muted">
          {t('settings.appearance.systemHint')}
        </AppText>
      </SectionBlock>
      <RowDivider />
      <ToggleRow
        title={t('settings.easyMode.title')}
        description={t('settings.easyMode.description')}
        value={easyMode}
        onValueChange={(next) => actions.updateSettings({ easyMode: next })}
        testID="settings-easy-mode"
      />
      <RowDivider />
      <SectionBlock>
        {/* The chips carry no title of their own, so the label names them on screen too. */}
        <AppText variant="label">{t('settings.clockFormat.title')}</AppText>
        <ChoiceChips
          options={clockOptions}
          value={clockFormat}
          onChange={(next) => actions.updateSettings({ clockFormat: next })}
          accessibilityLabel={t('settings.clockFormat.title')}
          testID="settings-clock-format"
        />
        <AppText variant="caption" tone="muted">
          {t('settings.clockFormat.description')}
        </AppText>
      </SectionBlock>
    </Section>
  );
});
