import { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface LocateButtonProps {
  /** The position is being read; the button waits and says so. */
  busy: boolean;
  onPress: () => void;
  testID?: string;
}

/** The one button that asks for the location permission, with its waiting state. */
export function LocateButton({ busy, onPress, testID }: LocateButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const busyText = t('location.locate.busy');

  useEffect(() => {
    // iOS has no live regions, so the waiting state is spoken once.
    if (busy && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(busyText);
  }, [busy, busyText]);

  return (
    <View style={styles.wrapper}>
      <AppButton
        icon="navigate-outline"
        label={t('location.useMyLocation')}
        onPress={onPress}
        disabled={busy}
        fullWidth
        accessibilityHint={t('location.a11y.useMyLocationHint')}
        testID={testID}
      />
      {busy ? (
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={busyText}
          style={styles.busy}
          testID={testID ? `${testID}-busy` : undefined}
        >
          <ActivityIndicator
            color={colors.primary}
            accessible={false}
            importantForAccessibility="no"
          />
          <AppText variant="caption" tone="muted">
            {busyText}
          </AppText>
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          {t('location.locate.hint')}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: SPACING.sm },
  busy: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
});
