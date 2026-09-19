import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey, Translations } from '@/i18n';
import type { Dhikr } from '@/types';

type MeaningId = keyof Translations['common']['dhikrMeaning'];

/* Every built-in Dhikr with a translated meaning; adding one to common.ts fails here until it is listed. */
const MEANING_KEYS: { readonly [Id in MeaningId]: `common.dhikrMeaning.${Id}` } = {
  subhanallah: 'common.dhikrMeaning.subhanallah',
  alhamdulillah: 'common.dhikrMeaning.alhamdulillah',
  'allahu-akbar': 'common.dhikrMeaning.allahu-akbar',
  astaghfirullah: 'common.dhikrMeaning.astaghfirullah',
  'la-ilaha-illallah': 'common.dhikrMeaning.la-ilaha-illallah',
  salawat: 'common.dhikrMeaning.salawat',
};

function isMeaningId(id: string): id is MeaningId {
  return Object.prototype.hasOwnProperty.call(MEANING_KEYS, id);
}

function meaningKey(id: string): TranslationKey | undefined {
  return isMeaningId(id) ? MEANING_KEYS[id] : undefined;
}

export interface DhikrRowProps {
  dhikr: Dhikr;
  selected: boolean;
  onSelect: (id: string) => void;
  testID?: string;
}

/**
 * One choosable Dhikr: its name, what it means (or its own target), the Arabic
 * script and a radio mark. Announced as one radio button.
 */
export const DhikrRow = memo(function DhikrRow({ dhikr, selected, onSelect, testID }: DhikrRowProps) {
  const theme = useTheme();
  const { colors, easyMode } = theme;
  const { t, n } = useTranslation();

  const meaning = meaningKey(dhikr.id);
  const subtitle =
    dhikr.target !== undefined
      ? t('dhikr.customTargetLabel', { target: n(dhikr.target) })
      : meaning
        ? t(meaning)
        : undefined;
  const showArabic = !easyMode && dhikr.arabic !== undefined;
  const markSize = theme.text('body').fontSize + 8;

  return (
    <Pressable
      onPress={() => onSelect(dhikr.id)}
      accessibilityRole="radio"
      accessibilityLabel={subtitle ? `${dhikr.name}, ${subtitle}` : dhikr.name}
      accessibilityHint={t('dhikr.a11y.selectHint')}
      accessibilityState={{ selected, checked: selected }}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { minHeight: theme.touchTarget + SPACING.sm },
        pressed && { backgroundColor: colors.pressedOverlay },
      ]}
    >
      <View style={styles.texts}>
        <AppText variant="body" style={selected ? styles.selectedName : undefined}>
          {dhikr.name}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {showArabic ? (
        <AppText variant="arabic" style={styles.arabic}>
          {dhikr.arabic}
        </AppText>
      ) : null}
      {/* Both states have a shape, so the choice is never shown by colour alone. */}
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={markSize}
        color={selected ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  texts: { flex: 1, gap: 2 },
  selectedName: { fontWeight: '700' },
  // Smaller than the counter's Arabic so long phrases share the row with the name.
  arabic: { flexShrink: 1, maxWidth: '45%', fontSize: 22, lineHeight: 36 },
});
