import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { type City, cityLabel } from '@/constants/places';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface CityRowProps {
  city: City;
  onSelect: (city: City) => void;
  testID?: string;
}

/** One city in the search results. The whole row is the touch target. */
export const CityRow = memo(function CityRow({ city, onSelect, testID }: CityRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const where = [city.region, city.countryName].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={() => onSelect(city)}
      accessibilityRole="button"
      accessibilityLabel={cityLabel(city)}
      accessibilityHint={t('location.a11y.cityHint')}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { minHeight: theme.touchTarget + SPACING.sm },
        pressed && { backgroundColor: theme.colors.pressedOverlay },
      ]}
    >
      <View style={styles.texts}>
        <AppText variant="label">{city.name}</AppText>
        {where ? (
          <AppText variant="caption" tone="muted">
            {where}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  texts: { gap: 2 },
});
