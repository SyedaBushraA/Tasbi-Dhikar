import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type KeyboardTypeOptions, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, TextField } from '@/components/ui';
import { nearestCity } from '@/constants/places';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerLocation } from '@/types';
import {
  formatCoordinate,
  isValidLatitude,
  isValidLongitude,
  roundCoordinate,
} from '@/utils/prayer';

/** As long as a stored place name may be. */
const MAX_NAME_LENGTH = 80;
/** A listed city this close lends its country and time zone to the coordinates. */
const NEAREST_CITY_MAX_KM = 100;

// South and west need a minus sign, which neither decimal pad offers: the
// punctuation keyboard has it on iPhone, the numeric keypad on Android.
const COORDINATE_KEYBOARD = Platform.select<KeyboardTypeOptions>({
  ios: 'numbers-and-punctuation',
  default: 'numeric',
});

/** Accepts "17.38" as well as "17,38", with an optional sign. */
function parseCoordinate(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export interface CoordinatesFormProps {
  onSubmit: (location: PrayerLocation) => void;
  testID?: string;
}

/** Latitude and longitude by hand, for places that are not in the city list. */
export function CoordinatesForm({ onSubmit, testID }: CoordinatesFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  // Kept closed: most people find their place in the list above.
  const [open, setOpen] = useState(false);
  const [latitudeText, setLatitudeText] = useState('');
  const [longitudeText, setLongitudeText] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [errors, setErrors] = useState({ latitude: false, longitude: false });

  function save(): void {
    const typedLatitude = parseCoordinate(latitudeText);
    const typedLongitude = parseCoordinate(longitudeText);
    const latitudeBad = typedLatitude === null || !isValidLatitude(typedLatitude);
    const longitudeBad = typedLongitude === null || !isValidLongitude(typedLongitude);
    setErrors({ latitude: latitudeBad, longitude: longitudeBad });
    if (typedLatitude === null || typedLongitude === null || latitudeBad || longitudeBad) return;

    // Kept no more precise than the calculation needs, like the position the
    // phone reports, so only rounded coordinates are ever stored.
    const latitude = roundCoordinate(typedLatitude);
    const longitude = roundCoordinate(typedLongitude);

    // Only to fill in the country and the time zone.
    const city = nearestCity({ latitude, longitude }, NEAREST_CITY_MAX_KM);
    const name =
      placeName.trim() ||
      `${formatCoordinate(latitude, 'latitude')}, ${formatCoordinate(longitude, 'longitude')}`;

    onSubmit({
      source: 'coordinates',
      name,
      ...(city?.countryCode ? { countryCode: city.countryCode } : {}),
      latitude,
      longitude,
      ...(city?.timeZone ? { timeZone: city.timeZone } : {}),
      updatedAt: Date.now(),
    });
  }

  function handleLatitude(text: string): void {
    setLatitudeText(text);
    if (errors.latitude) setErrors((current) => ({ ...current, latitude: false }));
  }

  function handleLongitude(text: string): void {
    setLongitudeText(text);
    if (errors.longitude) setErrors((current) => ({ ...current, longitude: false }));
  }

  const toggleLabel = open ? t('location.coordinates.hide') : t('location.coordinates.show');

  return (
    <View style={styles.section} testID={testID}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={toggleLabel}
        accessibilityHint={
          open ? t('location.a11y.hideCoordinates') : t('location.a11y.showCoordinates')
        }
        accessibilityState={{ expanded: open }}
        testID={testID ? `${testID}-toggle` : undefined}
        style={({ pressed }) => [
          styles.toggle,
          { minHeight: theme.touchTarget },
          pressed && { backgroundColor: theme.colors.pressedOverlay },
        ]}
      >
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={theme.text('label').fontSize + 4}
          color={theme.colors.primary}
          accessible={false}
          importantForAccessibility="no"
        />
        <AppText variant="label" tone="primary">
          {toggleLabel}
        </AppText>
      </Pressable>

      {open ? (
        <View style={styles.form}>
          <AppText variant="caption" tone="muted">
            {t('location.coordinates.description')}
          </AppText>
          <TextField
            label={t('location.coordinates.latitude')}
            placeholder={t('location.coordinates.latitudePlaceholder')}
            hint={t('location.coordinates.latitudeHint')}
            error={errors.latitude ? t('location.coordinates.errors.latitude') : null}
            value={latitudeText}
            onChangeText={handleLatitude}
            keyboardType={COORDINATE_KEYBOARD}
            autoCorrect={false}
            returnKeyType="next"
            maxLength={12}
            testID={testID ? `${testID}-latitude` : undefined}
          />
          <TextField
            label={t('location.coordinates.longitude')}
            placeholder={t('location.coordinates.longitudePlaceholder')}
            hint={t('location.coordinates.longitudeHint')}
            error={errors.longitude ? t('location.coordinates.errors.longitude') : null}
            value={longitudeText}
            onChangeText={handleLongitude}
            keyboardType={COORDINATE_KEYBOARD}
            autoCorrect={false}
            returnKeyType="next"
            maxLength={12}
            testID={testID ? `${testID}-longitude` : undefined}
          />
          <TextField
            label={t('location.coordinates.placeName')}
            placeholder={t('location.coordinates.placeNamePlaceholder')}
            value={placeName}
            onChangeText={setPlaceName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={MAX_NAME_LENGTH}
            testID={testID ? `${testID}-name` : undefined}
          />
          <AppButton
            icon="checkmark"
            label={t('location.coordinates.save')}
            onPress={save}
            fullWidth
            accessibilityHint={t('location.a11y.saveCoordinatesHint')}
            testID={testID ? `${testID}-save` : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACING.xl },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  form: { gap: SPACING.lg, paddingTop: SPACING.md },
});
