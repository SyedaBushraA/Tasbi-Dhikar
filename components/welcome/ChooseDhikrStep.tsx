import { Fragment, memo } from 'react';
import { View } from 'react-native';

import { ListRow, RowDivider, Section } from '@/components/ui';
import { DEFAULT_DHIKR } from '@/constants/dhikr';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n';
import type { Dhikr } from '@/types';

import { StepHeader } from './StepHeader';

/** Translation key of the meaning of each built-in Dhikr. */
const MEANING_KEYS: Readonly<Record<string, TranslationKey>> = {
  subhanallah: 'common.dhikrMeaning.subhanallah',
  alhamdulillah: 'common.dhikrMeaning.alhamdulillah',
  'allahu-akbar': 'common.dhikrMeaning.allahu-akbar',
  astaghfirullah: 'common.dhikrMeaning.astaghfirullah',
  'la-ilaha-illallah': 'common.dhikrMeaning.la-ilaha-illallah',
  salawat: 'common.dhikrMeaning.salawat',
};

export interface ChooseDhikrStepProps {
  selectedId: string;
  onSelect: (dhikrId: string) => void;
  focusTitle: boolean;
}

/** Step 1: the built-in Dhikr as a radio list. */
export function ChooseDhikrStep({ selectedId, onSelect, focusTitle }: ChooseDhikrStepProps) {
  const { t } = useTranslation();
  const title = t('welcome.chooseDhikrTitle');

  return (
    <View>
      <StepHeader title={title} hint={t('welcome.chooseDhikrHint')} focusOnMount={focusTitle} />
      <View accessibilityRole="radiogroup" accessibilityLabel={title}>
        <Section>
          {DEFAULT_DHIKR.map((dhikr, index) => {
            const meaningKey = MEANING_KEYS[dhikr.id];
            return (
              <Fragment key={dhikr.id}>
                {index > 0 ? <RowDivider /> : null}
                <DhikrOption
                  dhikr={dhikr}
                  meaning={meaningKey ? t(meaningKey) : undefined}
                  selected={dhikr.id === selectedId}
                  onSelect={onSelect}
                />
              </Fragment>
            );
          })}
        </Section>
      </View>
    </View>
  );
}

interface DhikrOptionProps {
  dhikr: Dhikr;
  meaning: string | undefined;
  selected: boolean;
  onSelect: (dhikrId: string) => void;
}

const DhikrOption = memo(function DhikrOption({
  dhikr,
  meaning,
  selected,
  onSelect,
}: DhikrOptionProps) {
  const { t } = useTranslation();

  return (
    <ListRow
      title={dhikr.name}
      subtitle={meaning}
      selected={selected}
      accessibilityRole="radio"
      accessibilityLabel={
        meaning ? t('welcome.dhikrOption', { name: dhikr.name, meaning }) : dhikr.name
      }
      onPress={() => onSelect(dhikr.id)}
      testID={`welcome-dhikr-${dhikr.id}`}
    />
  );
});
