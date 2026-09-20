import { router } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MethodOption } from '@/components/prayerSettings/MethodOption';
import { MethodPreview } from '@/components/prayerSettings/MethodPreview';
import { SuggestionTag } from '@/components/prayerSettings/SuggestionTag';
import { countryLabel } from '@/components/prayerSettings/prayerText';
import { SectionBlock } from '@/components/settings/SectionBlock';
import {
  AppButton,
  AppText,
  ChoiceChips,
  type ChoiceOption,
  RowDivider,
  Screen,
  Section,
} from '@/components/ui';
import { CALCULATION_METHOD_IDS, suggestedAsrMethod, suggestedMethod } from '@/constants/prayer';
import { SPACING } from '@/constants/theme';
import { useToday } from '@/hooks/useToday';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector } from '@/state';
import type { AsrMethod, PrayerDay } from '@/types';
import { calculatePrayerDay } from '@/utils/prayer';

/** Choosing the calculation method and the Asr time, with today's times as a preview. */
export default function PrayerMethodScreen() {
  const prayer = useAppSelector((state) => state.prayer);
  const actions = useAppActions();
  const { t, locale } = useTranslation();
  const today = useToday();

  // Nothing is stored until the user accepts the choice at the bottom.
  const [method, setMethod] = useState(prayer.method);
  const [asrMethod, setAsrMethod] = useState<AsrMethod>(prayer.asrMethod);

  const countryCode = prayer.location?.countryCode;
  const country = countryLabel(countryCode, locale);
  const suggestedMethodId = country ? suggestedMethod(countryCode) : null;
  const suggestedAsr = country ? suggestedAsrMethod(countryCode) : null;

  const methodSuggestion = country ? t('prayerSettings.calculation.suggested', { country }) : null;
  const asrSuggestion =
    country && suggestedAsr
      ? t('prayerSettings.calculation.asrSuggested', {
          country,
          asr: t(`prayer.asrMethods.${suggestedAsr}`),
        })
      : null;

  const preview = useMemo<PrayerDay | null>(() => {
    const location = prayer.location;
    if (!location) return null;
    return calculatePrayerDay({ ...prayer, method, asrMethod }, location, today);
  }, [prayer, method, asrMethod, today]);

  const asrOptions = useMemo<ChoiceOption<AsrMethod>[]>(
    () => [
      { value: 'standard', label: t('prayer.asrMethods.standard') },
      { value: 'hanafi', label: t('prayer.asrMethods.hanafi') },
    ],
    [t],
  );

  function confirm(): void {
    actions.confirmCalculation(method, asrMethod);
    // Back to the screen the user came from, which may be the prayer settings.
    if (router.canGoBack()) router.back();
    else router.replace('/prayer');
  }

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} testID="prayer-method-screen">
      <AppText variant="body" tone="muted" style={styles.intro}>
        {t('prayerSettings.calculation.intro')}
      </AppText>

      <Section title={t('prayerSettings.methodTitle')}>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('prayerSettings.methodTitle')}>
          {CALCULATION_METHOD_IDS.map((id, index) => (
            <Fragment key={id}>
              {index > 0 ? <RowDivider /> : null}
              <MethodOption
                method={id}
                selected={id === method}
                suggestion={id === suggestedMethodId ? methodSuggestion : null}
                onSelect={() => setMethod(id)}
                testID={`prayer-method-${id}`}
              />
            </Fragment>
          ))}
        </View>
      </Section>

      <Section title={t('prayerSettings.asrTitle')}>
        <SectionBlock>
          <ChoiceChips
            options={asrOptions}
            value={asrMethod}
            onChange={setAsrMethod}
            accessibilityLabel={t('prayerSettings.asrTitle')}
            testID="prayer-method-asr"
          />
          <AppText variant="caption" tone="muted">
            {t('prayerSettings.calculation.asrExplanation')}
          </AppText>
          {asrSuggestion ? <SuggestionTag label={asrSuggestion} /> : null}
        </SectionBlock>
      </Section>

      <MethodPreview day={preview} testID="prayer-method-preview" />

      <AppButton
        icon="checkmark"
        label={t('prayerSettings.calculation.use')}
        onPress={confirm}
        fullWidth
        testID="prayer-method-save"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: SPACING.xl },
});
