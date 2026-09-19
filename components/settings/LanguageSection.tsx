import { memo, useMemo } from 'react';

import { ChoiceChips, type ChoiceOption, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useAppActions } from '@/state';
import type { LanguageCode } from '@/types';

import { SectionBlock } from './SectionBlock';

const AVAILABLE_LANGUAGES = SUPPORTED_LANGUAGES.filter((language) => language.available);

export interface LanguageSectionProps {
  language: LanguageCode;
}

/** Language choice. Hidden while only one translation ships, as there is nothing to choose. */
export const LanguageSection = memo(function LanguageSection({ language }: LanguageSectionProps) {
  const { t } = useTranslation();
  const actions = useAppActions();

  const options = useMemo<ChoiceOption<LanguageCode>[]>(
    () =>
      AVAILABLE_LANGUAGES.map((info) => ({
        value: info.code,
        label: info.nativeName,
        // The English name helps a screen reader that cannot pronounce the native one.
        accessibilityLabel:
          info.nativeName === info.name ? info.name : `${info.nativeName}, ${info.name}`,
      })),
    [],
  );

  if (AVAILABLE_LANGUAGES.length < 2) return null;

  return (
    <Section title={t('settings.language.title')}>
      <SectionBlock>
        <ChoiceChips
          options={options}
          value={language}
          onChange={(next) => actions.updateSettings({ language: next })}
          accessibilityLabel={t('settings.language.title')}
          testID="settings-language"
        />
      </SectionBlock>
    </Section>
  );
});
