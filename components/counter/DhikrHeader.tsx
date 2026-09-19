import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n';
import type { Dhikr } from '@/types';

/** Meaning of each built-in Dhikr. Custom Dhikr have none. */
const MEANING_KEYS: Readonly<Record<string, TranslationKey>> = {
  subhanallah: 'common.dhikrMeaning.subhanallah',
  alhamdulillah: 'common.dhikrMeaning.alhamdulillah',
  'allahu-akbar': 'common.dhikrMeaning.allahu-akbar',
  astaghfirullah: 'common.dhikrMeaning.astaghfirullah',
  'la-ilaha-illallah': 'common.dhikrMeaning.la-ilaha-illallah',
  salawat: 'common.dhikrMeaning.salawat',
};

export interface DhikrHeaderProps {
  dhikr: Dhikr;
  onPress: () => void;
}

/** The Dhikr being counted. Pressing it opens the list to choose another one. */
export const DhikrHeader = memo(function DhikrHeader({ dhikr, onPress }: DhikrHeaderProps) {
  const theme = useTheme();
  const { colors, easyMode } = theme;
  const { t } = useTranslation();

  const meaningKey = dhikr.isCustom ? undefined : MEANING_KEYS[dhikr.id];
  const meaning = meaningKey ? t(meaningKey) : undefined;
  const changeLabel = t('counter.changeDhikr');
  const accessibilityLabel = [dhikr.name, meaning, changeLabel].filter(Boolean).join('. ');
  const chevron = I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';

  if (easyMode) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={t('counter.a11y.changeDhikrHint')}
        testID="counter-dhikr-header"
        style={({ pressed }) => [
          styles.easyHeader,
          {
            minHeight: theme.touchTarget,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && { backgroundColor: colors.pressedOverlay },
        ]}
      >
        <AppText variant="title" align="center" numberOfLines={2} style={styles.easyName}>
          {dhikr.name}
        </AppText>
        <Ionicons
          name={chevron}
          size={theme.text('title').fontSize}
          color={colors.primary}
          accessible={false}
          importantForAccessibility="no"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t('counter.a11y.changeDhikrHint')}
      testID="counter-dhikr-header"
      style={({ pressed }) => [
        styles.header,
        { minHeight: theme.touchTarget },
        pressed && { backgroundColor: colors.pressedOverlay },
      ]}
    >
      <AppText variant="title" align="center">
        {dhikr.name}
      </AppText>
      {dhikr.arabic ? (
        <AppText variant="arabic" align="center">
          {dhikr.arabic}
        </AppText>
      ) : null}
      {meaning ? (
        <AppText variant="caption" tone="muted" align="center">
          {meaning}
        </AppText>
      ) : null}
      <View style={styles.changeRow}>
        <Ionicons
          name="swap-horizontal-outline"
          size={theme.text('label').fontSize + 2}
          color={colors.primary}
          accessible={false}
          importantForAccessibility="no"
        />
        <AppText variant="label" tone="primary">
          {changeLabel}
        </AppText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  easyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingStart: SPACING.lg,
    paddingEnd: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  easyName: { flex: 1 },
});
