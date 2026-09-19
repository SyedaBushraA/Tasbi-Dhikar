import { Image, StyleSheet, View } from 'react-native';

import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

import { StepHeader } from './StepHeader';

const ICON_SIZE = 120;

export interface IntroStepProps {
  focusTitle: boolean;
}

/** The first thing a new user sees: the icon, a greeting and what the app is for. */
export function IntroStep({ focusTitle }: IntroStepProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.intro}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={styles.icon}
        resizeMode="contain"
        accessible={false}
        accessibilityIgnoresInvertColors
        importantForAccessibility="no"
      />
      <StepHeader
        title={t('welcome.title')}
        hint={t('welcome.subtitle')}
        focusOnMount={focusTitle}
        align="center"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', paddingVertical: SPACING.xxl },
  icon: { width: ICON_SIZE, height: ICON_SIZE, marginBottom: SPACING.xl },
});
